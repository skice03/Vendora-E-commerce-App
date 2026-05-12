namespace Vendora.Api.Models
{
    /// <summary>
    /// Data transfer object for submitting a product review (REQ-56, REQ-57).
    /// </summary>
    public class CreateReviewRequest
    {
        public int ProductId { get; set; }

        /// <summary>
        /// Star rating from 1 to 5 (REQ-56).
        /// </summary>
        public int Rating { get; set; }

        /// <summary>
        /// Optional text comment (REQ-57).
        /// </summary>
        public string? Comment { get; set; }
    }
}
