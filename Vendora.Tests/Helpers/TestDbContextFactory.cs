using Microsoft.EntityFrameworkCore;
using Vendora.Api.Data;

namespace Vendora.Tests.Helpers
{
    /// <summary>
    /// Creates isolated in-memory database contexts for unit testing.
    /// Each call generates a unique database name to prevent cross-test contamination.
    /// </summary>
    public static class TestDbContextFactory
    {
        public static ApplicationDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var context = new ApplicationDbContext(options);
            context.Database.EnsureCreated();
            return context;
        }
    }
}
