/* ========================================
   Vendora — Products Listing Page
   Filter sidebar + sortable product grid
   ======================================== */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mockProducts, mockCategories } from '../data/mockData.js';
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

    // Filters state
    const initialCategory = Number(searchParams.get('category')) || 0;
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [sortBy, setSortBy] = useState('rating_desc');

    // All parent categories for the sidebar
    const topCategories = mockCategories.filter(c => c.parentCategoryId === null);

    // Apply filters & sort using useMemo for performance
    const filteredProducts = useMemo(() => {
        let result = mockProducts.filter(p => !p.isDeleted);

        // Category filter: include parent and all children
        if (selectedCategory !== 0) {
            const childIds = mockCategories
                .filter(c => c.parentCategoryId === selectedCategory)
                .map(c => c.id);
            const validIds = [selectedCategory, ...childIds];
            result = result.filter(p => validIds.includes(p.categoryId));
        }

        // Price filter
        if (minPrice !== '') result = result.filter(p => p.price >= Number(minPrice));
        if (maxPrice !== '') result = result.filter(p => p.price <= Number(maxPrice));

        // Rating filter
        if (minRating > 0) result = result.filter(p => p.averageRating >= minRating);

        // Sort
        switch (sortBy) {
            case 'price_asc':  result = [...result].sort((a, b) => a.price - b.price); break;
            case 'price_desc': result = [...result].sort((a, b) => b.price - a.price); break;
            case 'name_asc':   result = [...result].sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'popular':    result = [...result].sort((a, b) => b.viewCount - a.viewCount); break;
            default:           result = [...result].sort((a, b) => b.averageRating - a.averageRating);
        }

        return result;
    }, [selectedCategory, minPrice, maxPrice, minRating, sortBy]);

    function handleClearFilters() {
        setSelectedCategory(0);
        setMinPrice('');
        setMaxPrice('');
        setMinRating(0);
        setSortBy('rating_desc');
    }

    const hasActiveFilters = selectedCategory !== 0 || minPrice !== '' || maxPrice !== '' || minRating > 0;

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
                            onChange={(e) => setMinPrice(e.target.value)}
                            min={0}
                            aria-label="Minimum price"
                        />
                        <span className="price-range-separator">–</span>
                        <input
                            type="number"
                            placeholder="Max $"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
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
                        Showing <strong>{filteredProducts.length}</strong> of{' '}
                        <strong>{mockProducts.length}</strong> products
                    </p>
                    <select
                        className="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        aria-label="Sort products"
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Product Grid or Empty State */}
                {filteredProducts.length > 0 ? (
                    <div className="product-grid">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
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
