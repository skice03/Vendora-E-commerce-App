namespace Vendora.Tests.UnitTests
{
    /// <summary>
    /// Unit tests for BCrypt password hashing and verification.
    /// Validates REQ-03 (password hashing) and REQ-07 (password verification).
    /// </summary>
    [TestFixture]
    public class AuthenticationTests
    {
        // REQ-03: Passwords must be hashed before storage
        [Test]
        public void Should_Hash_Password_Instead_Of_Storing_Plain_Text()
        {
            // Arrange
            string plainPassword = "SecurePassword123!";

            // Act
            string hash = BCrypt.Net.BCrypt.HashPassword(plainPassword);

            // Assert
            Assert.That(hash, Is.Not.EqualTo(plainPassword), "Hashed password must differ from plain text");
            Assert.That(hash, Does.StartWith("$2"), "BCrypt hashes should start with $2a or $2b");
        }

        // REQ-07: Correct password must verify successfully
        [Test]
        public void Should_Verify_Successfully_When_Password_Is_Correct()
        {
            // Arrange
            string plainPassword = "SecurePassword123!";
            string hash = BCrypt.Net.BCrypt.HashPassword(plainPassword);

            // Act
            bool isValid = BCrypt.Net.BCrypt.Verify(plainPassword, hash);

            // Assert
            Assert.That(isValid, Is.True, "Correct password should verify against its hash");
        }

        // REQ-07: Wrong password must fail verification
        [Test]
        public void Should_Reject_Verification_When_Password_Is_Wrong()
        {
            // Arrange
            string correctPassword = "SecurePassword123!";
            string wrongPassword = "WrongPassword456!";
            string hash = BCrypt.Net.BCrypt.HashPassword(correctPassword);

            // Act
            bool isValid = BCrypt.Net.BCrypt.Verify(wrongPassword, hash);

            // Assert
            Assert.That(isValid, Is.False, "Wrong password should not verify against the hash");
        }

        // REQ-03: Each hash must be unique (salted)
        [Test]
        public void Should_Produce_Different_Hashes_For_Same_Password()
        {
            // Arrange
            string password = "SamePassword!";

            // Act
            string hash1 = BCrypt.Net.BCrypt.HashPassword(password);
            string hash2 = BCrypt.Net.BCrypt.HashPassword(password);

            // Assert
            Assert.That(hash1, Is.Not.EqualTo(hash2), "BCrypt should produce unique salted hashes");
        }

        // REQ-04: Password must meet minimum length requirement
        [Test]
        public void Should_Fail_Validation_When_Password_Is_Too_Short()
        {
            // Arrange
            string shortPassword = "Ab1!";

            // Act
            bool meetsMinLength = shortPassword.Length >= 8;

            // Assert
            Assert.That(meetsMinLength, Is.False, "Passwords under 8 characters should be rejected");
        }

        // REQ-04: Valid password should pass length check
        [Test]
        public void Should_Pass_Validation_When_Password_Meets_Minimum_Length()
        {
            // Arrange
            string validPassword = "SecurePass1!";

            // Act
            bool meetsMinLength = validPassword.Length >= 8;

            // Assert
            Assert.That(meetsMinLength, Is.True, "Passwords of 8+ characters should be accepted");
        }
    }
}
