using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vendora.Api.Data;
using Vendora.Api.Models;
using BCrypt.Net;

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
                user.Role,
                user.CreatedAt
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

        // PUT /api/profile/addresses/{id} (REQ-42: edit saved addresses)
        public class EditAddressRequest
        {
            public string Street { get; set; } = string.Empty;
            public string City { get; set; } = string.Empty;
            public string ZipCode { get; set; } = string.Empty;
            public string Country { get; set; } = string.Empty;
            public bool IsDefault { get; set; }
        }

        [HttpPut("addresses/{id}")]
        public async Task<IActionResult> EditAddressAsync(int id, [FromBody] EditAddressRequest request)
        {
            var userId = GetCurrentUserId();
            var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

            if (address == null)
            {
                return NotFound(new { Message = "Address not found." });
            }

            // If setting as default, unset all others
            if (request.IsDefault)
            {
                var otherAddresses = await _context.Addresses
                    .Where(a => a.UserId == userId && a.Id != id)
                    .ToListAsync();
                foreach (var otherAddress in otherAddresses)
                {
                    otherAddress.IsDefault = false;
                }
            }

            address.Street = request.Street;
            address.City = request.City;
            address.ZipCode = request.ZipCode;
            address.Country = request.Country;
            address.IsDefault = request.IsDefault;

            await _context.SaveChangesAsync();

            return Ok(address);
        }

        // DELETE /api/profile/addresses/{id}
        [HttpDelete("addresses/{id}")]
        public async Task<IActionResult> DeleteAddressAsync(int id)
        {
            var userId = GetCurrentUserId();
            var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

            if (address == null)
            {
                return NotFound();
            }

            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Address deleted." });
        }

        // PUT /api/profile/change-password (REQ-44: change password with current password validation)
        public class ChangePasswordRequest
        {
            public string CurrentPassword { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePasswordAsync([FromBody] ChangePasswordRequest request)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound(new { Message = "User not found." });
            }

            // Validate current password using BCrypt
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { Message = "Current password is incorrect." });
            }

            // Enforce minimum password length (REQ-04: 8 characters)
            if (request.NewPassword.Length < 8)
            {
                return BadRequest(new { Message = "New password must be at least 8 characters." });
            }

            // Hash and save new password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Password changed successfully." });
        }

        // REQ-45: GDPR account deletion — removes user and all associated data
        public class DeleteAccountRequest
        {
            public string Password { get; set; } = string.Empty;
        }

        [HttpDelete("delete-account")]
        public async Task<IActionResult> DeleteAccountAsync([FromBody] DeleteAccountRequest request)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null) return NotFound(new { Message = "User not found." });

            // Prevent admin account deletion
            if (user.Role == "Admin")
            {
                return BadRequest(new { Message = "Administrator accounts cannot be deleted." });
            }

            // Verify password before deletion
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return BadRequest(new { Message = "Incorrect password. Account deletion aborted." });
            }

            // Cascade delete all user data
            var wishlistItems = _context.WishlistItems.Where(w => w.UserId == userId);
            _context.WishlistItems.RemoveRange(wishlistItems);

            var reviews = _context.Reviews.Where(r => r.UserId == userId);
            _context.Reviews.RemoveRange(reviews);

            var addresses = _context.Addresses.Where(a => a.UserId == userId);
            _context.Addresses.RemoveRange(addresses);

            // Anonymize orders — preserve revenue but remove PII (REQ-45)
            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .ToListAsync();

            foreach (var order in orders)
            {
                order.UserId = null;
                order.ShippingAddress = "[Deleted Account]";
            }

            _context.Users.Remove(user);

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Your account and all associated data have been permanently deleted." });
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
