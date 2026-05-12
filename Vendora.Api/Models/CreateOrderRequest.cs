namespace Vendora.Api.Models
{
    /// <summary>
    /// Data transfer object for placing an order at checkout (REQ-23).
    /// </summary>
    public class CreateOrderRequest
    {
        public string ShippingAddress { get; set; } = string.Empty;

        public List<OrderItemRequest> Items { get; set; } = new List<OrderItemRequest>();
    }

    /// <summary>
    /// Represents a single item in the checkout request.
    /// </summary>
    public class OrderItemRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}
