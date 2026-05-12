using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vendora.Api.Data;
using Vendora.Api.Models;

namespace Vendora.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReviewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Public: Get visible reviews for a specific product
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetReviewsForProduct(int productId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.ProductId == productId && !r.IsDeleted)
                .Include(r => r.User)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Comment,
                    r.CreatedAt,
                    UserName = r.User != null ? r.User.FirstName + " " + r.User.LastName : "Anonymous"
                })
                .ToListAsync();

            return Ok(reviews);
        }

        // Admin: Get all reviews
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllReviewsForAdmin()
        {
            var reviews = await _context.Reviews
                .Include(r => r.Product)
                .Include(r => r.User)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Comment,
                    r.CreatedAt,
                    r.IsDeleted,
                    ProductName = r.Product != null ? r.Product.Name : "Unknown",
                    CustomerName = r.User != null ? r.User.FirstName + " " + r.User.LastName : "Unknown"
                })
                .ToListAsync();

            return Ok(reviews);
        }

        // REQ-60: Administrators shall have the ability to soft-delete or hide reviews
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDeleteReview(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null) return NotFound();

            review.IsDeleted = true;
            
            _context.AuditLogs.Add(new AuditLog
            {
                AdminId = 1,
                ActionType = "DELETE_REVIEW",
                TargetTable = "Reviews",
                TargetId = review.Id.ToString(),
                Details = "Review hidden from public."
            });

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Review hidden successfully", IsDeleted = review.IsDeleted });
        }

        // Admin: Restore review
        [HttpPut("{id}/restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RestoreReview(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null) return NotFound();

            review.IsDeleted = false;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Review restored successfully", IsDeleted = review.IsDeleted });
        }
    }
}
