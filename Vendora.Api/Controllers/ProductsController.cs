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
        private readonly IWebHostEnvironment _env;

        public ProductsController(ApplicationDbContext context, IWebHostEnvironment env = null!)
        {
            _context = context;
            _env = env;
        }

        /// <summary>
        /// Retrieves all products with category names and average ratings (REQ-35, REQ-13, REQ-59).
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
                    product.IsDeleted,
                    product.ViewCount,
                    // REQ-54: Include all product images
                    Images = _context.ProductImages
                        .Where(img => img.ProductId == product.Id)
                        .OrderBy(img => img.DisplayOrder)
                        .Select(img => new { img.Id, img.ImageUrl, img.DisplayOrder, img.IsPrimary })
                        .ToList(),
                    // REQ-59: Calculate average rating from Reviews table
                    AverageRating = _context.Reviews
                        .Where(review => review.ProductId == product.Id && !review.IsDeleted)
                        .Select(review => (double?)review.Rating)
                        .Average(),
                    ReviewCount = _context.Reviews
                        .Count(review => review.ProductId == product.Id && !review.IsDeleted)
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
                product.IsDeleted,
                product.ViewCount,
                // REQ-54: Include all product images
                Images = await _context.ProductImages
                    .Where(img => img.ProductId == product.Id)
                    .OrderBy(img => img.DisplayOrder)
                    .Select(img => new { img.Id, img.ImageUrl, img.DisplayOrder, img.IsPrimary })
                    .ToListAsync(),
                AverageRating = await _context.Reviews
                    .Where(review => review.ProductId == product.Id && !review.IsDeleted)
                    .Select(review => (double?)review.Rating)
                    .AverageAsync(),
                ReviewCount = await _context.Reviews
                    .CountAsync(review => review.ProductId == product.Id && !review.IsDeleted)
            });
        }

        /// <summary>
        /// Increments the product view count (REQ-55).
        /// Called each time a customer visits the product detail page.
        /// </summary>
        [HttpPost("{id}/view")]
        [AllowAnonymous]
        public async Task<IActionResult> IncrementViewCountAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null || product.IsDeleted)
            {
                return NotFound();
            }

            product.ViewCount += 1;
            await _context.SaveChangesAsync();

            return Ok(new { ViewCount = product.ViewCount });
        }

        /// <summary>
        /// Uploads a product image file to wwwroot/uploads/products/ (REQ-54).
        /// Returns the relative URL path for storage in ProductImage records.
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file provided." });
            }

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
            {
                return BadRequest(new { message = "Only JPEG, PNG, WebP, and GIF images are allowed." });
            }

            // Limit file size to 5MB
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "File size must be under 5MB." });
            }

            var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "products");
            Directory.CreateDirectory(uploadsDir);

            var extension = Path.GetExtension(file.FileName).ToLower();
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"/uploads/products/{fileName}";

            return Ok(new { imageUrl });
        }

        /// <summary>
        /// Adds an image record to a product (REQ-54).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/images")]
        public async Task<IActionResult> AddProductImageAsync(int id, [FromBody] ProductImageRequest request)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found." });
            }

            // If this is marked primary, unmark others
            if (request.IsPrimary)
            {
                var existingImages = await _context.ProductImages
                    .Where(img => img.ProductId == id)
                    .ToListAsync();
                foreach (var img in existingImages) img.IsPrimary = false;
            }

            var productImage = new ProductImage
            {
                ProductId = id,
                ImageUrl = request.ImageUrl,
                DisplayOrder = request.DisplayOrder,
                IsPrimary = request.IsPrimary
            };

            // Also update the legacy ImageUrl field with the primary image
            if (request.IsPrimary)
            {
                product.ImageUrl = request.ImageUrl;
            }

            _context.ProductImages.Add(productImage);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { productImage.Id, productImage.ImageUrl, productImage.DisplayOrder, productImage.IsPrimary });
        }

        /// <summary>
        /// Deletes a product image (REQ-54).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("images/{imageId}")]
        public async Task<IActionResult> DeleteProductImageAsync(int imageId)
        {
            var image = await _context.ProductImages.FindAsync(imageId);
            if (image == null)
            {
                return NotFound(new { message = "Image not found." });
            }

            var wasPrimary = image.IsPrimary;
            var productId = image.ProductId;

            _context.ProductImages.Remove(image);
            await _context.SaveChangesAsync();

            // If the deleted image was primary, promote the next remaining image
            if (wasPrimary)
            {
                var nextImage = await _context.ProductImages
                    .Where(img => img.ProductId == productId)
                    .OrderBy(img => img.DisplayOrder)
                    .FirstOrDefaultAsync();

                if (nextImage != null)
                {
                    nextImage.IsPrimary = true;

                    // Sync the product's legacy ImageUrl with the new primary
                    var product = await _context.Products.FindAsync(productId);
                    if (product != null)
                    {
                        product.ImageUrl = nextImage.ImageUrl;
                    }

                    await _context.SaveChangesAsync();
                }
                else
                {
                    // No images left — clear the product's ImageUrl
                    var product = await _context.Products.FindAsync(productId);
                    if (product != null)
                    {
                        product.ImageUrl = string.Empty;
                        await _context.SaveChangesAsync();
                    }
                }
            }

            return NoContent();
        }

        public class ProductImageRequest
        {
            public string ImageUrl { get; set; } = string.Empty;
            public int DisplayOrder { get; set; } = 0;
            public bool IsPrimary { get; set; } = false;
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
