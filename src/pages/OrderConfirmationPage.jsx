import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { apiPost } from '../utils/api.js';
import { formatCurrency } from '../utils/formatters.js';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import './OrderConfirmationPage.css';

export default function OrderConfirmationPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [error, setError] = useState(null);
    
    // Retrieve the orderId passed via state from legacy flow
    const legacyOrderId = location.state?.orderId;
    // Or via Stripe session_id from URL
    const stripeSessionId = searchParams.get('session_id');

    useEffect(() => {
        if (stripeSessionId) {
            verifyStripePayment(stripeSessionId);
        } else if (legacyOrderId) {
            setVerified(true);
            setOrderData({ orderId: legacyOrderId });
        }
    }, [stripeSessionId, legacyOrderId]);

    async function verifyStripePayment(sessionId) {
        setVerifying(true);
        try {
            const result = await apiPost('/payment/verify-session', { sessionId });
            if (result.success) {
                setVerified(true);
                setOrderData({
                    orderId: result.orderId,
                    totalAmount: result.totalAmount,
                    status: result.status,
                    paymentStatus: result.paymentStatus,
                });
            } else {
                setError(result.message || 'Payment could not be verified.');
            }
        } catch (err) {
            setError(err.message || 'Failed to verify payment.');
        } finally {
            setVerifying(false);
        }
    }

    if (verifying) {
        return (
            <div className="confirmation-page">
                <div className="confirmation-card">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <Spinner />
                        <p style={{ marginTop: '1rem', color: 'var(--color-gray-600)' }}>Verifying your payment...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="confirmation-page">
                <div className="confirmation-card">
                    <div className="confirmation-icon confirmation-icon--error">
                        ✕
                    </div>
                    <h1 className="confirmation-title">Payment Issue</h1>
                    <p className="confirmation-subtitle">{error}</p>
                    <div className="confirmation-actions">
                        <Button 
                            variant="primary" 
                            fullWidth 
                            onClick={() => navigate('/checkout')}
                        >
                            Try Again
                        </Button>
                        <Button 
                            variant="outline" 
                            fullWidth 
                            onClick={() => navigate('/orders')}
                        >
                            View Order History
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!verified && !legacyOrderId && !stripeSessionId) {
        navigate('/products');
        return null;
    }

    const orderId = orderData?.orderId || 'Processing...';

    return (
        <div className="confirmation-page">
            <div className="confirmation-card">
                <div className="confirmation-icon">
                    ✓
                </div>
                
                <h1 className="confirmation-title">Order Confirmed!</h1>
                <p className="confirmation-subtitle">
                    Thank you for your purchase. Your payment has been processed successfully and your order is being prepared.
                </p>

                <div className="confirmation-order-id">
                    <span>Your Order ID</span>
                    <strong>#{orderId}</strong>
                </div>

                {orderData?.totalAmount && (
                    <div className="confirmation-amount">
                        <span>Amount Paid</span>
                        <strong>{formatCurrency(orderData.totalAmount)}</strong>
                    </div>
                )}

                {orderData?.paymentStatus && (
                    <div className="confirmation-badge">
                        <span className="badge badge-success">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign:'middle', marginRight:'4px'}}>
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                            Payment {orderData.paymentStatus}
                        </span>
                    </div>
                )}

                <div className="confirmation-actions">
                    <Button 
                        variant="primary" 
                        fullWidth 
                        onClick={() => navigate('/products')}
                    >
                        Continue Shopping
                    </Button>
                    <Button 
                        variant="outline" 
                        fullWidth 
                        onClick={() => navigate('/orders')}
                    >
                        View Order History
                    </Button>
                </div>
            </div>
        </div>
    );
}
