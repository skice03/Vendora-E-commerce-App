import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from '../utils/constants.js';
import { useAuth } from './AuthContext.jsx';
import { apiGet } from '../utils/api.js';

const CartContext = createContext(null);

/// Returns a user-specific localStorage key for cart persistence.
function getCartStorageKey(userId) {
    return `vendora_cart_${userId}`;
}

/// Resolves the current primary image for a product from its images array.
function resolveProductImage(product) {
    if (product.images && product.images.length > 0) {
        const primary = product.images.find(img => img.isPrimary);
        return primary?.imageUrl || product.images[0]?.imageUrl || '';
    }
    return '';
}

/// Provides cart state and actions.
/// Each authenticated user has their own persisted cart in localStorage.
/// Guest visitors see an empty cart and are redirected to login (REQ-20, REQ-21).
export function CartProvider({ children }) {
    const { isAuthenticated, user } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const hasRefreshedRef = useRef(false);

    // Load the user's cart when authentication state changes
    useEffect(() => {
        hasRefreshedRef.current = false;
        if (isAuthenticated && user?.id) {
            // Load cart for this specific user
            const key = getCartStorageKey(user.id);
            const savedCart = localStorage.getItem(key);
            if (savedCart) {
                try {
                    setCartItems(JSON.parse(savedCart));
                } catch {
                    localStorage.removeItem(key);
                    setCartItems([]);
                }
            } else {
                setCartItems([]);
            }
        } else {
            // Guest — clear in-memory cart (user's data stays in localStorage)
            setCartItems([]);
        }
    }, [isAuthenticated, user?.id]);

    // Refresh product images from the API to keep them current
    useEffect(() => {
        if (!isAuthenticated || cartItems.length === 0 || hasRefreshedRef.current) {
            return;
        }
        hasRefreshedRef.current = true;

        async function refreshImages() {
            try {
                const updatedItems = await Promise.all(
                    cartItems.map(async (item) => {
                        try {
                            const product = await apiGet(`/products/${item.productId}`);
                            return {
                                ...item,
                                image: resolveProductImage(product),
                                name: product.name || item.name,
                                price: product.price ?? item.price,
                                stockQuantity: product.stockQuantity ?? item.stockQuantity,
                            };
                        } catch {
                            // Product may have been deleted — keep existing data
                            return item;
                        }
                    })
                );
                setCartItems(updatedItems);
            } catch {
                // Silently fail — keep existing cart data
            }
        }
        refreshImages();
    }, [isAuthenticated, cartItems.length]);

    // Persist cart to user-specific localStorage whenever it changes
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            const key = getCartStorageKey(user.id);
            localStorage.setItem(key, JSON.stringify(cartItems));
        }
    }, [cartItems, isAuthenticated, user?.id]);

    /// Add a product to the cart, or increment quantity if it already exists.
    /// Validates against available stock (REQ-19).
    /// Restricts cart operations to authenticated users (REQ-20, REQ-21).
    function addToCart(product, quantity = 1) {
        if (!isAuthenticated) {
            throw new Error('Please log in to add items to your cart.');
        }

        setCartItems(currentItems => {
            const existingIndex = currentItems.findIndex(item => item.productId === product.id);

            if (existingIndex >= 0) {
                // item already in cart — update quantity
                const updatedItems = [...currentItems];
                const newQuantity = updatedItems[existingIndex].quantity + quantity;

                // validate stock (REQ-19)
                if (newQuantity > product.stockQuantity) {
                    return currentItems;
                }

                updatedItems[existingIndex] = {
                    ...updatedItems[existingIndex],
                    quantity: newQuantity,
                };
                return updatedItems;
            }

            // new item — validate stock before adding
            if (quantity > product.stockQuantity) {
                return currentItems;
            }

            return [
                ...currentItems,
                {
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    image: resolveProductImage(product),
                    quantity: quantity,
                    stockQuantity: product.stockQuantity,
                },
            ];
        });
    }

    /// Remove an item from the cart entirely
    function removeFromCart(productId) {
        setCartItems(currentItems =>
            currentItems.filter(item => item.productId !== productId)
        );
    }

    /// Update the quantity of a specific cart item.
    /// Setting quantity to 0 removes the item (REQ — stimulus/response for cart).
    function updateQuantity(productId, newQuantity) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems(currentItems =>
            currentItems.map(item => {
                if (item.productId === productId) {
                    // validate against stock (REQ-19)
                    const safeQuantity = Math.min(newQuantity, item.stockQuantity);
                    return { ...item, quantity: safeQuantity };
                }
                return item;
            })
        );
    }

    /// Clear the entire cart (used after successful checkout — REQ-29)
    const clearCart = useCallback(() => {
        setCartItems([]);
        // Also remove from localStorage to prevent stale data
        if (isAuthenticated && user?.id) {
            localStorage.removeItem(getCartStorageKey(user.id));
        }
    }, [isAuthenticated, user?.id]);

    // ---- Computed Values (REQ-22) ----
    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    const subtotal = cartItems.reduce(
        (total, item) => total + (item.price * item.quantity),
        0
    );

    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
    const cartTotal = subtotal + shippingCost;

    const contextValue = {
        cartItems,
        cartCount,
        subtotal,
        shippingCost,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
    };

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
}

/// Hook to access cart state from any component
export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

export default CartContext;
