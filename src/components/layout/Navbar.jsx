import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import Button from '../ui/Button.jsx';
import './Navbar.css';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="vendora-navbar">
            <div className="container vendora-navbar__container">
                {/* Brand */}
                <Link to="/" className="vendora-navbar__brand">
                    <span className="vendora-navbar__brand-icon">🛍️</span>
                    Vendora
                </Link>

                {/* Desktop Navigation */}
                <nav className="vendora-navbar__nav">
                    <NavLink to="/products" className="vendora-navbar__link">
                        Catalog
                    </NavLink>
                    {/* Add more links here if needed */}
                </nav>

                {/* Actions & User Menu */}
                <div className="vendora-navbar__actions">
                    
                    {/* Cart Icon */}
                    <Link to="/cart" className="vendora-navbar__icon-btn" aria-label="Shopping Cart">
                        🛒
                        {cartCount > 0 && (
                            <span className="vendora-navbar__badge animate-bounce">
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        )}
                    </Link>

                    <div className="vendora-navbar__user">
                        {isAuthenticated ? (
                            <>
                                <span className="vendora-navbar__greeting">
                                    Hi, {user.firstName}!
                                </span>
                                
                                {/* Wishlist Icon */}
                                <Link to="/wishlist" className="vendora-navbar__icon-btn" aria-label="Wishlist">
                                    ❤️
                                </Link>

                                {/* Profile Link */}
                                <Link to="/profile" className="vendora-navbar__icon-btn" aria-label="Profile">
                                    👤
                                </Link>

                                <Button variant="outline" size="sm" onClick={handleLogout}>
                                    Log Out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                                    Log In
                                </Button>
                                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                                    Register
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
