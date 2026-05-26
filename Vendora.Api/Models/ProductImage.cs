namespace Vendora.Api.Models
{
    /// <summary>
    /// Represents an image associated with a product (REQ-54).
    /// Supports multiple images per product with a display order and primary flag.
    /// </summary>
    public class ProductImage
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public Product? Product { get; set; }

        /// <summary>
        /// Relative URL path to the uploaded image file (e.g. /uploads/products/guid.jpg).
        /// </summary>
        public string ImageUrl { get; set; } = string.Empty;

        /// <summary>
        /// Controls the order images appear in the gallery.
        /// </summary>
        public int DisplayOrder { get; set; } = 0;

        /// <summary>
        /// When true, this image is the main thumbnail shown in catalog grids.
        /// </summary>
        public bool IsPrimary { get; set; } = false;
    }
}
