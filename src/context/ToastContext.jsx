/* ========================================
   Vendora — Toast Context
   App-wide notification system
   ======================================== */

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;
const AUTO_DISMISS_DURATION = 4000;

/// Provides toast notification actions to all child components.
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    /// Add a new toast notification
    const addToast = useCallback((message, type = 'info') => {
        const id = ++toastIdCounter;

        setToasts(currentToasts => [
            ...currentToasts,
            { id, message, type },
        ]);

        // auto-dismiss after duration
        setTimeout(() => {
            removeToast(id);
        }, AUTO_DISMISS_DURATION);

        return id;
    }, []);

    /// Remove a specific toast by id
    const removeToast = useCallback((id) => {
        setToasts(currentToasts =>
            currentToasts.filter(toast => toast.id !== id)
        );
    }, []);

    // ---- Convenience methods ----
    const showSuccess = useCallback((message) => addToast(message, 'success'), [addToast]);
    const showError = useCallback((message) => addToast(message, 'error'), [addToast]);
    const showWarning = useCallback((message) => addToast(message, 'warning'), [addToast]);
    const showInfo = useCallback((message) => addToast(message, 'info'), [addToast]);

    const contextValue = {
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
        </ToastContext.Provider>
    );
}

/// Hook to access toast notifications from any component
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export default ToastContext;
