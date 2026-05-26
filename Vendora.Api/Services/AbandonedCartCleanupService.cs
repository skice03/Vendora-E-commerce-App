using Microsoft.EntityFrameworkCore;
using Vendora.Api.Data;

namespace Vendora.Api.Services
{
    /// <summary>
    /// REQ-68: Background worker that automatically deletes abandoned orders
    /// (AwaitingPayment status) older than 7 days, restocking the reserved items.
    /// Runs every 6 hours.
    /// </summary>
    public class AbandonedCartCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AbandonedCartCleanupService> _logger;

        // How often to check (every 6 hours)
        private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(6);

        // Orders older than this are considered abandoned
        private static readonly TimeSpan AbandonmentThreshold = TimeSpan.FromDays(7);

        public AbandonedCartCleanupService(
            IServiceScopeFactory scopeFactory,
            ILogger<AbandonedCartCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AbandonedCartCleanupService started. Checking every {Hours} hours for orders older than {Days} days.",
                CheckInterval.TotalHours, AbandonmentThreshold.TotalDays);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupAbandonedOrdersAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during abandoned cart cleanup.");
                }

                await Task.Delay(CheckInterval, stoppingToken);
            }
        }

        private async Task CleanupAbandonedOrdersAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var cutoffDate = DateTime.UtcNow.Subtract(AbandonmentThreshold);

            // Find all abandoned orders (AwaitingPayment and older than 7 days)
            var abandonedOrders = await context.Orders
                .Include(o => o.Items)
                    .ThenInclude(oi => oi.Product)
                .Where(o => o.Status == "AwaitingPayment" && o.CreatedAt < cutoffDate)
                .ToListAsync();

            if (abandonedOrders.Count == 0)
            {
                _logger.LogDebug("No abandoned orders found.");
                return;
            }

            _logger.LogInformation("Found {Count} abandoned order(s) to clean up.", abandonedOrders.Count);

            foreach (var order in abandonedOrders)
            {
                // Replenish stock for each item
                foreach (var item in order.Items)
                {
                    if (item.Product != null)
                    {
                        item.Product.StockQuantity += item.Quantity;
                        _logger.LogDebug("Restocked {Qty}x product '{Name}' (ID={Id}).",
                            item.Quantity, item.Product.Name, item.Product.Id);
                    }
                }

                // Remove the order items and order
                context.OrderItems.RemoveRange(order.Items);
                context.Orders.Remove(order);
            }

            await context.SaveChangesAsync();
            _logger.LogInformation("Cleaned up {Count} abandoned order(s) and restocked items.", abandonedOrders.Count);
        }
    }
}
