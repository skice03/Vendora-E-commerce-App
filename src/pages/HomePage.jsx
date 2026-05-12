import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiGet } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ProductCard from '../components/ui/ProductCard.jsx';
import { FREE_SHIPPING_THRESHOLD } from '../utils/constants.js';
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
    const { isAuthenticated } = useAuth();

    const [topCategories, setTopCategories] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsData, categoriesData] = await Promise.all([
                    apiGet('/products'),
                    apiGet('/categories')
                ]);
                // Sort by rating descending, take top 4 for featured grid
                const top = productsData.sort((a, b) => (b.averageRating || 5) - (a.averageRating || 5)).slice(0, 4);
                setFeaturedProducts(top);
                setTopCategories(categoriesData.filter(category => category.parentCategoryId === null));
            } catch (err) {
                console.error("Failed to load home page data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

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
                        {!isAuthenticated && (
                            <Link to="/register" className="hero__btn-secondary">
                                Create Account
                            </Link>
                        )}
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
                        {isLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                                Loading products...
                            </div>
                        ) : featuredProducts.length > 0 ? (
                            featuredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                                No products available yet.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ---- Promo Banner ---- */}
            <section className="home-section">
                <div className="container">
                    <div className="promo-banner">
                        <div className="promo-banner__content">
                            <h2>🚚 Free Shipping on Orders Over ${FREE_SHIPPING_THRESHOLD}</h2>
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
