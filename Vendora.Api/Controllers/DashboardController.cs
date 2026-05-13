using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vendora.Api.Data;

namespace Vendora.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        // REQ-75: Admin dashboard displays real-time total revenue
        // REQ-76: Count of new orders placed on the current day
        // REQ-77: "Top 5 Customers" aggregating total spend
        // REQ-38: Support date range filtering for revenue
        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStatsAsync(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            // REQ-38: Apply date range filter to revenue calculation
            var ordersQuery = _context.Orders
                .Where(o => o.Status != "Cancelled");

            if (startDate.HasValue)
            {
                ordersQuery = ordersQuery.Where(o => o.CreatedAt >= startDate.Value);
            }
            if (endDate.HasValue)
            {
                ordersQuery = ordersQuery.Where(o => o.CreatedAt <= endDate.Value.Date.AddDays(1));
            }

            var totalRevenue = await ordersQuery.SumAsync(o => o.TotalAmount);

            // REQ-76: Today's orders
            var today = DateTime.UtcNow.Date;
            var newOrdersToday = await _context.Orders
                .Where(o => o.CreatedAt >= today)
                .CountAsync();

            // Total Users
            var totalUsers = await _context.Users.CountAsync(u => u.Role == "Customer");

            // REQ-77: Top 5 Customers
            var topCustomers = await _context.Orders
                .Where(o => o.Status != "Cancelled" && o.User != null)
                .GroupBy(o => new { o.UserId, o.User!.FirstName, o.User.LastName, o.User.Email })
                .Select(g => new
                {
                    UserId = g.Key.UserId,
                    Name = g.Key.FirstName + " " + g.Key.LastName,
                    Email = g.Key.Email,
                    TotalSpent = g.Sum(o => o.TotalAmount),
                    OrderCount = g.Count()
                })
                .OrderByDescending(c => c.TotalSpent)
                .Take(5)
                .ToListAsync();

            // REQ-39: Top-selling products by quantity ordered
            var topProducts = await _context.OrderItems
                .Include(oi => oi.Product)
                .Where(oi => oi.Order != null && oi.Order.Status != "Cancelled")
                .GroupBy(oi => new { oi.ProductId, ProductName = oi.Product != null ? oi.Product.Name : "Unknown" })
                .Select(g => new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    TotalSold = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.Quantity * oi.UnitPrice)
                })
                .OrderByDescending(p => p.TotalSold)
                .Take(5)
                .ToListAsync();

            return Ok(new
            {
                TotalRevenue = totalRevenue,
                NewOrdersToday = newOrdersToday,
                TotalCustomers = totalUsers,
                TopCustomers = topCustomers,
                TopProducts = topProducts,
                DateFiltered = startDate.HasValue || endDate.HasValue
            });
        }

        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogsAsync()
        {
            var logs = await _context.AuditLogs
                .Include(a => a.Admin)
                .OrderByDescending(a => a.Timestamp)
                .Take(50) // Limit to recent 50
                .Select(a => new
                {
                    a.Id,
                    a.ActionType,
                    a.TargetTable,
                    a.TargetId,
                    a.Details,
                    a.Timestamp,
                    AdminName = a.Admin != null ? a.Admin.FirstName + " " + a.Admin.LastName : "System"
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}
