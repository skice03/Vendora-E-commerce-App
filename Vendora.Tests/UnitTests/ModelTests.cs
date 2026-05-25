using Vendora.Api.Models;

namespace Vendora.Tests.UnitTests
{
    /// <summary>
    /// Unit tests for data model default values and business rules.
    /// Validates that model properties initialize correctly per SRS requirements.
    /// </summary>
    [TestFixture]
    public class ModelTests
    {
        // REQ-13: Product must have correct default property values
        [Test]
        public void Should_Initialize_Product_With_Correct_Defaults()
        {
            // Arrange & Act
            var product = new Product();

            // Assert
            Assert.That(product.Id, Is.EqualTo(0));
            Assert.That(product.Sku, Is.EqualTo(string.Empty));
            Assert.That(product.Name, Is.EqualTo(string.Empty));
            Assert.That(product.Price, Is.EqualTo(0m));
            Assert.That(product.StockQuantity, Is.EqualTo(0));
            Assert.That(product.IsDeleted, Is.False, "New products should not be marked as deleted");
            Assert.That(product.ViewCount, Is.EqualTo(0), "New products should have zero views");
        }

        // REQ-37: Soft-delete flag must be settable
        [Test]
        public void Should_Mark_Product_As_Deleted_When_Soft_Delete_Is_Applied()
        {
            // Arrange
            var product = new Product { Name = "Test Item", IsDeleted = false };

            // Act
            product.IsDeleted = true;

            // Assert
            Assert.That(product.IsDeleted, Is.True, "Product should be marked as deleted after soft-delete");
        }

        // REQ-13: User model default role should be Customer
        [Test]
        public void Should_Assign_Customer_Role_By_Default()
        {
            // Arrange & Act
            var user = new User();

            // Assert
            Assert.That(user.Role, Is.EqualTo("Customer"), "Default role must be 'Customer' not 'Admin'");
        }

        // REQ-46: User should have a CreatedAt timestamp
        [Test]
        public void Should_Set_CreatedAt_Timestamp_Automatically()
        {
            // Arrange
            var beforeCreation = DateTime.UtcNow.AddSeconds(-1);

            // Act
            var user = new User();

            // Assert
            Assert.That(user.CreatedAt, Is.GreaterThan(beforeCreation));
            Assert.That(user.CreatedAt, Is.LessThanOrEqualTo(DateTime.UtcNow));
        }

        // REQ-25: Order should store total amount and status
        [Test]
        public void Should_Initialize_Order_With_Pending_Status()
        {
            // Arrange & Act
            var order = new Order();

            // Assert
            Assert.That(order.TotalAmount, Is.EqualTo(0m));
            Assert.That(order.Status, Is.EqualTo("Pending"));
        }

        // REQ-56: Review rating must store a value between 1 and 5
        [Test]
        public void Should_Store_Valid_Rating_And_Comment()
        {
            // Arrange & Act
            var review = new Review { Rating = 4, Comment = "Great product!" };

            // Assert
            Assert.That(review.Rating, Is.EqualTo(4));
            Assert.That(review.Comment, Is.EqualTo("Great product!"));
            Assert.That(review.IsDeleted, Is.False, "New reviews should not be hidden");
        }

        // REQ-60: Review soft-delete flag
        [Test]
        public void Should_Hide_Review_When_Admin_Soft_Deletes_It()
        {
            // Arrange
            var review = new Review { Rating = 1, Comment = "Spam" };

            // Act
            review.IsDeleted = true;

            // Assert
            Assert.That(review.IsDeleted, Is.True, "Admin should be able to hide a review");
        }

        // REQ-78, REQ-79: AuditLog must capture all required fields
        [Test]
        public void Should_Capture_All_Required_Audit_Log_Fields()
        {
            // Arrange & Act
            var auditLog = new AuditLog
            {
                AdminId = 1,
                ActionType = "DELETE",
                TargetTable = "Products",
                TargetId = "42",
                Details = "Deleted product SKU-001"
            };

            // Assert
            Assert.That(auditLog.AdminId, Is.EqualTo(1));
            Assert.That(auditLog.ActionType, Is.EqualTo("DELETE"));
            Assert.That(auditLog.TargetTable, Is.EqualTo("Products"));
            Assert.That(auditLog.TargetId, Is.EqualTo("42"));
            Assert.That(auditLog.Timestamp, Is.LessThanOrEqualTo(DateTime.UtcNow));
        }

        // REQ-52: Category supports parent-child hierarchy
        [Test]
        public void Should_Support_Parent_Child_Category_Hierarchy()
        {
            // Arrange
            var parent = new Category { Id = 1, Name = "Electronics", ParentCategoryId = null };
            var child = new Category { Id = 2, Name = "Laptops", ParentCategoryId = 1 };

            // Act & Assert
            Assert.That(parent.ParentCategoryId, Is.Null, "Root category should have no parent");
            Assert.That(child.ParentCategoryId, Is.EqualTo(1), "Child should reference parent");
        }
    }
}
