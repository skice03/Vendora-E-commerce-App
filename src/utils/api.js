import { API_BASE_URL, STORAGE_KEYS } from './constants.js';

/// Retrieves the stored auth token from localStorage
function getAuthToken() {
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.token || null;
    }
    return null;
}

/// Centralized fetch wrapper that automatically includes auth headers and handles errors
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    // attach JWT token when available
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const response = await fetch(url, config);

    // handle common HTTP error responses (REQ — standardized HTTP codes)
    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;

        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.title || errorMessage;
        } catch {
            // response body was not JSON, use the status text
            const textError = await response.text().catch(() => '');
            if (textError) {
                errorMessage = textError;
            }
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
    }

    // handle 204 No Content (e.g., successful DELETE)
    if (response.status === 204) {
        return null;
    }

    return response.json();
}

/* ---- Convenience Methods ---- */

export function apiGet(endpoint) {
    return apiFetch(endpoint, { method: 'GET' });
}

export function apiPost(endpoint, body) {
    return apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export function apiPut(endpoint, body) {
    return apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

export function apiDelete(endpoint, body = null) {
    const options = { method: 'DELETE' };
    if (body) {
        options.body = JSON.stringify(body);
    }
    return apiFetch(endpoint, options);
}

/// Uploads a file via multipart/form-data (REQ-54: product image uploads)
export function apiUpload(endpoint, formData) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // Do NOT set Content-Type — browser sets it with boundary automatically
    return fetch(url, {
        method: 'POST',
        headers,
        body: formData,
    }).then(async (response) => {
        if (!response.ok) {
            let errorMessage = `Upload failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch {}
            throw new Error(errorMessage);
        }
        return response.json();
    });
}

export default apiFetch;
