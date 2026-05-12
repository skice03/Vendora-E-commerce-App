using Microsoft.EntityFrameworkCore;
using Vendora.Api.Models;

namespace Vendora.Api.Data
{
    // the database context responsible for managing connections and mapping models to MySQL tables
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // business rules
        public DbSet<User> Users { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Category> Categories { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Ensures the prices are saved as DECIMAL(10,2) (REQ-77 / Financial Rules)
            // and enforces SKU uniqueness (REQ-36)
            modelBuilder.Entity<Product>()
                .Property(product => product.Price)
                .HasPrecision(10, 2);

            modelBuilder.Entity<Product>()
                .HasIndex(product => product.Sku)
                .IsUnique();

            modelBuilder.Entity<Order>()
                .Property(order => order.TotalAmount)
                .HasPrecision(10, 2);

            modelBuilder.Entity<OrderItem>()
                .Property(item => item.UnitPrice)
                .HasPrecision(10, 2);

            // REQ-52: Configure parent-child category relationship
            modelBuilder.Entity<Category>()
                .HasOne(category => category.ParentCategory)
                .WithMany(category => category.SubCategories)
                .HasForeignKey(category => category.ParentCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seed default Administrator (REQ-02)
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 1,
                FirstName = "Marinel",
                LastName = "Cipu",
                Email = "marinelcipu21@gmail.com",
                PasswordHash = "$2a$11$g1zVIcC.l0LBmG0xZ1V7Xe/GwoR9pfE/OXDdzzOgcW1iEN0yiDbSy", // 'adminvendora'
                Role = "Admin"
            });

            // REQ-52: Seed multi-level categories (parent-child relational structure)
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Electronics", ParentCategoryId = null },
                new Category { Id = 2, Name = "Laptops", ParentCategoryId = 1 },
                new Category { Id = 3, Name = "Smartphones", ParentCategoryId = 1 },
                new Category { Id = 4, Name = "Audio", ParentCategoryId = 1 },
                new Category { Id = 5, Name = "Clothing", ParentCategoryId = null },
                new Category { Id = 6, Name = "Men's Wear", ParentCategoryId = 5 },
                new Category { Id = 7, Name = "Women's Wear", ParentCategoryId = 5 },
                new Category { Id = 8, Name = "Home & Kitchen", ParentCategoryId = null },
                new Category { Id = 9, Name = "Furniture", ParentCategoryId = 8 },
                new Category { Id = 10, Name = "Appliances", ParentCategoryId = 8 },
                new Category { Id = 11, Name = "Sports & Outdoors", ParentCategoryId = null },
                new Category { Id = 12, Name = "Books", ParentCategoryId = null }
            );
        }
    }
}