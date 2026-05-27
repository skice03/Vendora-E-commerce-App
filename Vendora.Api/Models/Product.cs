namespace Vendora.Api.Models
{
    /// <summary>
    /// Represents an item available for purchase in the product catalog.
    /// </summary>
    public class Product
    {
        public int Id { get; set; }
        public string Sku { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public Category? Category { get; set; }
        public string ImageUrl { get; set; } = string.Empty;

        /// <summary>
        /// Ensures financial precision (REQ-77).
        /// </summary>
        public decimal Price { get; set; }

        /// <summary>
        /// Represents the actual stock available in the database (REQ-19).
        /// </summary>
        public int StockQuantity { get; set; }

        // Soft deletion flag (REQ-37)
        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// Tracks total page views (REQ-55).
        /// </summary>
        public int ViewCount { get; set; } = 0;

        /// <summary>
        /// Navigation property for the product's image gallery (REQ-54).
        /// </summary>
        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    }
}