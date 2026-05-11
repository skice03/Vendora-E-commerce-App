import { useToast } from '../../context/ToastContext.jsx';
import './Toast.css';

// icon mapping for each toast type
const TOAST_ICONS = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};

/// Renders all active toast notifications from the ToastContext.
/// Place this component once in the app root (inside ToastProvider).
export default function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="vendora-toast-container" aria-live="polite">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`vendora-toast vendora-toast--${toast.type}`}
                    role="alert"
                >
                    <span className="vendora-toast__icon">
                        {TOAST_ICONS[toast.type]}
                    </span>
                    <span className="vendora-toast__message">
                        {toast.message}
                    </span>
                    <button
                        className="vendora-toast__close"
                        onClick={() => removeToast(toast.id)}
                        aria-label="Dismiss notification"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
