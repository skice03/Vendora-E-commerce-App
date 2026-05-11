using System;

namespace Vendora.Api.Models
{
    /// <summary>
    /// Represents a customer transaction and order details.
    /// </summary>
    public class Order
    {
        public int Id { get; set; }

        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string ShippingAddress { get; set; } = string.Empty;

        public int UserId { get; set; }
        public User? User { get; set; }

        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}