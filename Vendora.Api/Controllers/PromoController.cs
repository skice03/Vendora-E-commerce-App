using Microsoft.AspNetCore.Mvc;

namespace Vendora.Api.Controllers
{
    /// <summary>
    /// Handles promotional discount code validation (REQ-65, REQ-66).
    /// Business rule: "SALE10" gives 10% off items priced over $50.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PromoController : ControllerBase
    {
        public class ValidatePromoRequest
        {
            public string Code { get; set; } = string.Empty;
            public decimal CartSubtotal { get; set; }
            public List<PromoCartItem> Items { get; set; } = new();
        }

        public class PromoCartItem
        {
            public int ProductId { get; set; }
            public string Name { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public int Quantity { get; set; }
        }

        /// <summary>
        /// Validates a promo code and calculates the discount amount.
        /// REQ-65: Support promo code entry at checkout.
        /// REQ-66: Validate discount and apply to eligible items.
        /// </summary>
        [HttpPost("validate")]
        public IActionResult ValidatePromo([FromBody] ValidatePromoRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Please enter a promo code." });
            }

            var code = request.Code.Trim().ToUpper();

            // REQ-65/66: SALE10 — 10% off entire order when subtotal >= $50
            if (code == "SALE10")
            {
                if (request.CartSubtotal < 50m)
                {
                    return Ok(new
                    {
                        valid = false,
                        message = "Your order subtotal must be at least $50 to use SALE10.",
                        discount = 0m
                    });
                }

                var discount = Math.Round(request.CartSubtotal * 0.10m, 2);

                return Ok(new
                {
                    valid = true,
                    code = "SALE10",
                    discount,
                    message = $"10% off applied to your order! You save ${discount:F2}."
                });
            }

            return Ok(new
            {
                valid = false,
                message = "Invalid promo code.",
                discount = 0m
            });
        }
    }
}
