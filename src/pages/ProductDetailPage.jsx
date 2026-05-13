import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import StarRating from '../components/ui/StarRating.jsx';
import ProductCard from '../components/ui/ProductCard.jsx';
import Button from '../components/ui/Button.jsx';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const { showSuccess, showError } = useToast();

    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // Review form state
    const [canReview, setCanReview] = useState(false);
    const [reviewReason, setReviewReason] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                setIsLoading(true);
                // Fetch product and reviews concurrently
                const fetches = [
                    apiGet(`/products/${id}`),
                    apiGet(`/reviews/product/${id}`)
                ];

                // Check review eligibility if authenticated
                if (isAuthenticated) {
                    fetches.push(apiGet(`/reviews/can-review/${id}`));
                }

                const results = await Promise.all(fetches);
                setProduct(results[0]);
                setReviews(results[1]);

                if (results[2]) {
                    setCanReview(results[2].canReview);
                    setReviewReason(results[2].reason || '');
                }

                // REQ-55: Increment view count (fire-and-forget)
                apiPost(`/products/${id}/view`).catch(() => {});

                // REQ-53: Fetch related products (same category)
                if (results[0] && results[0].categoryId) {
                    try {
                        const allProducts = await apiGet('/products');
                        const related = allProducts
                            .filter(product => product.categoryId === results[0].categoryId && product.id !== results[0].id)
                            .slice(0, 4);
                        setRelatedProducts(related);
                    } catch (relatedErr) {
                        // Non-critical — silently fail
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProductData();
    }, [id, isAuthenticated]);

    if (isLoading) {
        return <div style={{ textAlign: 'center', padding: '4rem 0' }}>Loading product details...</div>;
    }

    if (error || !product) {
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

    // Calculate average rating from reviews (or use backend value)
    const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
    // Restricts checkout when stock is 0 (REQ-14, REQ-19)
    const isOutOfStock = product.stockQuantity === 0;
    const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

    function handleAddToCart() {
        // REQ-21: Redirect unauthenticated guests to login
        if (!isAuthenticated) {
            showError('Please log in to add items to your cart.');
            navigate('/login');
            return;
        }

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

    async function handleSubmitReview() {
        setIsSubmittingReview(true);
        try {
            await apiPost('/reviews', {
                productId: parseInt(id),
                rating: reviewRating,
                comment: reviewComment,
            });

            showSuccess('Review submitted successfully!');

            // Refresh reviews list
            const updatedReviews = await apiGet(`/reviews/product/${id}`);
            setReviews(updatedReviews);

            // Reset form and mark as already reviewed
            setReviewComment('');
            setReviewRating(5);
            setCanReview(false);
            setReviewReason('You have already reviewed this product.');
        } catch (err) {
            showError(err.message || 'Failed to submit review.');
        } finally {
            setIsSubmittingReview(false);
        }
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
                        {product.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                            />
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
                                🛍️
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Panel */}
                <div className="product-info">
                    <p className="product-info__category">{product.categoryName}</p>
                    <h1 className="product-info__title">{product.name}</h1>

                    <div className="product-info__meta">
                        <StarRating rating={averageRating} showCount size="md" totalReviews={reviews.length} />
                        {getStockBadge()}
                    </div>

                    {product.viewCount > 0 && (
                        <p className="product-info__views">👁 {product.viewCount} views</p>
                    )}

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
                    Customer Reviews ({reviews.length})
                </h2>

                {/* Renders list of reviews for the product (REQ-56, REQ-57) */}
                {reviews.length > 0 ? (
                    <div className="review-list">
                        {reviews.map(review => (
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

                {/* ---- Write a Review (REQ-56, REQ-57, REQ-58) ---- */}
                {isAuthenticated && (
                    <div className="review-form-section">
                        <h3 className="review-form-section__title">Write a Review</h3>

                        {canReview ? (
                            <div className="review-form">
                                <div className="review-form__rating">
                                    <label>Your Rating</label>
                                    <div className="review-form__stars">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`review-form__star ${star <= reviewRating ? 'active' : ''}`}
                                                onClick={() => setReviewRating(star)}
                                                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="review-form__comment">
                                    <label htmlFor="reviewComment">Your Review (optional)</label>
                                    <textarea
                                        id="reviewComment"
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder="Share your experience with this product..."
                                        rows={4}
                                        maxLength={1000}
                                    />
                                </div>

                                <Button
                                    variant="primary"
                                    onClick={handleSubmitReview}
                                    disabled={isSubmittingReview}
                                >
                                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                                </Button>
                            </div>
                        ) : (
                            <p className="review-form__ineligible">
                                {reviewReason || 'You cannot review this product at this time.'}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* REQ-53: Related Products section */}
            {relatedProducts.length > 0 && (
                <div className="related-products-section">
                    <h2 className="related-products-section__title">
                        Related Products
                    </h2>
                    <div className="product-grid">
                        {relatedProducts.map(relatedProduct => (
                            <ProductCard key={relatedProduct.id} product={relatedProduct} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
