using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vendora.Api.Data;
using Vendora.Api.Models;

namespace Vendora.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // REQ-70: Master grid of all orders
        [HttpGet]
        public async Task<IActionResult> GetOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    o.Id,
                    o.TotalAmount,
                    o.Status,
                    o.CreatedAt,
                    o.ShippingAddress,
                    CustomerName = o.User != null ? o.User.FirstName + " " + o.User.LastName : "Unknown",
                    CustomerEmail = o.User != null ? o.User.Email : "Unknown",
                    ItemsCount = o.Items.Count,
                    Items = o.Items.Select(i => new
                    {
                        i.ProductId,
                        ProductName = i.Product != null ? i.Product.Name : "Unknown",
                        i.Quantity,
                        i.UnitPrice
                    })
                })
                .ToListAsync();

            return Ok(orders);
        }

        // REQ-71: Update the order status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest request)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            order.Status = request.Status;
            
            // REQ-72 & REQ-78 (timestamp & audit)
            _context.AuditLogs.Add(new AuditLog
            {
                AdminId = 1,
                ActionType = "UPDATE_STATUS",
                TargetTable = "Orders",
                TargetId = order.Id.ToString(),
                Details = $"Order status changed to {request.Status}."
            });
            
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Order status updated successfully", Status = order.Status });
        }

        // REQ-73: Cancel an order and replenish stock
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound();
            if (order.Status == "Cancelled") return BadRequest("Order is already cancelled.");

            order.Status = "Cancelled";

            // Replenish stock
            foreach (var item in order.Items)
            {
                if (item.Product != null)
                {
                    item.Product.StockQuantity += item.Quantity;
                }
            }

            // REQ-78: Audit log
            _context.AuditLogs.Add(new AuditLog
            {
                AdminId = 1,
                ActionType = "CANCEL_ORDER",
                TargetTable = "Orders",
                TargetId = order.Id.ToString(),
                Details = $"Order cancelled and stock replenished."
            });

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Order cancelled and stock replenished", Status = order.Status });
        }
    }

    public class UpdateOrderStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
