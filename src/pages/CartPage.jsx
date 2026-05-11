/* ========================================
   Vendora — Shopping Cart Page
   Full cart experience with order summary
   ======================================== */

import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatCurrency } from '../utils/formatters.js';
import { FREE_SHIPPING_THRESHOLD } from '../utils/constants.js';
import './CartPage.css';

export default function CartPage() {
    const {
        cartItems,
        cartCount,
        subtotal,
        shippingCost,
        cartTotal,
        updateQuantity,
        removeFromCart,
        clearCart,
    } = useCart();
    const { showSuccess } = useToast();

    const shippingProgressPct = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
    const amountUntilFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
    const isFreeShipping = shippingCost === 0;

    function handleRemove(item) {
        removeFromCart(item.productId);
        showSuccess(`"${item.name}" removed from cart.`);
    }

    function handleClearCart() {
        clearCart();
        showSuccess('Cart cleared.');
    }

    // ---- Empty State ----
    if (cartItems.length === 0) {
        return (
            <div className="cart-page">
                <h1 className="cart-page__heading">Shopping Cart</h1>
                <div className="cart-empty">
                    <span className="cart-empty__icon">🛒</span>
                    <h2 className="cart-empty__title">Your cart is empty</h2>
                    <p className="cart-empty__subtitle">
                        Looks like you haven't added anything yet. Start exploring!
                    </p>
                    <Link to="/products" className="cart-empty__btn">
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <h1 className="cart-page__heading">
                Shopping Cart
                <span className="cart-page__count">({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
            </h1>

            <div className="cart-layout">
                {/* ---- Left: Cart Items ---- */}
                <div className="cart-items-panel">
                    <div className="cart-items-header">
                        <h2>Your Items</h2>
                        <button className="cart-clear-btn" onClick={handleClearCart}>
                            🗑 Clear cart
                        </button>
                    </div>

                    {cartItems.map(item => (
                        <div key={item.productId} className="cart-item">
                            {/* Product Image */}
                            <div className="cart-item__image-wrapper">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="cart-item__image"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="cart-item__image-placeholder">🛍️</div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="cart-item__details">
                                <Link
                                    to={`/products/${item.productId}`}
                                    className="cart-item__name"
                                >
                                    {item.name}
                                </Link>
                                <span className="cart-item__unit-price">
                                    {formatCurrency(item.price)} each
                                </span>

                                <div className="cart-item__controls">
                                    {/* Quantity Stepper */}
                                    <div className="cart-qty-stepper">
                                        <button
                                            className="cart-qty-stepper__btn"
                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                            aria-label="Decrease quantity"
                                        >
                                            −
                                        </button>
                                        <span className="cart-qty-stepper__value">
                                            {item.quantity}
                                        </span>
                                        <button
                                            className="cart-qty-stepper__btn"
                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                            disabled={item.quantity >= item.stockQuantity}
                                            aria-label="Increase quantity"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        className="cart-item__remove-btn"
                                        onClick={() => handleRemove(item)}
                                        aria-label={`Remove ${item.name} from cart`}
                                    >
                                        ✕ Remove
                                    </button>
                                </div>
                            </div>

                            {/* Line Total */}
                            <div className="cart-item__total">
                                <span className="cart-item__line-total">
                                    {formatCurrency(item.price * item.quantity)}
                                </span>
                            </div>
                        </div>
                    ))}

                    <Link to="/products" className="cart-continue-link">
                        ← Continue Shopping
                    </Link>
                </div>

                {/* ---- Right: Order Summary ---- */}
                <aside className="order-summary" aria-label="Order summary">
                    <h2 className="order-summary__title">Order Summary</h2>

                    {/* Free Shipping Progress Bar */}
                    <div className={`shipping-progress ${isFreeShipping ? 'shipping-progress--complete' : ''}`}>
                        <p className="shipping-progress__label">
                            {isFreeShipping ? (
                                <>🎉 <strong>You've unlocked free shipping!</strong></>
                            ) : (
                                <>Add <strong>{formatCurrency(amountUntilFreeShipping)}</strong> more for free shipping</>
                            )}
                        </p>
                        <div className="shipping-progress__bar-track">
                            <div
                                className="shipping-progress__bar-fill"
                                style={{ width: `${shippingProgressPct}%` }}
                                role="progressbar"
                                aria-valuenow={Math.round(shippingProgressPct)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="summary-line">
                        <span>Subtotal ({cartCount} items)</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>

                    <div className="summary-line">
                        <span>Shipping</span>
                        {isFreeShipping ? (
                            <span className="summary-line__free">FREE</span>
                        ) : (
                            <span>{formatCurrency(shippingCost)}</span>
                        )}
                    </div>

                    <div className="summary-line summary-line--total">
                        <span>Total</span>
                        <span>{formatCurrency(cartTotal)}</span>
                    </div>

                    {/* Checkout Button */}
                    <Link to="/checkout" className="checkout-btn">
                        Proceed to Checkout →
                    </Link>

                    <p className="summary-secure-note">
                        🔒 Secure checkout — your data is safe
                    </p>
                </aside>
            </div>
        </div>
    );
}
