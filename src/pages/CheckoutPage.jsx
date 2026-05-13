import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiGet, apiPost } from '../utils/api.js';
import { formatCurrency } from '../utils/formatters.js';
import { FREE_SHIPPING_THRESHOLD } from '../utils/constants.js';
import Button from '../components/ui/Button.jsx';
import './CheckoutPage.css';

export default function CheckoutPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { cartItems, subtotal, shippingCost, cartTotal, clearCart } = useCart();
    const { isAuthenticated } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('new');
    const [shippingForm, setShippingForm] = useState({
        fullName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
    });

    // Check if returning from cancelled Stripe checkout
    useEffect(() => {
        if (searchParams.get('cancelled') === 'true') {
            showWarning('Payment was cancelled. You can try again when ready.');
        }
    }, [searchParams]);

    // Fetch saved addresses on mount
    useEffect(() => {
        async function fetchAddresses() {
            try {
                const addresses = await apiGet('/profile/addresses');
                setSavedAddresses(addresses);
                // Auto-select the default address if one exists
                const defaultAddr = addresses.find(a => a.isDefault);
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr.id.toString());
                    fillFromSavedAddress(defaultAddr);
                }
            } catch {
                // Silently fail — user can still enter manually
            }
        }
        if (isAuthenticated) {
            fetchAddresses();
        }
    }, [isAuthenticated]);

    // Redirect guests away
    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    // Redirect if cart is empty
    if (cartItems.length === 0) {
        return (
            <div className="checkout-page">
                <div className="checkout-empty">
                    <span className="checkout-empty__icon">🛒</span>
                    <h2>Your cart is empty</h2>
                    <p>Add some products before checking out.</p>
                    <Link to="/products" className="checkout-empty__btn">Browse Products</Link>
                </div>
            </div>
        );
    }

    const isFreeShipping = shippingCost === 0;

    function fillFromSavedAddress(addr) {
        setShippingForm({
            fullName: '',
            addressLine1: addr.street || '',
            addressLine2: '',
            city: addr.city || '',
            state: '',
            zipCode: addr.zipCode || '',
            country: addr.country || '',
        });
    }

    function handleAddressSelection(e) {
        const value = e.target.value;
        setSelectedAddressId(value);

        if (value === 'new') {
            setShippingForm({
                fullName: '',
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
            });
        } else {
            const addr = savedAddresses.find(a => a.id === parseInt(value));
            if (addr) {
                fillFromSavedAddress(addr);
            }
        }
    }

    function handleInputChange(event) {
        const { name, value } = event.target;
        setShippingForm(prev => ({ ...prev, [name]: value }));
    }

    function buildShippingAddress() {
        const parts = [
            shippingForm.fullName,
            shippingForm.addressLine1,
            shippingForm.addressLine2,
            `${shippingForm.city}, ${shippingForm.state} ${shippingForm.zipCode}`,
            shippingForm.country,
        ].filter(Boolean);
        return parts.join(', ');
    }

    function isFormValid() {
        return (
            shippingForm.fullName.trim() &&
            shippingForm.addressLine1.trim() &&
            shippingForm.city.trim() &&
            shippingForm.zipCode.trim() &&
            shippingForm.country.trim()
        );
    }

    async function handleStripeCheckout() {
        if (!isFormValid()) {
            showError('Please fill in all required shipping fields.');
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                shippingAddress: buildShippingAddress(),
                items: cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),
            };

            const response = await apiPost('/payment/create-checkout-session', payload);

            if (response.sessionUrl) {
                // Clear cart before redirecting to Stripe
                clearCart();
                // Redirect to Stripe Checkout hosted page
                window.location.href = response.sessionUrl;
            } else {
                showError('Failed to create payment session. Please try again.');
                setIsSubmitting(false);
            }
        } catch (err) {
            showError(err.message || 'Failed to initiate payment. Please try again.');
            setIsSubmitting(false);
        }
    }

    return (
        <div className="checkout-page">
            <h1 className="checkout-page__heading">Checkout</h1>

            <div className="checkout-layout">
                {/* ---- Left: Shipping Form ---- */}
                <div className="checkout-shipping">
                    <h2 className="checkout-section-title">📦 Shipping Address</h2>

                    {/* Saved Address Selector */}
                    {savedAddresses.length > 0 && (
                        <div className="checkout-saved-addresses">
                            <label htmlFor="savedAddress" className="checkout-saved-addresses__label">
                                Use a saved address
                            </label>
                            <select
                                id="savedAddress"
                                className="checkout-saved-addresses__select"
                                value={selectedAddressId}
                                onChange={handleAddressSelection}
                            >
                                <option value="new">— Enter a new address —</option>
                                {savedAddresses.map(addr => (
                                    <option key={addr.id} value={addr.id}>
                                        {addr.street}, {addr.city}, {addr.zipCode}, {addr.country}
                                        {addr.isDefault ? ' ★ Default' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="checkout-form">
                        <div className="checkout-form__group">
                            <label htmlFor="fullName">Full Name *</label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                value={shippingForm.fullName}
                                onChange={handleInputChange}
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div className="checkout-form__group">
                            <label htmlFor="addressLine1">Address Line 1 *</label>
                            <input
                                id="addressLine1"
                                name="addressLine1"
                                type="text"
                                value={shippingForm.addressLine1}
                                onChange={handleInputChange}
                                placeholder="123 Main Street"
                                required
                            />
                        </div>

                        <div className="checkout-form__group">
                            <label htmlFor="addressLine2">Address Line 2</label>
                            <input
                                id="addressLine2"
                                name="addressLine2"
                                type="text"
                                value={shippingForm.addressLine2}
                                onChange={handleInputChange}
                                placeholder="Apt 4B (optional)"
                            />
                        </div>

                        <div className="checkout-form__row">
                            <div className="checkout-form__group">
                                <label htmlFor="city">City *</label>
                                <input
                                    id="city"
                                    name="city"
                                    type="text"
                                    value={shippingForm.city}
                                    onChange={handleInputChange}
                                    placeholder="New York"
                                    required
                                />
                            </div>
                            <div className="checkout-form__group">
                                <label htmlFor="state">State / Province</label>
                                <input
                                    id="state"
                                    name="state"
                                    type="text"
                                    value={shippingForm.state}
                                    onChange={handleInputChange}
                                    placeholder="NY"
                                />
                            </div>
                        </div>

                        <div className="checkout-form__row">
                            <div className="checkout-form__group">
                                <label htmlFor="zipCode">Zip / Postal Code *</label>
                                <input
                                    id="zipCode"
                                    name="zipCode"
                                    type="text"
                                    value={shippingForm.zipCode}
                                    onChange={handleInputChange}
                                    placeholder="10001"
                                    required
                                />
                            </div>
                            <div className="checkout-form__group">
                                <label htmlFor="country">Country *</label>
                                <input
                                    id="country"
                                    name="country"
                                    type="text"
                                    value={shippingForm.country}
                                    onChange={handleInputChange}
                                    placeholder="United States"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ---- Right: Order Summary ---- */}
                <aside className="checkout-summary" aria-label="Order summary">
                    <h2 className="checkout-section-title">🧾 Order Summary</h2>

                    <div className="checkout-items">
                        {cartItems.map(item => (
                            <div key={item.productId} className="checkout-item">
                                <div className="checkout-item__image">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} />
                                    ) : (
                                        <div className="checkout-item__placeholder">🛍️</div>
                                    )}
                                </div>
                                <div className="checkout-item__details">
                                    <span className="checkout-item__name">{item.name}</span>
                                    <span className="checkout-item__qty">Qty: {item.quantity}</span>
                                </div>
                                <span className="checkout-item__price">
                                    {formatCurrency(item.price * item.quantity)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="checkout-totals">
                        <div className="checkout-totals__line">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="checkout-totals__line">
                            <span>Shipping</span>
                            {isFreeShipping ? (
                                <span className="checkout-totals__free">FREE</span>
                            ) : (
                                <span>{formatCurrency(shippingCost)}</span>
                            )}
                        </div>
                        <div className="checkout-totals__line checkout-totals__line--total">
                            <span>Total</span>
                            <span>{formatCurrency(cartTotal)}</span>
                        </div>
                    </div>

                    <button
                        className="stripe-checkout-btn"
                        onClick={handleStripeCheckout}
                        disabled={isSubmitting || !isFormValid()}
                    >
                        {isSubmitting ? (
                            <span className="stripe-checkout-btn__loading">Processing...</span>
                        ) : (
                            <>
                                <svg className="stripe-checkout-btn__lock" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                Pay {formatCurrency(cartTotal)} with Stripe
                            </>
                        )}
                    </button>

                    <div className="checkout-secure-note">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: 'middle', marginRight: '4px'}}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Secure payment powered by <strong>Stripe</strong>. Your card details are never stored on our servers.
                    </div>

                    <div className="stripe-test-info">
                        <strong>Test Mode</strong> — Use card <code>4242 4242 4242 4242</code> with any future expiry and CVC.
                    </div>
                </aside>
            </div>
        </div>
    );
}
