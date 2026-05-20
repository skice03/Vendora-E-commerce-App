using Vendora.Api.Models;
using Vendora.Tests.Helpers;

namespace Vendora.Tests.IntegrationTests
{
    /// <summary>
    /// Integration tests for database integrity, seeded data, and relational constraints.
    /// Validates that the database schema and initial data meet SRS requirements.
    /// </summary>
    [TestFixture]
    public class DatabaseIntegrityTests
    {
        // REQ-02: Seeded admin account should exist in the database
        [Test]
        public void SeededAdmin_ExistsInDatabase()
        {
            using var context = TestDbContextFactory.CreateContext();

            var admin = context.Users.FirstOrDefault(u => u.Role == "Admin");

            Assert.That(admin, Is.Not.Null, "Admin account must be seeded on database creation");
            Assert.That(admin!.Email, Is.EqualTo("marinelcipu21@gmail.com"));
            Assert.That(admin.FirstName, Is.EqualTo("Marinel"));
        }

        // REQ-03: Seeded admin password must be hashed
        [Test]
        public void SeededAdmin_PasswordIsHashed()
        {
            using var context = TestDbContextFactory.CreateContext();

            var admin = context.Users.First(u => u.Role == "Admin");

            Assert.That(admin.PasswordHash, Does.StartWith("$2"),
                "Admin password must be stored as BCrypt hash, never plain text (REQ-03)");
            Assert.That(admin.PasswordHash, Is.Not.EqualTo("adminvendora"),
                "Password must not be stored in plain text");
        }

        // REQ-52: Categories with parent-child hierarchy should be seeded
        [Test]
        public void SeededCategories_HaveCorrectHierarchy()
        {
            using var context = TestDbContextFactory.CreateContext();

            var allCategories = context.Categories.ToList();

            // Should have 12 seeded categories total
            Assert.That(allCategories.Count, Is.EqualTo(12), "12 categories should be seeded");

            // Root categories should have no parent
            var rootCategories = allCategories.Where(c => c.ParentCategoryId == null).ToList();
            Assert.That(rootCategories.Count, Is.EqualTo(5),
                "5 root categories expected: Electronics, Clothing, Home & Kitchen, Sports & Outdoors, Books");

            // Child categories should have a valid parent
            var electronics = allCategories.First(c => c.Name == "Electronics");
            var laptops = allCategories.First(c => c.Name == "Laptops");
            Assert.That(laptops.ParentCategoryId, Is.EqualTo(electronics.Id),
                "Laptops should be a child of Electronics (REQ-52)");
        }

        // REQ-25: Order-Product relationship via OrderItems
        [Test]
        public async Task Order_WithItems_MaintainsRelationship()
        {
            using var context = TestDbContextFactory.CreateContext();

            // Add a product
            var product = new Product
            {
                Sku = "REL-001",
                Name = "Relationship Test Product",
                Price = 25.00m,
                StockQuantity = 10,
                CategoryId = 1
            };
            context.Products.Add(product);
            await context.SaveChangesAsync();

            // Create an order with items
            var order = new Order
            {
                UserId = 1,
                TotalAmount = 50.00m,
                Status = "Pending",
                ShippingAddress = "123 Test Street",
                Items = new List<OrderItem>
                {
                    new OrderItem
                    {
                        ProductId = product.Id,
                        Quantity = 2,
                        UnitPrice = 25.00m
                    }
                }
            };
            context.Orders.Add(order);
            await context.SaveChangesAsync();

            // Verify relationships
            var savedOrder = context.Orders.First();
            var savedItems = context.OrderItems.Where(oi => oi.OrderId == savedOrder.Id).ToList();

            Assert.That(savedItems.Count, Is.EqualTo(1), "Order should have 1 line item (REQ-26)");
            Assert.That(savedItems[0].Quantity, Is.EqualTo(2));
            Assert.That(savedItems[0].UnitPrice, Is.EqualTo(25.00m), "Unit price must use decimal (REQ-77)");
            Assert.That(savedOrder.TotalAmount, Is.EqualTo(50.00m));
        }

        // REQ-62: Wishlist stores UserID and ProductID junction
        [Test]
        public async Task Wishlist_StoresUserProductJunction()
        {
            using var context = TestDbContextFactory.CreateContext();

            var product = new Product { Sku = "WISH-001", Name = "Wishlist Item", Price = 15m, StockQuantity = 5, CategoryId = 1 };
            context.Products.Add(product);
            await context.SaveChangesAsync();

            var wishlistItem = new WishlistItem
            {
                UserId = 1,
                ProductId = product.Id
            };
            context.WishlistItems.Add(wishlistItem);
            await context.SaveChangesAsync();

            var saved = context.WishlistItems.First();
            Assert.That(saved.UserId, Is.EqualTo(1), "Wishlist must link to UserID (REQ-62)");
            Assert.That(saved.ProductId, Is.EqualTo(product.Id), "Wishlist must link to ProductID (REQ-62)");
        }

        // REQ-77: Monetary values must use decimal precision
        [Test]
        public async Task MonetaryValues_UseDecimalPrecision()
        {
            using var context = TestDbContextFactory.CreateContext();

            var product = new Product
            {
                Sku = "DEC-001",
                Name = "Decimal Test",
                Price = 19.99m,
                StockQuantity = 1,
                CategoryId = 1
            };
            context.Products.Add(product);
            await context.SaveChangesAsync();

            var saved = context.Products.First(p => p.Sku == "DEC-001");

            Assert.That(saved.Price, Is.EqualTo(19.99m), "Price must preserve decimal precision (REQ-77)");
            Assert.That(saved.Price.GetType(), Is.EqualTo(typeof(decimal)), "Price must be stored as decimal type");
        }
    }
}
