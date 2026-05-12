using System;

namespace Vendora.Api.Models
{
    /// <summary>
    /// Represents an audit trail of critical administrative actions.
    /// REQ-78: Track critical administrative actions.
    /// REQ-79: Capture Admin ID, Action Type, Target Table, and Timestamp.
    /// </summary>
    public class AuditLog
    {
        public int Id { get; set; }

        public int AdminId { get; set; }
        public User? Admin { get; set; }

        public string ActionType { get; set; } = string.Empty; // e.g., "DELETE", "UPDATE_STATUS"
        public string TargetTable { get; set; } = string.Empty; // e.g., "Products", "Orders"
        public string TargetId { get; set; } = string.Empty; // ID of the affected record
        
        public string Details { get; set; } = string.Empty; // JSON or text details

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
