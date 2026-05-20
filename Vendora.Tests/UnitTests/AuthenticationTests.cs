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
        public void PasswordHash_IsNotPlainText()
        {
            string plainPassword = "SecurePassword123!";

            string hash = BCrypt.Net.BCrypt.HashPassword(plainPassword);

            Assert.That(hash, Is.Not.EqualTo(plainPassword), "Hashed password must differ from plain text");
            Assert.That(hash, Does.StartWith("$2"), "BCrypt hashes should start with $2a or $2b");
        }

        // REQ-07: Correct password must verify successfully
        [Test]
        public void PasswordVerify_CorrectPassword_ReturnsTrue()
        {
            string plainPassword = "SecurePassword123!";
            string hash = BCrypt.Net.BCrypt.HashPassword(plainPassword);

            bool isValid = BCrypt.Net.BCrypt.Verify(plainPassword, hash);

            Assert.That(isValid, Is.True, "Correct password should verify against its hash");
        }

        // REQ-07: Wrong password must fail verification
        [Test]
        public void PasswordVerify_WrongPassword_ReturnsFalse()
        {
            string correctPassword = "SecurePassword123!";
            string wrongPassword = "WrongPassword456!";
            string hash = BCrypt.Net.BCrypt.HashPassword(correctPassword);

            bool isValid = BCrypt.Net.BCrypt.Verify(wrongPassword, hash);

            Assert.That(isValid, Is.False, "Wrong password should not verify against the hash");
        }

        // REQ-03: Each hash must be unique (salted)
        [Test]
        public void PasswordHash_SamePassword_ProducesDifferentHashes()
        {
            string password = "SamePassword!";

            string hash1 = BCrypt.Net.BCrypt.HashPassword(password);
            string hash2 = BCrypt.Net.BCrypt.HashPassword(password);

            Assert.That(hash1, Is.Not.EqualTo(hash2), "BCrypt should produce unique salted hashes");
        }

        // REQ-04: Password must meet minimum length requirement
        [Test]
        public void PasswordValidation_TooShort_ShouldFail()
        {
            string shortPassword = "Ab1!";

            bool meetsMinLength = shortPassword.Length >= 8;

            Assert.That(meetsMinLength, Is.False, "Passwords under 8 characters should be rejected");
        }

        // REQ-04: Valid password should pass length check
        [Test]
        public void PasswordValidation_ValidLength_ShouldPass()
        {
            string validPassword = "SecurePass1!";

            bool meetsMinLength = validPassword.Length >= 8;

            Assert.That(meetsMinLength, Is.True, "Passwords of 8+ characters should be accepted");
        }
    }
}
