namespace Vendora.Api.Models
{
    /// <summary>
    /// Object used to transfer login credentials from the frontend (REQ-06).
    /// </summary>
    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
