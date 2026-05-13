namespace Vendora.Api.Models
{
    /// <summary>
    /// Represents a registered customer or administrator in the system.
    /// </summary>
    public class User
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Customer";

        /// <summary>
        /// Records when the user account was created (REQ-46).
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}