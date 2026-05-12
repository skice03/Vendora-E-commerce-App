namespace Vendora.Api.Models
{
    /// <summary>
    /// Object used to transfer the new order status from the admin interface.
    /// </summary>
    public class UpdateOrderStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
