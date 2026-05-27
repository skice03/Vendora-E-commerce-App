using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe.Checkout;
using Vendora.Api.Data;
using Vendora.Api.Models;

namespace Vendora.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public PaymentController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        /// <summary>
        /// Creates a Stripe Checkout Session and an order with AwaitingPayment status.
        /// Returns the Stripe Checkout URL for the frontend to redirect to.
        /// </summary>
        [HttpPost("create-checkout-session")]
        public async Task<IActionResult> CreateCheckoutSessionAsync([FromBody] CreateCheckoutRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ShippingAddress))
            {
                return BadRequest(new { message = "Shipping address is required." });
            }

            if (request.Items == null || request.Items.Count == 0)
            {
                return BadRequest(new { message = "Order must contain at least one item." });
            }

            var userId = GetCurrentUserId();
            if (userId == 0)
            {
                return Unauthorized(new { message = "Authentication required." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var orderItems = new List<OrderItem>();
                decimal totalAmount = 0;
                var lineItems = new List<SessionLineItemOptions>();

                foreach (var item in request.Items)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);

                    if (product == null || product.IsDeleted)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { message = $"Product with ID {item.ProductId} is not available." });
                    }

                    if (product.StockQuantity < item.Quantity)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new
                        {
                            message = $"Insufficient stock for \"{product.Name}\". Available: {product.StockQuantity}, Requested: {item.Quantity}."
                        });
                    }

                    // Decrement stock
                    product.StockQuantity -= item.Quantity;

                    var orderItem = new OrderItem
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = product.Price
                    };

                    orderItems.Add(orderItem);
                    totalAmount += product.Price * item.Quantity;

                    // Build Stripe line item
                    lineItems.Add(new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmountDecimal = product.Price * 100, // Stripe uses cents
                            Currency = "usd",
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = product.Name,
                                Description = product.Description?.Length > 0 ? product.Description : null,
                                // Only pass absolute URLs to Stripe (uploaded images are relative paths)
                                Images = !string.IsNullOrEmpty(product.ImageUrl) && product.ImageUrl.StartsWith("http")
                                    ? new List<string> { product.ImageUrl } : null,
                            },
                        },
                        Quantity = item.Quantity,
                    });
                }

                // REQ-65/66: Apply promo code discount — 10% off entire order when subtotal >= $50
                decimal preDiscountSubtotal = totalAmount;
                decimal promoDiscount = 0;
                if (!string.IsNullOrWhiteSpace(request.PromoCode) && request.PromoCode.Trim().ToUpper() == "SALE10")
                {
                    if (totalAmount >= 50m)
                    {
                        promoDiscount = Math.Round(totalAmount * 0.10m, 2);
                        totalAmount -= promoDiscount;
                    }
                }

                // Calculate shipping cost based on pre-discount subtotal
                const decimal FREE_SHIPPING_THRESHOLD = 75m;
                const decimal DEFAULT_SHIPPING_COST = 9.99m;
                decimal shippingCost = preDiscountSubtotal >= FREE_SHIPPING_THRESHOLD ? 0m : DEFAULT_SHIPPING_COST;

                // Include shipping in the order total
                totalAmount += shippingCost;

                // Create order with AwaitingPayment status
                var order = new Order
                {
                    UserId = userId,
                    TotalAmount = totalAmount,
                    Status = "AwaitingPayment",
                    PaymentStatus = "Unpaid",
                    ShippingAddress = request.ShippingAddress,
                    CreatedAt = DateTime.UtcNow,
                    Items = orderItems
                };

                await _context.Orders.AddAsync(order);
                await _context.SaveChangesAsync();

                // Create Stripe Checkout Session
                var frontendUrl = "http://localhost:5173";
                var sessionOptions = new SessionCreateOptions
                {
                    PaymentMethodTypes = new List<string> { "card" },
                    LineItems = lineItems,
                    Mode = "payment",
                    SuccessUrl = $"{frontendUrl}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
                    CancelUrl = $"{frontendUrl}/checkout?cancelled=true",
                    Metadata = new Dictionary<string, string>
                    {
                        { "orderId", order.Id.ToString() }
                    },
                    CustomerEmail = (await _context.Users.FindAsync(userId))?.Email,
                    ShippingOptions = new List<SessionShippingOptionOptions>
                    {
                        new SessionShippingOptionOptions
                        {
                            ShippingRateData = new SessionShippingOptionShippingRateDataOptions
                            {
                                Type = "fixed_amount",
                                FixedAmount = new SessionShippingOptionShippingRateDataFixedAmountOptions
                                {
                                    Amount = (long)(shippingCost * 100),
                                    Currency = "usd",
                                },
                                DisplayName = shippingCost == 0 ? "Free Shipping" : "Standard Shipping",
                            },
                        },
                    },
                };

                // Apply promo discount via Stripe Coupon if applicable
                if (promoDiscount > 0)
                {
                    var couponService = new Stripe.CouponService();
                    var coupon = await couponService.CreateAsync(new Stripe.CouponCreateOptions
                    {
                        AmountOff = (long)(promoDiscount * 100),
                        Currency = "usd",
                        Duration = "once",
                        Name = "SALE10 — 10% Off",
                    });
                    sessionOptions.Discounts = new List<SessionDiscountOptions>
                    {
                        new SessionDiscountOptions { Coupon = coupon.Id }
                    };
                }

                var sessionService = new SessionService();
                var session = await sessionService.CreateAsync(sessionOptions);

                // Save Stripe session ID to order
                order.StripeSessionId = session.Id;
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    sessionUrl = session.Url,
                    sessionId = session.Id,
                    orderId = order.Id
                });
            }
            catch (Stripe.StripeException ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = $"Payment error: {ex.Message}" });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "An error occurred while processing your payment. Please try again." });
            }
        }

        /// <summary>
        /// Verifies a Stripe Checkout Session after the customer returns from payment.
        /// Updates the order status from AwaitingPayment to Pending (ready for fulfillment).
        /// </summary>
        [HttpPost("verify-session")]
        public async Task<IActionResult> VerifySessionAsync([FromBody] VerifySessionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SessionId))
            {
                return BadRequest(new { message = "Session ID is required." });
            }

            try
            {
                var sessionService = new SessionService();
                var session = await sessionService.GetAsync(request.SessionId);

                // Find the order linked to this session
                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.StripeSessionId == request.SessionId);

                if (order == null)
                {
                    return NotFound(new { message = "Order not found for this session." });
                }

                if (session.PaymentStatus == "paid")
                {
                    order.Status = "Pending"; // Ready for fulfillment
                    order.StatusChangedAt = DateTime.UtcNow; // REQ-72
                    order.PaymentStatus = "Paid";
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        success = true,
                        orderId = order.Id,
                        totalAmount = order.TotalAmount,
                        status = order.Status,
                        paymentStatus = order.PaymentStatus
                    });
                }
                else
                {
                    return Ok(new
                    {
                        success = false,
                        orderId = order.Id,
                        paymentStatus = session.PaymentStatus,
                        message = "Payment has not been completed."
                    });
                }
            }
            catch (Stripe.StripeException ex)
            {
                return StatusCode(500, new { message = $"Payment verification error: {ex.Message}" });
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                           ?? User.FindFirst("sub");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            return 0;
        }
    }

    // Request DTOs
    public class CreateCheckoutRequest
    {
        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Shipping address is required.")]
        public string ShippingAddress { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "At least one item is required.")]
        [System.ComponentModel.DataAnnotations.MinLength(1, ErrorMessage = "Order must contain at least one item.")]
        public List<CheckoutItem> Items { get; set; } = new();

        /// <summary>
        /// Optional promo code applied at checkout (REQ-65/66).
        /// </summary>
        public string? PromoCode { get; set; }
    }

    public class CheckoutItem
    {
        [System.ComponentModel.DataAnnotations.Range(1, int.MaxValue, ErrorMessage = "Invalid product ID.")]
        public int ProductId { get; set; }

        [System.ComponentModel.DataAnnotations.Range(1, 100, ErrorMessage = "Quantity must be between 1 and 100.")]
        public int Quantity { get; set; }
    }

    public class VerifySessionRequest
    {
        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Session ID is required.")]
        public string SessionId { get; set; } = string.Empty;
    }
}
