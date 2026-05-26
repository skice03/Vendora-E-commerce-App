using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vendora.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAdminSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "Email", "FirstName", "LastName" },
                values: new object[] { new DateTime(2026, 5, 26, 10, 38, 1, 180, DateTimeKind.Utc).AddTicks(2970), "admin@vendora.com", "Admin", "Vendora" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "Email", "FirstName", "LastName" },
                values: new object[] { new DateTime(2026, 5, 25, 19, 39, 33, 697, DateTimeKind.Utc).AddTicks(1570), "marinelcipu21@gmail.com", "Marinel", "Cipu" });
        }
    }
}
