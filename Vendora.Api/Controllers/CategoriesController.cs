using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vendora.Api.Data;
using Vendora.Api.Models;

namespace Vendora.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Public: Retrieves all categories with parent-child hierarchy (REQ-52).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCategoriesAsync()
        {
            var categories = await _context.Categories
                .Include(category => category.SubCategories)
                .Select(category => new
                {
                    category.Id,
                    category.Name,
                    category.ParentCategoryId
                })
                .ToListAsync();

            return Ok(categories);
        }
    }
}
