/* ========================================
   Vendora UI — ProductCard Component
   Reusable card for displaying a product
   ======================================== */

import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import StarRating from './StarRating.jsx';
import './ProductCard.css';

export default function ProductCard({ product }) {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { showSuccess, showError } = useToast();

    if (!product) return null;

    const isOutOfStock = product.stockQuantity === 0;
    const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
    const mainImage = product.images?.[0];

    function handleCardClick() {
        navigate(`/products/${product.id}`);
    }

    function handleAddToCart(e) {
        // stop click from also triggering handleCardClick
        e.stopPropagation();
        if (isOutOfStock) return;

        try {
            addToCart(product, 1);
            showSuccess(`"${product.name}" added to cart!`);
        } catch (err) {
            showError(err.message || 'Could not add to cart.');
        }
    }

    return (
        <div className="product-card" onClick={handleCardClick} role="article">
            {/* Image */}
            <div className="product-card__image-wrapper">
                {mainImage ? (
                    <img
                        src={mainImage}
                        alt={product.name}
                        className="product-card__image"
                        loading="lazy"
                    />
                ) : (
                    <div className="product-card__image-placeholder">🛍️</div>
                )}

                {/* Badges */}
                <div className="product-card__badges">
                    {isOutOfStock && (
                        <span className="product-card__badge product-card__badge--out-of-stock">
                            Out of Stock
                        </span>
                    )}
                    {isLowStock && (
                        <span className="product-card__badge product-card__badge--low-stock">
                            Only {product.stockQuantity} left
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="product-card__body">
                <p className="product-card__category">{product.categoryName}</p>
                <h3 className="product-card__name">{product.name}</h3>
                <div className="product-card__rating">
                    <StarRating rating={product.averageRating} size="sm" />
                    <span className="product-card__reviews">
                        ({product.averageRating?.toFixed(1)})
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="product-card__footer">
                <span className="product-card__price">
                    {formatCurrency(product.price)}
                </span>
                <button
                    className="product-card__add-btn"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    aria-label={`Add ${product.name} to cart`}
                >
                    {isOutOfStock ? 'Sold Out' : '+ Add to Cart'}
                </button>
            </div>
        </div>
    );
}
