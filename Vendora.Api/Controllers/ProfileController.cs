using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vendora.Api.Data;
using Vendora.Api.Models;

namespace Vendora.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProfileController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET /api/profile
        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            return Ok(new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.Role
            });
        }

        // PUT /api/profile
        public class UpdateProfileRequest
        {
            public string FirstName { get; set; } = string.Empty;
            public string LastName { get; set; } = string.Empty;
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                user.FirstName,
                user.LastName,
                Message = "Profile updated successfully."
            });
        }

        // GET /api/profile/addresses
        [HttpGet("addresses")]
        public async Task<IActionResult> GetAddresses()
        {
            var userId = GetCurrentUserId();
            var addresses = await _context.Addresses
                .Where(a => a.UserId == userId)
                .ToListAsync();

            return Ok(addresses);
        }

        // POST /api/profile/addresses
        public class AddAddressRequest
        {
            public string Street { get; set; } = string.Empty;
            public string City { get; set; } = string.Empty;
            public string ZipCode { get; set; } = string.Empty;
            public string Country { get; set; } = string.Empty;
            public bool IsDefault { get; set; }
        }

        [HttpPost("addresses")]
        public async Task<IActionResult> AddAddress([FromBody] AddAddressRequest request)
        {
            var userId = GetCurrentUserId();

            // If user checks IsDefault, unset default for other addresses
            if (request.IsDefault)
            {
                var existingAddresses = await _context.Addresses.Where(a => a.UserId == userId).ToListAsync();
                foreach (var addr in existingAddresses)
                {
                    addr.IsDefault = false;
                }
            }

            var address = new Address
            {
                UserId = userId,
                Street = request.Street,
                City = request.City,
                ZipCode = request.ZipCode,
                Country = request.Country,
                IsDefault = request.IsDefault
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            return StatusCode(201, address);
        }

        // DELETE /api/profile/addresses/{id}
        [HttpDelete("addresses/{id}")]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            var userId = GetCurrentUserId();
            var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

            if (address == null) return NotFound();

            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Address deleted." });
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            return 0;
        }
    }
}
