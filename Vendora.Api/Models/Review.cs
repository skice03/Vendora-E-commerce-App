using System;

namespace Vendora.Api.Models
{
    /// <summary>
    /// Represents a customer's review and rating for a product.
    /// </summary>
    public class Review
    {
        public int Id { get; set; }

        public int ProductId { get; set; }
        public Product? Product { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        public int Rating { get; set; } // 1 to 5 stars
        public string Comment { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // REQ-60: Administrators shall have the ability to soft-delete or hide reviews
        public bool IsDeleted { get; set; } = false;
    }
}
