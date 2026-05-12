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
        /// Retrieves all products (REQ-35).
        /// Admins see all products including soft-deleted ones if requested.
        /// Public users should only see active products (handled by filtering IsDeleted).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetProducts([FromQuery] bool includeDeleted = false)
        {
            var query = _context.Products.AsQueryable();

            if (!includeDeleted)
            {
                query = query.Where(p => !p.IsDeleted);
            }

            var products = await query.ToListAsync();
            return Ok(products);
        }

        /// <summary>
        /// Retrieves a single product by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null || product.IsDeleted)
            {
                return NotFound(new { message = "Product not found." });
            }

            return Ok(product);
        }

        /// <summary>
        /// Creates a new product (REQ-35).
        /// Verifies administrator role (REQ-34).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] Product product)
        {
            // Verify SKU uniqueness (REQ-36)
            if (await _context.Products.AnyAsync(p => p.Sku == product.Sku))
            {
                return BadRequest(new { message = "A product with this SKU already exists." });
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProducts), new { id = product.Id }, product);
        }

        /// <summary>
        /// Updates an existing product (REQ-35).
        /// Verifies administrator role (REQ-34).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] Product updatedProduct)
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
            if (product.Sku != updatedProduct.Sku && await _context.Products.AnyAsync(p => p.Sku == updatedProduct.Sku))
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
            // Admin can restore a deleted product by passing IsDeleted = false
            product.IsDeleted = updatedProduct.IsDeleted;

            await _context.SaveChangesAsync();

            return Ok(product);
        }

        /// <summary>
        /// Performs a soft-delete on a product (REQ-37).
        /// Verifies administrator role (REQ-34).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found." });
            }

            product.IsDeleted = true; // Soft delete for order history integrity
            
            // Task 1: Automatically delete associated reviews
            var reviews = await _context.Reviews.Where(r => r.ProductId == id).ToListAsync();
            _context.Reviews.RemoveRange(reviews);

            // REQ-78: Audit log
            _context.AuditLogs.Add(new AuditLog
            {
                AdminId = 1, // Hardcoded for now until Auth is fully mapped
                ActionType = "DELETE_PRODUCT",
                TargetTable = "Products",
                TargetId = product.Id.ToString(),
                Details = $"Product '{product.Name}' deleted and its {reviews.Count} reviews removed."
            });

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
