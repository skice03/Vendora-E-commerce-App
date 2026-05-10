/* ========================================
   Vendora UI — Input Component
   Styled form input with label, icon, and validation
   ======================================== */

import './Input.css';

/// Reusable form input with label, icon, error, and helper text support.
export default function Input({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder = '',
    icon,
    error,
    helperText,
    required = false,
    disabled = false,
    className = '',
    ...rest
}) {
    const inputClasses = [
        'vendora-input',
        icon ? 'vendora-input--has-icon' : '',
        error ? 'vendora-input--error' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className="vendora-input-group">
            {label && (
                <label className="vendora-input-label" htmlFor={name}>
                    {label}
                    {required && <span style={{ color: 'var(--color-error)', marginLeft: '2px' }}>*</span>}
                </label>
            )}

            <div className="vendora-input-wrapper">
                {icon && <span className="vendora-input-icon">{icon}</span>}
                <input
                    id={name}
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className={inputClasses}
                    {...rest}
                />
            </div>

            {error && <span className="vendora-input-error-text">{error}</span>}
            {helperText && !error && <span className="vendora-input-helper">{helperText}</span>}
        </div>
    );
}
