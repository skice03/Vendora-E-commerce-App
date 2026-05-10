/* ========================================
   Vendora UI — Card Component
   Glassmorphism card with hover effects
   ======================================== */

import './Card.css';

/// Reusable card container with optional glass, bordered, or clickable variants.
export default function Card({
    children,
    variant = 'default',
    clickable = false,
    onClick,
    className = '',
    ...rest
}) {
    const classNames = [
        'vendora-card',
        variant !== 'default' ? `vendora-card--${variant}` : '',
        clickable ? 'vendora-card--clickable' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classNames} onClick={onClick} {...rest}>
            {children}
        </div>
    );
}

/// Card sub-components for structured content
export function CardHeader({ children, className = '' }) {
    return <div className={`vendora-card__header ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
    return <div className={`vendora-card__body ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
    return <div className={`vendora-card__footer ${className}`}>{children}</div>;
}
