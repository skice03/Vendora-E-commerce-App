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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Ensures the prices are saved as DECIMAL(10,2) (REQ-77 / Financial Rules)
            modelBuilder.Entity<Product>()
                .Property(product => product.Price)
                .HasPrecision(10, 2);

            modelBuilder.Entity<Order>()
                .Property(order => order.TotalAmount)
                .HasPrecision(10, 2);

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
        }
    }
}