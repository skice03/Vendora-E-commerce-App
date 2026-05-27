using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vendora.Api.Data;
using Vendora.Api.Models;

namespace Vendora.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ───────────────────────────────────────────────
        //  Customer Endpoints
        // ───────────────────────────────────────────────

        /// <summary>
        /// Places a new order using a database transaction (REQ-23 to REQ-29).
        /// Validates stock, decrements quantities, and creates order + items atomically.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> PlaceOrderAsync([FromBody] CreateOrderRequest request)
        {
            // Validate request
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

            // REQ-24: Begin database transaction for ACID compliance
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var orderItems = new List<OrderItem>();
                decimal totalAmount = 0;

                foreach (var item in request.Items)
                {
                    // Load product with tracking to update stock
                    var product = await _context.Products.FindAsync(item.ProductId);

                    if (product == null || product.IsDeleted)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { message = $"Product with ID {item.ProductId} is not available." });
                    }

                    // REQ-28: Check stock — rollback if insufficient
                    if (product.StockQuantity < item.Quantity)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new
                        {
                            message = $"Insufficient stock for \"{product.Name}\". Available: {product.StockQuantity}, Requested: {item.Quantity}."
                        });
                    }

                    // REQ-27: Decrement stock
                    product.StockQuantity -= item.Quantity;

                    var orderItem = new OrderItem
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = product.Price
                    };

                    orderItems.Add(orderItem);
                    totalAmount += product.Price * item.Quantity;
                }

                // REQ-25: Insert into Orders table
                var order = new Order
                {
                    UserId = userId,
                    TotalAmount = totalAmount,
                    Status = "Pending",
                    ShippingAddress = request.ShippingAddress,
                    CreatedAt = DateTime.UtcNow,
                    // REQ-26: Insert into OrderItems table
                    Items = orderItems
                };

                await _context.Orders.AddAsync(order);
                await _context.SaveChangesAsync();

                // Commit transaction — all stock decrements + order creation succeed atomically
                await transaction.CommitAsync();

                // REQ-29: Frontend will call clearCart() on success
                return StatusCode(201, new
                {
                    message = "Order placed successfully!",
                    orderId = order.Id,
                    totalAmount = order.TotalAmount,
                    status = order.Status
                });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "An error occurred while placing your order. Please try again." });
            }
        }

        /// <summary>
        /// Retrieves orders for the authenticated customer (REQ-30 to REQ-33).
        /// Only returns orders belonging to the requesting user.
        /// </summary>
        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrdersAsync()
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
            {
                return Unauthorized();
            }

            // REQ-30: Fetch orders by authenticated user's ID
            // REQ-31: Sort by date (newest first)
            // REQ-33: Authorization — only returns own orders
            var orders = await _context.Orders
                .Where(order => order.UserId == userId)
                .Include(order => order.Items)
                .ThenInclude(item => item.Product)
                .ThenInclude(product => product!.Images)
                .OrderByDescending(order => order.CreatedAt)
                .Select(order => new
                {
                    order.Id,
                    order.TotalAmount,
                    // REQ-32: Display order status
                    order.Status,
                    order.PaymentStatus,
                    order.CreatedAt,
                    order.ShippingAddress,
                    ItemsCount = order.Items.Count,
                    Items = order.Items.Select(item => new
                    {
                        item.ProductId,
                        ProductName = item.Product != null ? item.Product.Name : "Unknown",
                        ProductImage = item.Product != null
                            ? (item.Product.Images.Any(img => img.IsPrimary)
                                ? item.Product.Images.First(img => img.IsPrimary).ImageUrl
                                : (item.Product.Images.Any()
                                    ? item.Product.Images.OrderBy(img => img.DisplayOrder).First().ImageUrl
                                    : ""))
                            : "",
                        item.Quantity,
                        item.UnitPrice
                    })
                })
                .ToListAsync();

            return Ok(orders);
        }

        // ───────────────────────────────────────────────
        //  Admin Endpoints
        // ───────────────────────────────────────────────

        /// <summary>
        /// Retrieves a master grid of all orders (REQ-70).
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetOrdersAsync()
        {
            var orders = await _context.Orders
                .Include(order => order.User)
                .Include(order => order.Items)
                .ThenInclude(item => item.Product)
                .OrderByDescending(order => order.CreatedAt)
                .Select(order => new
                {
                    order.Id,
                    order.TotalAmount,
                    order.Status,
                    order.PaymentStatus,
                    order.CreatedAt,
                    order.ShippingAddress,
                    CustomerName = order.User != null ? order.User.FirstName + " " + order.User.LastName : "Deleted Account",
                    CustomerEmail = order.User != null ? order.User.Email : "N/A",
                    // REQ-74: Customer profile info accessible from order details
                    CustomerId = order.UserId,
                    CustomerSince = order.User != null ? order.User.CreatedAt : DateTime.MinValue,
                    CustomerOrderCount = order.UserId.HasValue
                        ? _context.Orders.Count(o => o.UserId == order.UserId)
                        : 0,
                    CustomerTotalSpent = order.UserId.HasValue
                        ? _context.Orders
                            .Where(o => o.UserId == order.UserId && o.Status != "Cancelled")
                            .Sum(o => o.TotalAmount)
                        : 0m,
                    ItemsCount = order.Items.Count,
                    Items = order.Items.Select(item => new
                    {
                        item.ProductId,
                        ProductName = item.Product != null ? item.Product.Name : "Unknown",
                        item.Quantity,
                        item.UnitPrice
                    })
                })
                .ToListAsync();

            return Ok(orders);
        }

        /// <summary>
        /// Updates the order status (REQ-71).
        /// Records a timestamp via audit log (REQ-72, REQ-78).
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatusAsync(int id, [FromBody] UpdateOrderStatusRequest request)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound();
            }

            order.Status = request.Status;
            order.StatusChangedAt = DateTime.UtcNow; // REQ-72: Record status change timestamp

            // REQ-78 & REQ-79: audit with real Admin ID
            var adminId = GetCurrentUserId();
            _context.AuditLogs.Add(new AuditLog
            {
                AdminId = adminId,
                ActionType = "UPDATE_STATUS",
                TargetTable = "Orders",
                TargetId = order.Id.ToString(),
                Details = $"Order status changed to {request.Status}."
            });

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Order status updated successfully", Status = order.Status });
        }

        /// <summary>
        /// Cancels an order and replenishes stock (REQ-73).
        /// </summary>
        [HttpPost("{id}/cancel")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CancelOrderAsync(int id)
        {
            var order = await _context.Orders
                .Include(order => order.Items)
                .ThenInclude(item => item.Product)
                .FirstOrDefaultAsync(order => order.Id == id);

            if (order == null)
            {
                return NotFound();
            }

            if (order.Status == "Cancelled")
            {
                return BadRequest("Order is already cancelled.");
            }

            if (order.Status == "Delivered")
            {
                return BadRequest("Delivered orders cannot be cancelled.");
            }

            order.Status = "Cancelled";
            order.StatusChangedAt = DateTime.UtcNow; // REQ-72: Record status change timestamp

            // Replenish stock (REQ-73)
            foreach (var item in order.Items)
            {
                if (item.Product != null)
                {
                    item.Product.StockQuantity += item.Quantity;
                }
            }

            // REQ-78 & REQ-79: Audit log with real Admin ID
            var adminId = GetCurrentUserId();
            _context.AuditLogs.Add(new AuditLog
            {
                AdminId = adminId,
                ActionType = "CANCEL_ORDER",
                TargetTable = "Orders",
                TargetId = order.Id.ToString(),
                Details = $"Order cancelled and stock replenished."
            });

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Order cancelled and stock replenished", Status = order.Status });
        }

        // ───────────────────────────────────────────────
        //  Helpers
        // ───────────────────────────────────────────────

        /// <summary>
        /// Extracts the authenticated user's ID from the JWT token (REQ-79).
        /// </summary>
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
}
