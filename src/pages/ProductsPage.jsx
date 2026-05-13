import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiGet } from '../utils/api.js';
import ProductCard from '../components/ui/ProductCard.jsx';
import './ProductsPage.css';

const SORT_OPTIONS = [
    { value: 'rating_desc', label: 'Top Rated' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name_asc', label: 'Name: A–Z' },
    { value: 'popular', label: 'Most Popular' },
];

const MIN_RATING_OPTIONS = [
    { value: 0, label: 'All Ratings' },
    { value: 4, label: '4★ & up' },
    { value: 3, label: '3★ & up' },
    { value: 2, label: '2★ & up' },
];

export default function ProductsPage() {
    const [searchParams] = useSearchParams();

    const initialCategory = Number(searchParams.get('category')) || 0;
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [searchQuery, setSearchQuery] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [sortBy, setSortBy] = useState('rating_desc');
    const [currentPage, setCurrentPage] = useState(1);
    const PRODUCTS_PER_PAGE = 12;

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                // Fetch products and categories concurrently from DB
                const [productsData, categoriesData] = await Promise.all([
                    apiGet('/products'),
                    apiGet('/categories')
                ]);
                setProducts(productsData);
                setCategories(categoriesData);
            } catch (err) {
                setError('Failed to load products: ' + err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const topCategories = categories.filter(category => category.parentCategoryId === null);

    // Filters products based on search criteria (REQ-15, REQ-16, REQ-17)
    const filteredProducts = useMemo(() => {
        let result = products;

        // REQ-15: Keyword search on names and descriptions (case-insensitive)
        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(product =>
                product.name.toLowerCase().includes(lowerQuery) ||
                (product.description && product.description.toLowerCase().includes(lowerQuery))
            );
        }

        if (selectedCategory !== 0) {
            const childIds = categories
                .filter(category => category.parentCategoryId === selectedCategory)
                .map(category => category.id);
            const validIds = [selectedCategory, ...childIds];
            result = result.filter(product => validIds.includes(product.categoryId));
        }

        // Apply Price range filter (REQ-16)
        if (minPrice !== '') result = result.filter(product => product.price >= Number(minPrice));
        if (maxPrice !== '') result = result.filter(product => product.price <= Number(maxPrice));

        if (minRating > 0) result = result.filter(product => (product.averageRating || 0) >= minRating);

        // Sorts products by dynamic attributes (REQ-51)
        switch (sortBy) {
            case 'price_asc':  result = [...result].sort((a, b) => a.price - b.price); break;
            case 'price_desc': result = [...result].sort((a, b) => b.price - a.price); break;
            case 'name_asc':   result = [...result].sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'popular':    result = [...result].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)); break;
            default:           result = [...result].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        }

        return result;
    }, [products, searchQuery, selectedCategory, minPrice, maxPrice, minRating, sortBy]);

    // Reset to page 1 when any filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, minPrice, maxPrice, minRating, sortBy]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
        return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    function handleClearFilters() {
        setSelectedCategory(0);
        setSearchQuery('');
        setMinPrice('');
        setMaxPrice('');
        setMinRating(0);
        setSortBy('rating_desc');
        setCurrentPage(1);
    }

    const hasActiveFilters = selectedCategory !== 0 || searchQuery !== '' || minPrice !== '' || maxPrice !== '' || minRating > 0;

    return (
        <div className="products-page">
            {/* ---- Sidebar ---- */}
            <aside className="products-sidebar" aria-label="Product filters">
                <h2 className="sidebar__title">
                    Filters
                    {hasActiveFilters && (
                        <button className="sidebar__clear-btn" onClick={handleClearFilters}>
                            Clear all
                        </button>
                    )}
                </h2>

                {/* REQ-15: Keyword search */}
                <div className="filter-group">
                    <span className="filter-group__label">Search</span>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        aria-label="Search products by name or description"
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--border-radius)',
                            border: '1px solid var(--color-gray-300)',
                            fontSize: 'var(--font-size-sm)',
                            fontFamily: 'var(--font-family)'
                        }}
                    />
                </div>

                {/* Category Filter */}
                <div className="filter-group">
                    <span className="filter-group__label">Category</span>
                    <ul className="filter-category-list">
                        <li>
                            <button
                                className={`filter-category-item ${selectedCategory === 0 ? 'filter-category-item--active' : ''}`}
                                onClick={() => setSelectedCategory(0)}
                            >
                                All Categories
                            </button>
                        </li>
                        {topCategories.map(cat => (
                            <li key={cat.id}>
                                <button
                                    className={`filter-category-item ${selectedCategory === cat.id ? 'filter-category-item--active' : ''}`}
                                    onClick={() => setSelectedCategory(cat.id)}
                                >
                                    {cat.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Price Range Filter */}
                <div className="filter-group">
                    <span className="filter-group__label">Price Range</span>
                    <div className="price-range-inputs">
                        <input
                            type="number"
                            placeholder="Min $"
                            value={minPrice}
                            onChange={(event) => setMinPrice(event.target.value)}
                            min={0}
                            aria-label="Minimum price"
                        />
                        <span className="price-range-separator">–</span>
                        <input
                            type="number"
                            placeholder="Max $"
                            value={maxPrice}
                            onChange={(event) => setMaxPrice(event.target.value)}
                            min={0}
                            aria-label="Maximum price"
                        />
                    </div>
                </div>

                {/* Minimum Rating Filter */}
                <div className="filter-group">
                    <span className="filter-group__label">Minimum Rating</span>
                    <div className="rating-filter">
                        {MIN_RATING_OPTIONS.map(opt => (
                            <label key={opt.value} className="rating-filter__option">
                                <input
                                    type="radio"
                                    name="min-rating"
                                    value={opt.value}
                                    checked={minRating === opt.value}
                                    onChange={() => setMinRating(opt.value)}
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>
            </aside>

            {/* ---- Main ---- */}
            <main className="products-main">
                {/* Toolbar */}
                <div className="products-toolbar">
                    <p className="products-toolbar__count">
                        Showing <strong>{paginatedProducts.length}</strong> of{' '}
                        <strong>{filteredProducts.length}</strong> products
                        {filteredProducts.length !== products.length && (
                            <span> (filtered from {products.length})</span>
                        )}
                    </p>
                    <select
                        className="sort-select"
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                        aria-label="Sort products"
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Product Grid or Empty State */}
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>Loading products...</div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : paginatedProducts.length > 0 ? (
                    <>
                    <div className="product-grid">
                        {paginatedProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="pagination__btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                            >
                                ← Previous
                            </button>
                            <div className="pagination__pages">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        className={`pagination__page ${page === currentPage ? 'pagination__page--active' : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                className="pagination__btn"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                    </>
                ) : (
                    <div className="products-empty">
                        <div className="products-empty__icon">🔍</div>
                        <h3>No products found</h3>
                        <p>Try adjusting your filters to see more results.</p>
                        <button
                            onClick={handleClearFilters}
                            style={{ marginTop: 'var(--space-4)', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--font-size-base)', fontFamily: 'var(--font-family)' }}
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
