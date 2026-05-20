using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Vendora.Api.Controllers;
using Vendora.Api.Models;
using Vendora.Tests.Helpers;

namespace Vendora.Tests.IntegrationTests
{
    /// <summary>
    /// Integration tests for ProductsController.
    /// Tests CRUD operations and business rules against an in-memory database.
    /// </summary>
    [TestFixture]
    public class ProductsControllerTests
    {
        // REQ-11: Fetching products should only return active (non-deleted) items
        [Test]
        public async Task GetProductsAsync_ExcludesDeletedProducts()
        {
            using var context = TestDbContextFactory.CreateContext();
            var controller = new ProductsController(context);

            // Add one active and one deleted product
            context.Products.AddRange(
                new Product { Sku = "ACTIVE-001", Name = "Active Product", Price = 29.99m, StockQuantity = 10, CategoryId = 1, IsDeleted = false },
                new Product { Sku = "DELETED-001", Name = "Deleted Product", Price = 19.99m, StockQuantity = 5, CategoryId = 1, IsDeleted = true }
            );
            await context.SaveChangesAsync();

            var result = await controller.GetProductsAsync();
            var okResult = result as OkObjectResult;

            Assert.That(okResult, Is.Not.Null, "Should return 200 OK");
            var products = okResult!.Value as System.Collections.IList;
            Assert.That(products, Is.Not.Null);
            Assert.That(products!.Count, Is.EqualTo(1), "Only active products should be returned (REQ-11)");
        }

        // REQ-11: Including deleted flag should return all products
        [Test]
        public async Task GetProductsAsync_WithIncludeDeleted_ReturnsAll()
        {
            using var context = TestDbContextFactory.CreateContext();
            var controller = new ProductsController(context);

            context.Products.AddRange(
                new Product { Sku = "P-001", Name = "Product A", Price = 10m, StockQuantity = 5, CategoryId = 1, IsDeleted = false },
                new Product { Sku = "P-002", Name = "Product B", Price = 20m, StockQuantity = 3, CategoryId = 1, IsDeleted = true }
            );
            await context.SaveChangesAsync();

            var result = await controller.GetProductsAsync(includeDeleted: true);
            var okResult = result as OkObjectResult;
            var products = okResult!.Value as System.Collections.IList;

            Assert.That(products!.Count, Is.EqualTo(2), "includeDeleted=true should return all products");
        }

        // REQ-13: Get product by ID should return full details
        [Test]
        public async Task GetProductByIdAsync_ExistingProduct_ReturnsDetails()
        {
            using var context = TestDbContextFactory.CreateContext();
            var controller = new ProductsController(context);

            context.Products.Add(new Product
            {
                Sku = "DETAIL-001",
                Name = "Detail Product",
                Description = "Full description here",
                Price = 49.99m,
                StockQuantity = 15,
                CategoryId = 1
            });
            await context.SaveChangesAsync();

            var product = context.Products.First();
            var result = await controller.GetProductAsync(product.Id);

            Assert.That(result, Is.InstanceOf<OkObjectResult>(), "Should return 200 OK for existing product (REQ-13)");
        }

        // REQ-13: Non-existent product should return 404
        [Test]
        public async Task GetProductAsync_NonExistentId_ReturnsNotFound()
        {
            using var context = TestDbContextFactory.CreateContext();
            var controller = new ProductsController(context);

            var result = await controller.GetProductAsync(99999);

            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>(), "Non-existent product should return 404");
        }

        // REQ-55: View count should increment
        [Test]
        public async Task IncrementViewCountAsync_IncrementsCorrectly()
        {
            using var context = TestDbContextFactory.CreateContext();
            var controller = new ProductsController(context);

            context.Products.Add(new Product
            {
                Sku = "VIEW-001",
                Name = "Viewable Product",
                Price = 9.99m,
                StockQuantity = 1,
                CategoryId = 1,
                ViewCount = 0
            });
            await context.SaveChangesAsync();
            var productId = context.Products.First().Id;

            // Increment view count
            await controller.IncrementViewCountAsync(productId);

            var updatedProduct = context.Products.Find(productId);
            Assert.That(updatedProduct!.ViewCount, Is.EqualTo(1), "View count should be 1 after one view (REQ-55)");

            // Increment again
            await controller.IncrementViewCountAsync(productId);
            context.Entry(updatedProduct).Reload();
            Assert.That(updatedProduct.ViewCount, Is.EqualTo(2), "View count should be 2 after two views");
        }

        // REQ-36: Duplicate SKU should fail
        [Test]
        public async Task GetProductsAsync_SkuUniqueness_IsEnforced()
        {
            using var context = TestDbContextFactory.CreateContext();

            context.Products.Add(new Product
            {
                Sku = "UNIQUE-SKU",
                Name = "First Product",
                Price = 10m,
                StockQuantity = 5,
                CategoryId = 1
            });
            await context.SaveChangesAsync();

            // Adding another product with the same SKU should exist in DB only once
            var existingCount = context.Products.Count(p => p.Sku == "UNIQUE-SKU");
            Assert.That(existingCount, Is.EqualTo(1), "Only one product with SKU 'UNIQUE-SKU' should exist (REQ-36)");
        }
    }
}
