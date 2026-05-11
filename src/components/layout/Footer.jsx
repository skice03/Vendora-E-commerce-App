import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="vendora-footer">
            <div className="container">
                <div className="vendora-footer__grid">

                    {/* Brand Info */}
                    <div className="vendora-footer__brand">
                        <Link to="/" className="vendora-footer__brand-logo">
                            🛍️ Vendora
                        </Link>
                        <p className="vendora-footer__desc">
                            Your premium e-commerce platform. We deliver the best products directly to your door with exceptional customer service.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="vendora-footer__title">Shop</h4>
                        <ul className="vendora-footer__list">
                            <li><Link to="/products" className="vendora-footer__link">All Products</Link></li>
                            <li><Link to="/products?category=electronics" className="vendora-footer__link">Electronics</Link></li>
                            <li><Link to="/products?category=clothing" className="vendora-footer__link">Clothing</Link></li>
                            <li><Link to="/products?category=home" className="vendora-footer__link">Home & Kitchen</Link></li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h4 className="vendora-footer__title">Support</h4>
                        <ul className="vendora-footer__list">
                            <li><Link to="/profile" className="vendora-footer__link">My Account</Link></li>
                            <li><Link to="/orders" className="vendora-footer__link">Track Order</Link></li>
                            <li><Link to="/returns" className="vendora-footer__link">Returns Policy</Link></li>
                            <li><Link to="/faq" className="vendora-footer__link">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="vendora-footer__title">Contact Us</h4>
                        <ul className="vendora-footer__list">
                            <li className="vendora-footer__link">support@vendora.com</li>
                            <li className="vendora-footer__link">1-800-VENDORA</li>
                            <li className="vendora-footer__link">123 Commerce St.<br />Tech City, TC 90210</li>
                        </ul>
                    </div>

                </div>

                <div className="vendora-footer__bottom">
                    <p>&copy; {currentYear} Vendora Inc. All rights reserved.</p>
                    <div className="vendora-footer__socials">
                        {/* <a href="#" className="vendora-footer__social-link" aria-label="Twitter">𝕏</a>
                        <a href="#" className="vendora-footer__social-link" aria-label="Facebook">f</a> */}
                        <a href="#" className="vendora-footer__social-link" aria-label="Instagram">IG</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
