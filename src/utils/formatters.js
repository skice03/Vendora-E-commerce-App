import { CURRENCY_SYMBOL, CURRENCY_DECIMAL_PLACES, API_BASE_URL } from './constants.js';

/// Resolves a product image URL — converts relative paths to absolute backend URLs.
/// Returns null if the URL is empty/null (caller should show placeholder).
export function resolveImageUrl(url) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL.replace('/api', '')}${url}`;
}

/// Formats a decimal number as a currency string (e.g., $29.99)
export function formatCurrency(amount) {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
        return `${CURRENCY_SYMBOL}0.00`;
    }
    return `${CURRENCY_SYMBOL}${numericAmount.toFixed(CURRENCY_DECIMAL_PLACES)}`;
}

/// Formats a Date object or ISO string into a readable date (e.g., "May 10, 2026")
export function formatDate(dateValue) {
    if (!dateValue) {
        return '';
    }
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/// Formats a Date object or ISO string with time (e.g., "May 10, 2026 at 2:30 PM")
export function formatDateTime(dateValue) {
    if (!dateValue) {
        return '';
    }
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/// Returns a relative time string (e.g., "2 hours ago", "3 days ago")
export function formatRelativeTime(dateValue) {
    if (!dateValue) {
        return '';
    }
    const date = new Date(dateValue);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }

    return formatDate(dateValue);
}

/// Maps order status strings to CSS class-friendly slugs and display colors
export function getStatusBadgeClass(status) {
    const statusMap = {
        'Pending': 'status-pending',
        'Processing': 'status-processing',
        'Shipped': 'status-shipped',
        'Delivered': 'status-delivered',
        'Cancelled': 'status-cancelled',
    };
    return statusMap[status] || 'status-pending';
}

/// Truncates text to a given length and adds an ellipsis
export function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text || '';
    }
    return text.substring(0, maxLength).trim() + '...';
}

/// Capitalizes the first letter of each word
export function capitalizeWords(text) {
    if (!text) {
        return '';
    }
    return text
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
