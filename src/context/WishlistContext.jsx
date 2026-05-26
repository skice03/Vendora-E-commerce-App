import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';
import { apiGet, apiPost, apiDelete } from '../utils/api.js';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWishlist = useCallback(async () => {
        if (!user) {
            setWishlistItems([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const data = await apiGet('/wishlist');
            setWishlistItems(data);
        } catch (err) {
            console.error('Failed to fetch wishlist', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const addToWishlist = async (product) => {
        if (!user) {
            showError('Please log in to save items to your wishlist.');
            return;
        }

        try {
            await apiPost(`/wishlist/${product.id}`);
            showSuccess(`${product.name} added to wishlist!`);
            // Optimistic UI update or fetch again
            fetchWishlist();
        } catch (err) {
            showError(err.message || 'Failed to add to wishlist.');
        }
    };

    const removeFromWishlist = async (productId) => {
        try {
            await apiDelete(`/wishlist/${productId}`);
            showSuccess('Removed from wishlist.');
            setWishlistItems(prev => prev.filter(item => item.productId !== productId));
        } catch (err) {
            showError('Failed to remove item.');
        }
    };

    const toggleWishlist = async (product) => {
        const exists = wishlistItems.some(item => item.productId === product.id);
        if (exists) {
            await removeFromWishlist(product.id);
        } else {
            await addToWishlist(product);
        }
    };

    const isInWishlist = (productId) => {
        return wishlistItems.some(item => item.productId === productId);
    };

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            isLoading,
            addToWishlist,
            removeFromWishlist,
            toggleWishlist,
            isInWishlist,
            fetchWishlist,
            refreshWishlist: fetchWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export const useWishlist = () => useContext(WishlistContext);
