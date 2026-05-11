using System;
using System.Linq;
using Vendora.Api.Data;
using Microsoft.EntityFrameworkCore;

var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
optionsBuilder.UseMySql("server=localhost;database=VendoraDB;user=root;password=root", ServerVersion.AutoDetect("server=localhost;database=VendoraDB;user=root;password=root"));
using var context = new ApplicationDbContext(optionsBuilder.Options);

var reviews = context.Reviews.ToList();
foreach(var r in reviews) {
    Console.WriteLine($"Review: {r.Id}, Product: {r.ProductId}, Rating: {r.Rating}");
}
