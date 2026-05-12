using Microsoft.EntityFrameworkCore;
using Vendora.Api.Models;

namespace Vendora.Api.Data
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // Apply pending migrations automatically on startup
            await context.Database.MigrateAsync();

            // Seed Products if mock data is missing
            if (!await context.Products.AnyAsync(p => p.Sku == "AUD-WH-001"))
            {
                var products = new List<Product>
                {
                    new Product { 
                        Name = "Premium Wireless Headphones", 
                        Sku = "AUD-WH-001", 
                        Price = 149.99m, 
                        StockQuantity = 45, 
                        CategoryId = 4, 
                        Description = "Experience crystal-clear sound with active noise cancellation, 30-hour battery life, and ultra-comfortable memory foam ear cushions. Perfect for music lovers and professionals alike.", 
                        ImageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" 
                    },
                    new Product { 
                        Name = "Ultra-Slim Laptop Pro 15\"", 
                        Sku = "LAP-USP-002", 
                        Price = 1299.99m, 
                        StockQuantity = 12, 
                        CategoryId = 2, 
                        Description = "Powerful performance in an incredibly thin design. Features the latest processor, 16GB RAM, 512GB SSD, and a stunning 4K Retina display.", 
                        ImageUrl = "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600" 
                    },
                    new Product { 
                        Name = "Smart Watch Series X", 
                        Sku = "ELC-SW-003", 
                        Price = 349.99m, 
                        StockQuantity = 30, 
                        CategoryId = 1, 
                        Description = "Track your fitness, monitor your health, and stay connected with this premium smartwatch featuring GPS, heart rate monitoring, and a beautiful OLED display.", 
                        ImageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600" 
                    },
                    new Product { 
                        Name = "Ergonomic Office Chair", 
                        Sku = "FUR-EOC-004", 
                        Price = 459.99m, 
                        StockQuantity = 8, 
                        CategoryId = 9, 
                        Description = "Designed for all-day comfort with adjustable lumbar support, breathable mesh back, and 4D armrests. Perfect for the home office.", 
                        ImageUrl = "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600" 
                    },
                    new Product { 
                        Name = "Running Shoes Pro", 
                        Sku = "SPT-RSP-005", 
                        Price = 129.99m, 
                        StockQuantity = 60, 
                        CategoryId = 11, 
                        Description = "Lightweight and responsive running shoes with advanced cushioning technology. Engineered for both road and trail running.", 
                        ImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600" 
                    },
                    new Product { 
                        Name = "Flagship Smartphone 16", 
                        Sku = "PHN-FS-006", 
                        Price = 999.99m, 
                        StockQuantity = 25, 
                        CategoryId = 3, 
                        Description = "The ultimate smartphone experience with a 6.7\" Dynamic AMOLED display, 200MP camera system, 5000mAh battery, and lightning-fast processor.", 
                        ImageUrl = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600" 
                    },
                    new Product { 
                        Name = "Designer Cotton T-Shirt", 
                        Sku = "CLT-DCT-007", 
                        Price = 39.99m, 
                        StockQuantity = 150, 
                        CategoryId = 6, 
                        Description = "Premium 100% organic cotton t-shirt with a modern relaxed fit. Available in multiple colors. Machine washable.", 
                        ImageUrl = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600" 
                    },
                    new Product { 
                        Name = "Automatic Espresso Machine", 
                        Sku = "APL-AEM-008", 
                        Price = 699.99m, 
                        StockQuantity = 0, 
                        CategoryId = 10, 
                        Description = "Brew barista-quality espresso at home with this fully automatic machine featuring a built-in grinder, milk frother, and touchscreen controls.", 
                        ImageUrl = "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600" 
                    },
                    new Product { 
                        Name = "Bestseller Novel Collection", 
                        Sku = "BKS-BNC-009", 
                        Price = 24.99m, 
                        StockQuantity = 200, 
                        CategoryId = 12, 
                        Description = "A curated collection of 3 award-winning novels from this year's bestseller lists. Hardcover editions with beautiful cover art.", 
                        ImageUrl = "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600" 
                    },
                    new Product { 
                        Name = "Bluetooth Portable Speaker", 
                        Sku = "AUD-BPS-010", 
                        Price = 79.99m, 
                        StockQuantity = 75, 
                        CategoryId = 4, 
                        Description = "Waterproof portable speaker with 360° sound, 20-hour battery, and deep bass. Perfect for outdoor adventures.", 
                        ImageUrl = "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600" 
                    },
                    new Product { 
                        Name = "Silk Summer Dress", 
                        Sku = "CLT-SSD-011", 
                        Price = 89.99m, 
                        StockQuantity = 35, 
                        CategoryId = 7, 
                        Description = "Elegant silk dress with a flattering A-line silhouette. Features a delicate floral print, perfect for summer events.", 
                        ImageUrl = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600" 
                    },
                    new Product { 
                        Name = "Mechanical Gaming Keyboard", 
                        Sku = "ELC-MGK-012", 
                        Price = 159.99m, 
                        StockQuantity = 40, 
                        CategoryId = 1, 
                        Description = "RGB mechanical keyboard with hot-swappable switches, aluminum frame, and per-key backlighting. Built for gamers and typists.", 
                        ImageUrl = "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600" 
                    }
                };
                
                await context.Products.AddRangeAsync(products);
                await context.SaveChangesAsync();
            }

            // Seed Users if mock data is missing
            if (!await context.Users.AnyAsync(u => u.Email == "sarah@example.com"))
            {
                var users = new List<User>
                {
                    new User { FirstName = "Sarah", LastName = "Johnson", Email = "sarah@example.com", PasswordHash = "hashed_pw", Role = "Customer" },
                    new User { FirstName = "Mike", LastName = "Chen", Email = "mike@example.com", PasswordHash = "hashed_pw", Role = "Customer" },
                    new User { FirstName = "Emily", LastName = "Davis", Email = "emily@example.com", PasswordHash = "hashed_pw", Role = "Customer" },
                    new User { FirstName = "James", LastName = "Wilson", Email = "james@example.com", PasswordHash = "hashed_pw", Role = "Customer" }
                };
                await context.Users.AddRangeAsync(users);
                await context.SaveChangesAsync();
            }

            // Seed Orders if mock data is missing
            if (!await context.Orders.AnyAsync())
            {
                // Assign to user id 2 (Sarah) and 3 (Mike) - assuming they get IDs 2, 3
                var sarah = await context.Users.FirstOrDefaultAsync(u => u.Email == "sarah@example.com");
                var mike = await context.Users.FirstOrDefaultAsync(u => u.Email == "mike@example.com");
                var emily = await context.Users.FirstOrDefaultAsync(u => u.Email == "emily@example.com");

                if (sarah != null && mike != null && emily != null)
                {
                    var p1 = await context.Products.FirstOrDefaultAsync(p => p.Sku == "AUD-WH-001");
                    var p2 = await context.Products.FirstOrDefaultAsync(p => p.Sku == "LAP-USP-002");
                    var p5 = await context.Products.FirstOrDefaultAsync(p => p.Sku == "SPT-RSP-005");
                    var p7 = await context.Products.FirstOrDefaultAsync(p => p.Sku == "CLT-DCT-007");

                    var orders = new List<Order>
                    {
                        new Order { 
                            UserId = sarah.Id, TotalAmount = 499.98m, Status = "Delivered", ShippingAddress = "123 Main St, New York, NY 10001", CreatedAt = DateTime.UtcNow.AddDays(-60),
                            Items = new List<OrderItem> { new OrderItem { ProductId = p1?.Id ?? 1, Quantity = 2, UnitPrice = 149.99m } }
                        },
                        new Order { 
                            UserId = sarah.Id, TotalAmount = 1299.99m, Status = "Shipped", ShippingAddress = "123 Main St, New York, NY 10001", CreatedAt = DateTime.UtcNow.AddDays(-14),
                            Items = new List<OrderItem> { new OrderItem { ProductId = p2?.Id ?? 2, Quantity = 1, UnitPrice = 1299.99m } }
                        },
                        new Order { 
                            UserId = sarah.Id, TotalAmount = 129.99m, Status = "Processing", ShippingAddress = "456 Oak Ave, Los Angeles, CA 90001", CreatedAt = DateTime.UtcNow.AddDays(-2),
                            Items = new List<OrderItem> { new OrderItem { ProductId = p5?.Id ?? 5, Quantity = 1, UnitPrice = 129.99m } }
                        },
                        new Order { 
                            UserId = mike.Id, TotalAmount = 79.98m, Status = "Pending", ShippingAddress = "789 Pine Rd, Chicago, IL 60601", CreatedAt = DateTime.UtcNow.AddDays(-1),
                            Items = new List<OrderItem> { new OrderItem { ProductId = p7?.Id ?? 7, Quantity = 2, UnitPrice = 39.99m } }
                        },
                        new Order { 
                            UserId = emily.Id, TotalAmount = 1449.98m, Status = "Pending", ShippingAddress = "321 Elm St, Miami, FL 33101", CreatedAt = DateTime.UtcNow,
                            Items = new List<OrderItem> { 
                                new OrderItem { ProductId = p1?.Id ?? 1, Quantity = 1, UnitPrice = 149.99m },
                                new OrderItem { ProductId = p2?.Id ?? 2, Quantity = 1, UnitPrice = 1299.99m }
                            }
                        }
                    };
                    await context.Orders.AddRangeAsync(orders);
                    await context.SaveChangesAsync();
                }
            }

            // Seed Reviews if none exist
            if (!await context.Reviews.AnyAsync())
            {
                var sarah = await context.Users.FirstOrDefaultAsync(u => u.Email == "sarah@example.com");
                var mike = await context.Users.FirstOrDefaultAsync(u => u.Email == "mike@example.com");
                var p1 = await context.Products.FirstOrDefaultAsync(p => p.Sku == "AUD-WH-001");
                var p2 = await context.Products.FirstOrDefaultAsync(p => p.Sku == "LAP-USP-002");

                if (sarah != null && mike != null && p1 != null && p2 != null)
                {
                    var reviews = new List<Review>
                    {
                        new Review { ProductId = p1.Id, UserId = sarah.Id, Rating = 5, Comment = "These headphones are amazing! The noise cancellation is top notch.", CreatedAt = DateTime.UtcNow.AddDays(-10) },
                        new Review { ProductId = p1.Id, UserId = mike.Id, Rating = 4, Comment = "Great sound quality, but a bit heavy on the ears after 4 hours.", CreatedAt = DateTime.UtcNow.AddDays(-5) },
                        new Review { ProductId = p2.Id, UserId = sarah.Id, Rating = 5, Comment = "Incredible laptop. Blazing fast and the battery lasts all day.", CreatedAt = DateTime.UtcNow.AddDays(-2) }
                    };
                    await context.Reviews.AddRangeAsync(reviews);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
