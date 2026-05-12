using Microsoft.EntityFrameworkCore;
using MySql.Data.MySqlClient;

namespace Vendora.Api.Data
{
    /// <summary>
    /// Responsible for ensuring the database exists and applying pending migrations on startup.
    /// The admin user and categories are seeded via EF Core HasData() in ApplicationDbContext.
    /// All other data (products, customers, orders, reviews) is populated at runtime
    /// by the admin and customers through the application's UI.
    /// </summary>
    public static class DataSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // Ensure the database exists by creating it if necessary.
            // MySQL requires the database to exist before EF Core can apply migrations.
            var connectionString = context.Database.GetConnectionString();
            if (!string.IsNullOrEmpty(connectionString))
            {
                var builder = new MySqlConnectionStringBuilder(connectionString);
                var databaseName = builder.Database;

                // Connect without specifying a database to create it if missing
                builder.Database = string.Empty;
                using var connection = new MySqlConnection(builder.ConnectionString);
                await connection.OpenAsync();

                using var command = connection.CreateCommand();
                command.CommandText = $"CREATE DATABASE IF NOT EXISTS `{databaseName}`;";
                await command.ExecuteNonQueryAsync();
            }

            // Apply pending migrations automatically on startup
            await context.Database.MigrateAsync();
        }
    }
}
