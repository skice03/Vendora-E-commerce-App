/* ========================================
   Vendora — Custom Hook: useFetch
   Generic data fetching with loading and error states
   ======================================== */

import { useState, useEffect } from 'react';
import { apiGet } from '../utils/api.js';

/// Custom hook for fetching data from an API endpoint.
/// Returns { data, isLoading, error, refetch } for the given endpoint.
export default function useFetch(endpoint, options = {}) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { enabled = true, initialData = null } = options;

    async function fetchData() {
        if (!endpoint || !enabled) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await apiGet(endpoint);
            setData(result);
        } catch (fetchError) {
            setError(fetchError.message || 'An unexpected error occurred.');
            setData(initialData);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [endpoint, enabled]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchData,
    };
}
