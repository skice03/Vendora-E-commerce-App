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
    public class WishlistController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WishlistController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET /api/wishlist
        [HttpGet]
        public async Task<IActionResult> GetWishlist()
        {
            var userId = GetCurrentUserId();
            
            var wishlistItems = await _context.WishlistItems
                .Where(w => w.UserId == userId)
                .Include(w => w.Product)
                .OrderByDescending(w => w.AddedAt)
                .Select(w => new
                {
                    w.Id,
                    w.ProductId,
                    w.AddedAt,
                    Product = w.Product == null ? null : new
                    {
                        w.Product.Id,
                        w.Product.Name,
                        w.Product.Price,
                        w.Product.ImageUrl,
                        w.Product.StockQuantity
                    }
                })
                .ToListAsync();

            return Ok(wishlistItems);
        }

        // POST /api/wishlist/{productId}
        [HttpPost("{productId}")]
        public async Task<IActionResult> AddToWishlist(int productId)
        {
            var userId = GetCurrentUserId();

            var product = await _context.Products.FindAsync(productId);
            if (product == null || product.IsDeleted)
            {
                return NotFound(new { message = "Product not found." });
            }

            var exists = await _context.WishlistItems.AnyAsync(w => w.UserId == userId && w.ProductId == productId);
            if (exists)
            {
                return BadRequest(new { message = "Product is already in your wishlist." });
            }

            var item = new WishlistItem
            {
                UserId = userId,
                ProductId = productId
            };

            _context.WishlistItems.Add(item);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { message = "Added to wishlist.", item });
        }

        // DELETE /api/wishlist/{productId}
        [HttpDelete("{productId}")]
        public async Task<IActionResult> RemoveFromWishlist(int productId)
        {
            var userId = GetCurrentUserId();
            var item = await _context.WishlistItems.FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

            if (item == null)
            {
                return NotFound();
            }

            _context.WishlistItems.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Removed from wishlist." });
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            return 0;
        }
    }
}
