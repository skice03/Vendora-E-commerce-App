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
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReviewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ───────────────────────────────────────────────
        //  Public Endpoints
        // ───────────────────────────────────────────────

        /// <summary>
        /// Public: Get visible reviews for a specific product (REQ-56, REQ-57).
        /// </summary>
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetReviewsForProductAsync(int productId)
        {
            var reviews = await _context.Reviews
                .Where(review => review.ProductId == productId && !review.IsDeleted)
                .Include(review => review.User)
                .OrderByDescending(review => review.CreatedAt)
                .Select(review => new
                {
                    review.Id,
                    review.Rating,
                    review.Comment,
                    review.CreatedAt,
                    UserName = review.User != null ? review.User.FirstName + " " + review.User.LastName : "Anonymous"
                })
                .ToListAsync();

            return Ok(reviews);
        }

        // ───────────────────────────────────────────────
        //  Customer Endpoints
        // ───────────────────────────────────────────────

        /// <summary>
        /// Check if the authenticated user can review a specific product (REQ-58).
        /// Returns eligibility status and reason.
        /// </summary>
        [HttpGet("can-review/{productId}")]
        [Authorize]
        public async Task<IActionResult> CanReviewProductAsync(int productId)
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
            {
                return Unauthorized();
            }

            // Check if user already reviewed this product
            var alreadyReviewed = await _context.Reviews
                .AnyAsync(review => review.ProductId == productId && review.UserId == userId);

            if (alreadyReviewed)
            {
                return Ok(new { canReview = false, reason = "You have already reviewed this product." });
            }

            // REQ-58: Check if user has a Delivered order containing this product
            var hasDeliveredOrder = await _context.Orders
                .Where(order => order.UserId == userId && order.Status == "Delivered")
                .AnyAsync(order => order.Items.Any(item => item.ProductId == productId));

            if (!hasDeliveredOrder)
            {
                return Ok(new { canReview = false, reason = "You can only review products from delivered orders." });
            }

            return Ok(new { canReview = true, reason = "" });
        }

        /// <summary>
        /// Submit a review for a product (REQ-56, REQ-57, REQ-58).
        /// Validates that the user has received the product and hasn't already reviewed it.
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> SubmitReviewAsync([FromBody] CreateReviewRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
            {
                return Unauthorized();
            }

            // Validate rating range (REQ-56: 1-5 stars)
            if (request.Rating < 1 || request.Rating > 5)
            {
                return BadRequest(new { message = "Rating must be between 1 and 5." });
            }

            // Check product exists
            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null || product.IsDeleted)
            {
                return BadRequest(new { message = "Product not found." });
            }

            // Prevent duplicate reviews (one per user per product)
            var alreadyReviewed = await _context.Reviews
                .AnyAsync(review => review.ProductId == request.ProductId && review.UserId == userId);

            if (alreadyReviewed)
            {
                return Conflict(new { message = "You have already reviewed this product." });
            }

            // REQ-58: Only review products from Delivered orders
            var hasDeliveredOrder = await _context.Orders
                .Where(order => order.UserId == userId && order.Status == "Delivered")
                .AnyAsync(order => order.Items.Any(item => item.ProductId == request.ProductId));

            if (!hasDeliveredOrder)
            {
                return StatusCode(403, new { message = "You can only review products you have received." });
            }

            var review = new Review
            {
                ProductId = request.ProductId,
                UserId = userId,
                Rating = request.Rating,
                Comment = request.Comment ?? string.Empty,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Reviews.AddAsync(review);
            await _context.SaveChangesAsync();

            // Return the created review with user name
            var user = await _context.Users.FindAsync(userId);
            return StatusCode(201, new
            {
                review.Id,
                review.Rating,
                review.Comment,
                review.CreatedAt,
                UserName = user != null ? user.FirstName + " " + user.LastName : "Anonymous"
            });
        }

        // ───────────────────────────────────────────────
        //  Admin Endpoints
        // ───────────────────────────────────────────────

        /// <summary>
        /// Admin: Get all reviews including hidden ones (REQ-60).
        /// </summary>
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllReviewsForAdminAsync()
        {
            var reviews = await _context.Reviews
                .Include(review => review.Product)
                .Include(review => review.User)
                .OrderByDescending(review => review.CreatedAt)
                .Select(review => new
                {
                    review.Id,
                    review.Rating,
                    review.Comment,
                    review.CreatedAt,
                    review.IsDeleted,
                    ProductName = review.Product != null ? review.Product.Name : "Unknown",
                    CustomerName = review.User != null ? review.User.FirstName + " " + review.User.LastName : "Unknown"
                })
                .ToListAsync();

            return Ok(reviews);
        }

        /// <summary>
        /// REQ-60: Administrators shall have the ability to soft-delete or hide reviews.
        /// REQ-78 & REQ-79: Audit log with real Admin ID.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDeleteReviewAsync(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
            {
                return NotFound();
            }

            review.IsDeleted = true;

            var adminId = GetCurrentUserId();
            _context.AuditLogs.Add(new AuditLog
            {
                AdminId = adminId,
                ActionType = "DELETE_REVIEW",
                TargetTable = "Reviews",
                TargetId = review.Id.ToString(),
                Details = "Review hidden from public."
            });

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Review hidden successfully", IsDeleted = review.IsDeleted });
        }

        /// <summary>
        /// Admin: Restore a hidden review (REQ-60).
        /// </summary>
        [HttpPut("{id}/restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RestoreReviewAsync(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
            {
                return NotFound();
            }

            review.IsDeleted = false;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Review restored successfully", IsDeleted = review.IsDeleted });
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
