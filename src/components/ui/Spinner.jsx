/* ========================================
   Vendora UI — Spinner & Skeleton Components
   Loading indicators
   ======================================== */

import './Spinner.css';

/// Animated loading spinner with optional text.
export default function Spinner({ size = 'md', text = '' }) {
    const sizeClass = size !== 'md' ? `vendora-spinner--${size}` : '';

    return (
        <div className="vendora-spinner-wrapper">
            <div className={`vendora-spinner ${sizeClass}`} />
            {text && <span className="vendora-spinner-text">{text}</span>}
        </div>
    );
}

/// Skeleton placeholder for loading states.
/// Shape can be: text, title, avatar, image, card, button
export function Skeleton({ shape = 'text', width, height, className = '' }) {
    const shapeClass = `vendora-skeleton--${shape}`;
    const style = {};

    if (width) {
        style.width = width;
    }
    if (height) {
        style.height = height;
    }

    return (
        <div
            className={`vendora-skeleton ${shapeClass} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
}
