namespace Vendora.Api.Models
{
    // represents an item available for purchase in the product catalog
    public class Product
    {
        public int Id { get; set; }
        public string Sku { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;

        // we use decimal values for calculus
        public decimal Price { get; set; }

        public int StockQty { get; set; }
        public bool IsDeleted { get; set; } = false;
    }
}