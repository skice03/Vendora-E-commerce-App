import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductCard from '../components/ui/ProductCard.jsx';
import Button from '../components/ui/Button.jsx';
import './WishlistPage.css';

export default function WishlistPage() {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { wishlistItems, isLoading, removeFromWishlist } = useWishlist();

    async function handleMoveToCart(item) {
        addToCart(item.product, 1);
        await removeFromWishlist(item.productId);
    }

    if (!user) return <div className="container">Please log in to view your wishlist.</div>;

    if (isLoading) {
        return (
            <div className="wishlist-page">
                <h1 className="wishlist-page__heading">My Wishlist</h1>
                <div>Loading...</div>
            </div>
        );
    }

    return (
        <div className="wishlist-page">
            <h1 className="wishlist-page__heading">
                ❤️ My Wishlist 
                {wishlistItems.length > 0 && <span>({wishlistItems.length})</span>}
            </h1>

            {wishlistItems.length === 0 ? (
                <div className="wishlist-empty">
                    <span className="wishlist-empty__icon">💔</span>
                    <h2>Your wishlist is empty</h2>
                    <p>Save items you love here to easily find them later.</p>
                    <Link to="/products" className="wishlist-empty__btn">Browse Products</Link>
                </div>
            ) : (
                <div className="product-grid">
                    {wishlistItems.map(item => (
                        <div key={item.id} className="wishlist-item-wrapper">
                            <ProductCard product={item.product} />
                            <div className="wishlist-item-actions">
                                <Button 
                                    variant="primary" 
                                    fullWidth 
                                    onClick={() => handleMoveToCart(item)}
                                >
                                    Move to Cart
                                </Button>
                                <Button 
                                    variant="outline" 
                                    fullWidth 
                                    onClick={() => removeFromWishlist(item.productId)}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
