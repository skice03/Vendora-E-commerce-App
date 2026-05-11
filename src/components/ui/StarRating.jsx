import { useState } from 'react';
import './StarRating.css';

/// Star rating component — can be read-only (display) or interactive (for review forms).
/// rating: current rating value (1-5)
/// onRate: callback when user selects a rating (enables interactive mode)
/// size: 'sm', 'md', 'lg'
/// showCount: whether to display the numeric rating next to stars
export default function StarRating({
    rating = 0,
    onRate,
    size = 'md',
    showCount = false,
    totalReviews,
    className = '',
}) {
    const [hoverRating, setHoverRating] = useState(0);

    const isInteractive = typeof onRate === 'function';
    const displayRating = hoverRating || rating;

    const containerClasses = [
        'vendora-star-rating',
        isInteractive ? 'vendora-star-rating--interactive' : '',
        size !== 'md' ? `vendora-star-rating--${size}` : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    function handleClick(starValue) {
        if (isInteractive) {
            onRate(starValue);
        }
    }

    function handleMouseEnter(starValue) {
        if (isInteractive) {
            setHoverRating(starValue);
        }
    }

    function handleMouseLeave() {
        if (isInteractive) {
            setHoverRating(0);
        }
    }

    // render 5 stars
    const stars = [];
    for (let starIndex = 1; starIndex <= 5; starIndex++) {
        let starClass = 'vendora-star';

        if (starIndex <= Math.floor(displayRating)) {
            starClass += ' vendora-star--filled';
        } else if (starIndex === Math.ceil(displayRating) && displayRating % 1 >= 0.5) {
            starClass += ' vendora-star--half';
        }

        stars.push(
            <span
                key={starIndex}
                className={starClass}
                onClick={() => handleClick(starIndex)}
                onMouseEnter={() => handleMouseEnter(starIndex)}
                onMouseLeave={handleMouseLeave}
                role={isInteractive ? 'button' : 'presentation'}
                aria-label={isInteractive ? `Rate ${starIndex} star${starIndex !== 1 ? 's' : ''}` : undefined}
            >
                ★
            </span>
        );
    }

    return (
        <div className={containerClasses}>
            {stars}
            {showCount && (
                <span className="vendora-star-rating__count">
                    {rating.toFixed(1)}
                    {totalReviews !== undefined && ` (${totalReviews})`}
                </span>
            )}
        </div>
    );
}
