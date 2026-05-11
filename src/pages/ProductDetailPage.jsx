import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mockProducts, mockReviews } from '../data/mockData.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import StarRating from '../components/ui/StarRating.jsx';
import Button from '../components/ui/Button.jsx';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { showSuccess, showError } = useToast();

    const product = mockProducts.find(product => product.id === Number(id));
    const [activeImage, setActiveImage] = useState(0);
    const [quantity, setQuantity] = useState(1);

    if (!product) {
        return (
            <div className="product-not-found container">
                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🔍</div>
                <h2>Product Not Found</h2>
                <p>We couldn't find the product you're looking for.</p>
                <Button
                    variant="primary"
                    onClick={() => navigate('/products')}
                    style={{ marginTop: 'var(--space-5)' }}
                >
                    Browse All Products
                </Button>
            </div>
        );
    }

    const productReviews = mockReviews.filter(review => review.productId === product.id);
    
    // Restricts checkout when stock is 0 (REQ-14, REQ-19)
    const isOutOfStock = product.stockQuantity === 0;
    const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

    function handleAddToCart() {
        try {
            addToCart(product, quantity);
            showSuccess(`${quantity}× "${product.name}" added to cart!`);
        } catch (err) {
            showError(err.message || 'Could not add item to cart.');
        }
    }

    function getStockBadge() {
        if (isOutOfStock) return <span className="product-info__stock product-info__stock--out">● Out of Stock</span>;
        if (isLowStock) return <span className="product-info__stock product-info__stock--low">● Only {product.stockQuantity} left</span>;
        return <span className="product-info__stock product-info__stock--in">● In Stock</span>;
    }

    return (
        <div className="product-detail">
            {/* Breadcrumb */}
            <nav className="breadcrumb" aria-label="Breadcrumb">
                <Link to="/">Home</Link>
                <span className="breadcrumb__separator">›</span>
                <Link to="/products">Products</Link>
                <span className="breadcrumb__separator">›</span>
                <span>{product.categoryName}</span>
                <span className="breadcrumb__separator">›</span>
                <span style={{ color: 'var(--color-gray-700)', fontWeight: 'var(--font-weight-medium)' }}>
                    {product.name}
                </span>
            </nav>

            {/* Main Grid: Gallery + Info */}
            <div className="product-detail__grid">
                {/* Gallery */}
                <div className="product-gallery">
                    <div className="product-gallery__main">
                        {product.images?.[activeImage] ? (
                            <img
                                src={product.images[activeImage]}
                                alt={product.name}
                                key={activeImage}
                            />
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
                                🛍️
                            </div>
                        )}
                    </div>

                    {product.images?.length > 1 && (
                        <div className="product-gallery__thumbnails">
                            {product.images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`product-gallery__thumb ${idx === activeImage ? 'product-gallery__thumb--active' : ''}`}
                                    onClick={() => setActiveImage(idx)}
                                    role="button"
                                    aria-label={`View image ${idx + 1}`}
                                >
                                    <img src={img} alt={`${product.name} view ${idx + 1}`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Panel */}
                <div className="product-info">
                    <p className="product-info__category">{product.categoryName}</p>
                    <h1 className="product-info__title">{product.name}</h1>

                    <div className="product-info__meta">
                        <StarRating rating={product.averageRating} showCount size="md" totalReviews={productReviews.length} />
                        {getStockBadge()}
                    </div>

                    <p className="product-info__sku">SKU: {product.sku}</p>

                    <div className="product-info__price">
                        {formatCurrency(product.price)}
                    </div>

                    <p className="product-info__description">{product.description}</p>

                    <div className="add-to-cart">
                        <div className="quantity-selector">
                            <button
                                className="quantity-selector__btn"
                                onClick={() => setQuantity(currentQuantity => Math.max(1, currentQuantity - 1))}
                                disabled={quantity <= 1 || isOutOfStock}
                                aria-label="Decrease quantity"
                            >
                                −
                            </button>
                            <span className="quantity-selector__value">{quantity}</span>
                            <button
                                className="quantity-selector__btn"
                                onClick={() => setQuantity(currentQuantity => Math.min(product.stockQuantity, currentQuantity + 1))}
                                disabled={quantity >= product.stockQuantity || isOutOfStock}
                                aria-label="Increase quantity"
                            >
                                +
                            </button>
                        </div>

                        <button
                            className="add-to-cart__btn"
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                        >
                            {isOutOfStock ? 'Out of Stock' : '🛒 Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="reviews-section">
                <h2 className="reviews-section__title">
                    Customer Reviews ({productReviews.length})
                </h2>

                {/* Renders list of reviews for the product (REQ-56, REQ-57) */}
                {productReviews.length > 0 ? (
                    <div className="review-list">
                        {productReviews.map(review => (
                            <div key={review.id} className="review-card">
                                <div className="review-card__header">
                                    <div>
                                        <div className="review-card__author">{review.userName}</div>
                                        <div className="review-card__date">{formatDate(review.createdAt)}</div>
                                    </div>
                                    <StarRating rating={review.rating} size="sm" />
                                </div>
                                <p className="review-card__comment">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="reviews-empty">No reviews yet. Be the first to review this product!</p>
                )}
            </div>
        </div>
    );
}
