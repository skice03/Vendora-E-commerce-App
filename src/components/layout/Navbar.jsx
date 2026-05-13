import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import Button from '../ui/Button.jsx';
import './Navbar.css';

export default function Navbar() {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
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
                        📦 Catalog
                    </NavLink>
                </nav>

                {/* Actions & User Menu */}
                <div className="vendora-navbar__actions">
                    
                    {/* Cart Icon (REQ-22) */}
                    <Link to="/cart" className="vendora-navbar__icon-btn" aria-label="Shopping Cart">
                        🛒
                        {cartCount > 0 && (
                            <span className="vendora-navbar__badge animate-bounce">
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        )}
                        <span className="vendora-navbar__icon-label">Cart</span>
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
                                    <span className="vendora-navbar__icon-label">Wishlist</span>
                                </Link>

                                {/* My Orders Icon */}
                                <Link to="/orders" className="vendora-navbar__icon-btn" aria-label="My Orders">
                                    📋
                                    <span className="vendora-navbar__icon-label">Orders</span>
                                </Link>

                                {/* Admin Links */}
                                {isAdmin && (
                                    <>
                                        <div className="vendora-navbar__divider" />
                                        <Link to="/admin" className="vendora-navbar__icon-btn vendora-navbar__admin-link" aria-label="Admin Dashboard">
                                            📊
                                            <span className="vendora-navbar__icon-label">Dashboard</span>
                                        </Link>
                                        <Link to="/admin/products" className="vendora-navbar__icon-btn vendora-navbar__admin-link" aria-label="Admin Products">
                                            📦
                                            <span className="vendora-navbar__icon-label">Products</span>
                                        </Link>
                                        <Link to="/admin/orders" className="vendora-navbar__icon-btn vendora-navbar__admin-link" aria-label="Admin Orders">
                                            📝
                                            <span className="vendora-navbar__icon-label">Manage</span>
                                        </Link>
                                        <Link to="/admin/reviews" className="vendora-navbar__icon-btn vendora-navbar__admin-link" aria-label="Admin Reviews">
                                            ⭐
                                            <span className="vendora-navbar__icon-label">Reviews</span>
                                        </Link>
                                    </>
                                )}

                                {/* Profile Link */}
                                <Link to="/profile" className="vendora-navbar__icon-btn" aria-label="Profile">
                                    👤
                                    <span className="vendora-navbar__icon-label">Profile</span>
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
