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
        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            // REQ-75: Total Revenue (SUM of all Delivered/Shipped orders to be safe, or just all non-cancelled)
            var totalRevenue = await _context.Orders
                .Where(o => o.Status != "Cancelled")
                .SumAsync(o => o.TotalAmount);

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

            return Ok(new
            {
                TotalRevenue = totalRevenue,
                NewOrdersToday = newOrdersToday,
                TotalCustomers = totalUsers,
                TopCustomers = topCustomers
            });
        }

        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs()
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
