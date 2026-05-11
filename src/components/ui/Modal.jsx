import { useEffect } from 'react';
import './Modal.css';

/// Accessible modal dialog with backdrop, close button, and keyboard support.
export default function Modal({
    isOpen,
    onClose,
    title,
    size = 'md',
    children,
    footer,
}) {
    // close on Escape key
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    // close when clicking the backdrop (not the modal itself)
    function handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    const sizeClass = size !== 'md' ? `vendora-modal--${size}` : '';

    return (
        <div
            className="vendora-modal-backdrop"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className={`vendora-modal ${sizeClass}`}>
                <div className="vendora-modal__header">
                    <h3 className="vendora-modal__title" id="modal-title">
                        {title}
                    </h3>
                    <button
                        className="vendora-modal__close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="vendora-modal__body">
                    {children}
                </div>

                {footer && (
                    <div className="vendora-modal__footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
