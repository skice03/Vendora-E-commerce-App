using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Vendora.Api.Controllers;
using Vendora.Api.Models;
using Vendora.Tests.Helpers;

namespace Vendora.Tests.IntegrationTests
{
    /// <summary>
    /// Integration tests for AuthController.
    /// Tests the full registration and login flows against an in-memory database.
    /// </summary>
    [TestFixture]
    public class AuthControllerTests
    {
        private IConfiguration _configuration = null!;

        [SetUp]
        public void SetUp()
        {
            var configData = new Dictionary<string, string?>
            {
                { "Jwt:Key", "VendoraSuperSecretKeyForJwtAuthenticationWhichShouldBeLongEnoughToWorkProperly" },
                { "Jwt:Issuer", "VendoraApi" },
                { "Jwt:Audience", "VendoraReactClient" }
            };

            _configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configData)
                .Build();
        }

        // REQ-01, REQ-03, REQ-05: Registration with valid data should succeed
        [Test]
        public async Task RegisterAsync_ValidUser_ReturnsOk()
        {
            using var context = TestDbContextFactory.CreateContext();
            var controller = new AuthController(context, _configuration);

            var newUser = new User
            {
                FirstName = "Test",
                LastName = "User",
                Email = "testuser@vendora.com",
                PasswordHash = "SecurePass123!"
            };

            var result = await controller.RegisterAsync(newUser);

            Assert.That(result, Is.InstanceOf<OkObjectResult>(), "Registration should return 200 OK");

            var savedUser = context.Users.FirstOrDefault(u => u.Email == "testuser@vendora.com");
            Assert.That(savedUser, Is.Not.Null, "User should exist in database");
            Assert.That(savedUser!.PasswordHash, Does.StartWith("$2"),
                "Password should be BCrypt-hashed, not stored in plain text (REQ-03)");
        }

        // REQ-02: Duplicate email registration should fail
        [Test]
        public async Task RegisterAsync_DuplicateEmail_ReturnsBadRequest()
        {
            using var context = TestDbContextFactory.CreateContext();
            var controller = new AuthController(context, _configuration);

            // Register first user
            var firstUser = new User
            {
                FirstName = "First",
                LastName = "User",
                Email = "duplicate@vendora.com",
                PasswordHash = "SecurePass123!"
            };
            await controller.RegisterAsync(firstUser);

            // Attempt duplicate registration
            var duplicateUser = new User
            {
                FirstName = "Second",
                LastName = "User",
                Email = "duplicate@vendora.com",
                PasswordHash = "AnotherPass456!"
            };
            var result = await controller.RegisterAsync(duplicateUser);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>(),
                "Duplicate email registration must return 400 (REQ-02)");
        }

        // REQ-07, REQ-08: Login with correct credentials returns JWT token
        [Test]
        public async Task LoginAsync_ValidCredentials_ReturnsToken()
        {
            using var context = TestDbContextFactory.CreateContext();
            var controller = new AuthController(context, _configuration);

            // Register a user first
            var user = new User
            {
                FirstName = "Login",
                LastName = "Test",
                Email = "login@vendora.com",
                PasswordHash = "ValidPassword1!"
            };
            await controller.RegisterAsync(user);

            // Login with correct credentials
            var loginRequest = new LoginRequest
            {
                Email = "login@vendora.com",
                Password = "ValidPassword1!"
            };
            var result = await controller.LoginAsync(loginRequest);

            Assert.That(result, Is.InstanceOf<OkObjectResult>(), "Valid login should return 200 OK");

            var okResult = result as OkObjectResult;
            var responseData = okResult!.Value;
            var tokenProperty = responseData!.GetType().GetProperty("token");
            Assert.That(tokenProperty, Is.Not.Null, "Response must include a JWT token (REQ-08)");

            var tokenValue = tokenProperty!.GetValue(responseData) as string;
            Assert.That(tokenValue, Is.Not.Null.And.Not.Empty, "Token must not be empty");
        }

        // REQ-07: Login with wrong password should fail
        [Test]
        public async Task LoginAsync_WrongPassword_ReturnsUnauthorized()
        {
            using var context = TestDbContextFactory.CreateContext();
            var controller = new AuthController(context, _configuration);

            // Register a user
            var user = new User
            {
                FirstName = "Wrong",
                LastName = "Pass",
                Email = "wrongpass@vendora.com",
                PasswordHash = "CorrectPassword1!"
            };
            await controller.RegisterAsync(user);

            // Login with wrong password
            var loginRequest = new LoginRequest
            {
                Email = "wrongpass@vendora.com",
                Password = "TotallyWrongPassword!"
            };
            var result = await controller.LoginAsync(loginRequest);

            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>(),
                "Wrong password must return 401 Unauthorized (REQ-07)");
        }

        // REQ-07: Login with non-existent email should fail
        [Test]
        public async Task LoginAsync_NonExistentEmail_ReturnsUnauthorized()
        {
            using var context = TestDbContextFactory.CreateContext();
            var controller = new AuthController(context, _configuration);

            var loginRequest = new LoginRequest
            {
                Email = "noexist@vendora.com",
                Password = "SomePassword1!"
            };
            var result = await controller.LoginAsync(loginRequest);

            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>(),
                "Non-existent email must return 401 (REQ-07)");
        }
    }
}
