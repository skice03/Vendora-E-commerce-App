using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vendora.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProductImagesNavProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 5, 27, 19, 24, 10, 740, DateTimeKind.Utc).AddTicks(6600));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 5, 27, 17, 4, 9, 348, DateTimeKind.Utc).AddTicks(8500));
        }
    }
}
