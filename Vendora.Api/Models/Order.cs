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

        /// <summary>
        /// Records the timestamp of the last status change (REQ-72).
        /// </summary>
        public DateTime? StatusChangedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string ShippingAddress { get; set; } = string.Empty;

        /// <summary>
        /// Stripe Checkout Session ID for payment tracking.
        /// </summary>
        public string? StripeSessionId { get; set; }

        /// <summary>
        /// Payment status: Unpaid, Paid, Refunded.
        /// </summary>
        public string PaymentStatus { get; set; } = "Unpaid";

        public int UserId { get; set; }
        public User? User { get; set; }

        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}