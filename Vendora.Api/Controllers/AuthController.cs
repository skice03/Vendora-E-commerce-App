using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vendora.Api.Data;
using Vendora.Api.Models;
using BCrypt.Net;

namespace Vendora.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuthController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Registers a new user with a hashed password (REQ-03, REQ-08).
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> RegisterAsync([FromBody] User user)
        {
            if (await _context.Users.AnyAsync(userRecord => userRecord.Email == user.Email))
            {
                return BadRequest("Email already registered.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registration successful!" });
        }

        /// <summary>
        /// Validates user credentials and returns user data (REQ-07, REQ-08).
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> LoginAsync([FromBody] LoginRequest loginData)
        {
            var dbUser = await _context.Users.FirstOrDefaultAsync(userRecord => userRecord.Email == loginData.Email);

            if (dbUser == null || !BCrypt.Net.BCrypt.Verify(loginData.Password, dbUser.PasswordHash))
            {
                return Unauthorized("Invalid email or password.");
            }

            return Ok(new
            {
                id = dbUser.Id,
                firstName = dbUser.FirstName,
                role = dbUser.Role
            });
        }
    }
}