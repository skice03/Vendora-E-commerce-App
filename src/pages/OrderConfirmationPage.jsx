import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import './OrderConfirmationPage.css';

export default function OrderConfirmationPage() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Retrieve the orderId passed via state from CheckoutPage
    const orderId = location.state?.orderId || 'Processing...';

    return (
        <div className="confirmation-page">
            <div className="confirmation-card">
                <div className="confirmation-icon">
                    ✓
                </div>
                
                <h1 className="confirmation-title">Order Confirmed!</h1>
                <p className="confirmation-subtitle">
                    Thank you for your purchase. We've received your order and are getting it ready to ship.
                </p>

                <div className="confirmation-order-id">
                    <span>Your Order ID</span>
                    <strong>#{orderId}</strong>
                </div>

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
