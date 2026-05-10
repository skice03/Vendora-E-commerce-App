/* ========================================
   Vendora — Homepage
   Hero, categories, featured products
   ======================================== */

import { useNavigate, Link } from 'react-router-dom';
import { mockProducts, mockCategories } from '../data/mockData.js';
import ProductCard from '../components/ui/ProductCard.jsx';
import './HomePage.css';

// Map category names to emojis for visual appeal
const CATEGORY_ICONS = {
    'Electronics': '💻',
    'Laptops': '🖥️',
    'Smartphones': '📱',
    'Audio': '🎧',
    'Clothing': '👗',
    "Men's Wear": '👔',
    "Women's Wear": '👠',
    'Home & Kitchen': '🏠',
    'Furniture': '🛋️',
    'Appliances': '🔌',
    'Sports & Outdoors': '⚽',
    'Books': '📚',
};

export default function HomePage() {
    const navigate = useNavigate();

    // Top-level categories only (no sub-categories in the hero section)
    const topCategories = mockCategories.filter(c => c.parentCategoryId === null);

    // Sort by rating descending, take top 4 for featured grid
    const featuredProducts = [...mockProducts]
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 4);

    return (
        <main>
            {/* ---- Hero ---- */}
            <section className="hero" aria-labelledby="hero-heading">
                <div className="hero__content animate-fade-in">
                    <span className="hero__badge">✨ New Season Arrivals</span>
                    <h1 className="hero__title" id="hero-heading">
                        Shop the Future,{' '}
                        <span>Delivered Today</span>
                    </h1>
                    <p className="hero__subtitle">
                        Discover thousands of premium products across electronics, fashion,
                        home, sports and more — all in one place.
                    </p>
                    <div className="hero__actions">
                        <Link to="/products" className="hero__btn-primary">
                            Shop Now
                        </Link>
                        <Link to="/register" className="hero__btn-secondary">
                            Create Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* ---- Stats Bar ---- */}
            <div className="stats-bar">
                <div className="stats-bar__inner">
                    <div className="stat-item">
                        <div className="stat-item__value">10,000+</div>
                        <div className="stat-item__label">Products Available</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-item__value">50,000+</div>
                        <div className="stat-item__label">Happy Customers</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-item__value">99.8%</div>
                        <div className="stat-item__label">Satisfaction Rate</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-item__value">24/7</div>
                        <div className="stat-item__label">Customer Support</div>
                    </div>
                </div>
            </div>

            {/* ---- Shop by Category ---- */}
            <section className="home-section" aria-labelledby="categories-heading">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title" id="categories-heading">Shop by Category</h2>
                            <p className="section-subtitle">Browse our wide range of product categories</p>
                        </div>
                        <Link to="/products" className="section-link">View all →</Link>
                    </div>
                    <div className="category-grid">
                        {topCategories.map(category => (
                            <Link
                                key={category.id}
                                to={`/products?category=${category.id}`}
                                className="category-card"
                                aria-label={`Browse ${category.name}`}
                            >
                                <span className="category-card__icon" aria-hidden="true">
                                    {CATEGORY_ICONS[category.name] || '🛍️'}
                                </span>
                                <span className="category-card__name">{category.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- Featured Products ---- */}
            <section className="home-section home-section--gray" aria-labelledby="featured-heading">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title" id="featured-heading">Featured Products</h2>
                            <p className="section-subtitle">Our top-rated picks just for you</p>
                        </div>
                        <Link to="/products" className="section-link">See all products →</Link>
                    </div>
                    <div className="product-grid">
                        {featuredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- Promo Banner ---- */}
            <section className="home-section">
                <div className="container">
                    <div className="promo-banner">
                        <div className="promo-banner__content">
                            <h2>🚚 Free Shipping on Orders Over $50</h2>
                            <p>
                                Enjoy fast, reliable delivery right to your door with no minimum
                                fuss on qualifying orders.
                            </p>
                        </div>
                        <Link to="/products" className="promo-banner__btn">
                            Start Shopping
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
