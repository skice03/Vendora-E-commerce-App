using Microsoft.EntityFrameworkCore;
using Vendora.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// connection from appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

// register db context (EF Core + MySQL)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySQL(connectionString));

// controller services
builder.Services.AddControllers();

// to allow access from React (via CORS)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// OpenAPI documentation
builder.Services.AddOpenApi();

var app = builder.Build();

// http pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowReact");

app.UseHttpsRedirection();

app.UseAuthorization();

// routes to be added (eg. /api/orders, /api/products)

// map controller to activate routes
app.MapControllers();

app.Run();