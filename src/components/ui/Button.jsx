import './Button.css';

/// Reusable button component with variant, size, loading, and fullWidth options.
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    type = 'button',
    fullWidth = false,
    isLoading = false,
    disabled = false,
    onClick,
    className = '',
    ...rest
}) {
    const classNames = [
        'vendora-btn',
        `vendora-btn--${variant}`,
        size !== 'md' ? `vendora-btn--${size}` : '',
        fullWidth ? 'vendora-btn--full' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            type={type}
            className={classNames}
            disabled={disabled || isLoading}
            onClick={onClick}
            {...rest}
        >
            {isLoading && <span className="vendora-btn__spinner" />}
            {children}
        </button>
    );
}
