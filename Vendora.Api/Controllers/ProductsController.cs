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
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves all products with category names (REQ-35, REQ-13).
        /// Admins see all products including soft-deleted ones if requested.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetProductsAsync([FromQuery] bool includeDeleted = false)
        {
            var query = _context.Products
                .Include(product => product.Category)
                .AsQueryable();

            if (!includeDeleted)
            {
                query = query.Where(product => !product.IsDeleted);
            }

            var products = await query
                .Select(product => new
                {
                    product.Id,
                    product.Sku,
                    product.Name,
                    product.Description,
                    product.Price,
                    product.StockQuantity,
                    product.CategoryId,
                    CategoryName = product.Category != null ? product.Category.Name : "Uncategorized",
                    product.ImageUrl,
                    product.IsDeleted
                })
                .ToListAsync();

            return Ok(products);
        }

        /// <summary>
        /// Retrieves a single product by ID with category name (REQ-13).
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProductAsync(int id)
        {
            var product = await _context.Products
                .Include(product => product.Category)
                .FirstOrDefaultAsync(product => product.Id == id);

            if (product == null || product.IsDeleted)
            {
                return NotFound(new { message = "Product not found." });
            }

            return Ok(new
            {
                product.Id,
                product.Sku,
                product.Name,
                product.Description,
                product.Price,
                product.StockQuantity,
                product.CategoryId,
                CategoryName = product.Category != null ? product.Category.Name : "Uncategorized",
                product.ImageUrl,
                product.IsDeleted
            });
        }

        /// <summary>
        /// Creates a new product (REQ-35).
        /// Verifies administrator role (REQ-34).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateProductAsync([FromBody] Product product)
        {
            // Verify SKU uniqueness (REQ-36)
            if (await _context.Products.AnyAsync(existingProduct => existingProduct.Sku == product.Sku))
            {
                return BadRequest(new { message = "A product with this SKU already exists." });
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return StatusCode(201, product);
        }

        /// <summary>
        /// Updates an existing product (REQ-35).
        /// Verifies administrator role (REQ-34).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProductAsync(int id, [FromBody] Product updatedProduct)
        {
            if (id != updatedProduct.Id)
            {
                return BadRequest(new { message = "Product ID mismatch." });
            }

            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found." });
            }

            // Check SKU uniqueness if it was changed
            if (product.Sku != updatedProduct.Sku && await _context.Products.AnyAsync(existingProduct => existingProduct.Sku == updatedProduct.Sku))
            {
                return BadRequest(new { message = "A product with this SKU already exists." });
            }

            product.Name = updatedProduct.Name;
            product.Sku = updatedProduct.Sku;
            product.Description = updatedProduct.Description;
            product.Price = updatedProduct.Price;
            product.StockQuantity = updatedProduct.StockQuantity;
            product.CategoryId = updatedProduct.CategoryId;
            product.ImageUrl = updatedProduct.ImageUrl;
            product.IsDeleted = updatedProduct.IsDeleted;

            await _context.SaveChangesAsync();

            return Ok(product);
        }

        /// <summary>
        /// Performs a soft-delete on a product (REQ-37).
        /// Verifies administrator role (REQ-34).
        /// Hard-deletes associated reviews for data cleanup.
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found." });
            }

            product.IsDeleted = true; // Soft delete for order history integrity

            // Automatically delete associated reviews
            var reviews = await _context.Reviews.Where(review => review.ProductId == id).ToListAsync();
            _context.Reviews.RemoveRange(reviews);

            // REQ-78 & REQ-79: Audit log with real Admin ID from JWT
            var adminId = GetCurrentAdminId();
            _context.AuditLogs.Add(new AuditLog
            {
                AdminId = adminId,
                ActionType = "DELETE_PRODUCT",
                TargetTable = "Products",
                TargetId = product.Id.ToString(),
                Details = $"Product '{product.Name}' deleted and its {reviews.Count} reviews removed."
            });

            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Extracts the authenticated admin's user ID from the JWT token (REQ-79).
        /// </summary>
        private int GetCurrentAdminId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                           ?? User.FindFirst("sub");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int adminId))
            {
                return adminId;
            }
            return 1; // Fallback to seeded admin
        }
    }
}
