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
        public void Should_Have_Seeded_Admin_Account_In_Database()
        {
            // Arrange
            using var context = TestDbContextFactory.CreateContext();

            // Act
            var admin = context.Users.FirstOrDefault(u => u.Role == "Admin");

            // Assert
            Assert.That(admin, Is.Not.Null, "Admin account must be seeded on database creation");
            Assert.That(admin!.Email, Is.EqualTo("admin@vendora.com"));
            Assert.That(admin.FirstName, Is.EqualTo("Admin"));
        }

        // REQ-03: Seeded admin password must be hashed
        [Test]
        public void Should_Store_Admin_Password_As_BCrypt_Hash()
        {
            // Arrange
            using var context = TestDbContextFactory.CreateContext();

            // Act
            var admin = context.Users.First(u => u.Role == "Admin");

            // Assert
            Assert.That(admin.PasswordHash, Does.StartWith("$2"),
                "Admin password must be stored as BCrypt hash, never plain text (REQ-03)");
            Assert.That(admin.PasswordHash, Is.Not.EqualTo("adminvendora"),
                "Password must not be stored in plain text");
        }

        // REQ-52: Categories with parent-child hierarchy should be seeded
        [Test]
        public void Should_Seed_Categories_With_Correct_Parent_Child_Hierarchy()
        {
            // Arrange
            using var context = TestDbContextFactory.CreateContext();

            // Act
            var allCategories = context.Categories.ToList();
            var rootCategories = allCategories.Where(c => c.ParentCategoryId == null).ToList();
            var electronics = allCategories.First(c => c.Name == "Electronics");
            var laptops = allCategories.First(c => c.Name == "Laptops");

            // Assert
            Assert.That(allCategories.Count, Is.EqualTo(12), "12 categories should be seeded");
            Assert.That(rootCategories.Count, Is.EqualTo(5),
                "5 root categories expected: Electronics, Clothing, Home & Kitchen, Sports & Outdoors, Books");
            Assert.That(laptops.ParentCategoryId, Is.EqualTo(electronics.Id),
                "Laptops should be a child of Electronics (REQ-52)");
        }

        // REQ-25, REQ-26: Order-Product relationship via OrderItems
        [Test]
        public async Task Should_Maintain_Order_To_OrderItems_Relationship()
        {
            // Arrange
            using var context = TestDbContextFactory.CreateContext();
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

            // Act
            context.Orders.Add(order);
            await context.SaveChangesAsync();

            // Assert
            var savedOrder = context.Orders.First();
            var savedItems = context.OrderItems.Where(oi => oi.OrderId == savedOrder.Id).ToList();

            Assert.That(savedItems.Count, Is.EqualTo(1), "Order should have 1 line item (REQ-26)");
            Assert.That(savedItems[0].Quantity, Is.EqualTo(2));
            Assert.That(savedItems[0].UnitPrice, Is.EqualTo(25.00m), "Unit price must use decimal (REQ-77)");
            Assert.That(savedOrder.TotalAmount, Is.EqualTo(50.00m));
        }

        // REQ-62: Wishlist stores UserID and ProductID junction
        [Test]
        public async Task Should_Store_Wishlist_As_User_Product_Junction()
        {
            // Arrange
            using var context = TestDbContextFactory.CreateContext();
            var product = new Product { Sku = "WISH-001", Name = "Wishlist Item", Price = 15m, StockQuantity = 5, CategoryId = 1 };
            context.Products.Add(product);
            await context.SaveChangesAsync();

            var wishlistItem = new WishlistItem
            {
                UserId = 1,
                ProductId = product.Id
            };

            // Act
            context.WishlistItems.Add(wishlistItem);
            await context.SaveChangesAsync();

            // Assert
            var saved = context.WishlistItems.First();
            Assert.That(saved.UserId, Is.EqualTo(1), "Wishlist must link to UserID (REQ-62)");
            Assert.That(saved.ProductId, Is.EqualTo(product.Id), "Wishlist must link to ProductID (REQ-62)");
        }

        // REQ-77: Monetary values must use decimal precision
        [Test]
        public async Task Should_Preserve_Decimal_Precision_For_Monetary_Values()
        {
            // Arrange
            using var context = TestDbContextFactory.CreateContext();
            var product = new Product
            {
                Sku = "DEC-001",
                Name = "Decimal Test",
                Price = 19.99m,
                StockQuantity = 1,
                CategoryId = 1
            };

            // Act
            context.Products.Add(product);
            await context.SaveChangesAsync();
            var saved = context.Products.First(p => p.Sku == "DEC-001");

            // Assert
            Assert.That(saved.Price, Is.EqualTo(19.99m), "Price must preserve decimal precision (REQ-77)");
            Assert.That(saved.Price.GetType(), Is.EqualTo(typeof(decimal)), "Price must be stored as decimal type");
        }
    }
}
