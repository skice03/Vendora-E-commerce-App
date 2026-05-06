using System;

namespace Vendora.Api.Models
{
    // represents a customer transaction and order details.
    public class Order
    {
        public int Id { get; set; }

        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string ShippingAddress { get; set; } = string.Empty;

        // Relation to Users by FK
        public int UserId { get; set; }
        public User? User { get; set; } // for EF core
    }
}