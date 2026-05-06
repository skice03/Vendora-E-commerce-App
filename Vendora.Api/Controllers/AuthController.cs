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

        // registers a new user with a hashed password
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            // check if email exists already (REQ-02)
            if (await _context.Users.AnyAsync(u => u.Email == user.Email))
            {
                return BadRequest("Email already registered.");
            }

            // encrypt password (REQ-03)
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);

            // save to db
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registration successful!" });
        }

        // validate user credentials.

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest loginData)
        {
            var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginData.Email);

            if (dbUser == null || !BCrypt.Net.BCrypt.Verify(loginData.Password, dbUser.PasswordHash))
            {
                return Unauthorized("Invalid email or password.");
            }

            // return user data
            return Ok(new
            {
                id = dbUser.Id,
                firstName = dbUser.FirstName,
                role = dbUser.Role
            });
        }
    }

    // request login data
    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}