

import { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS, DEFAULT_SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from '../utils/constants.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

/// Provides cart state and actions.
/// Guest carts are stored in localStorage (REQ-21).
/// Authenticated user carts will sync with the backend API in future phases.
export function CartProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [cartItems, setCartItems] = useState([]);

    // load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch {
                localStorage.removeItem(STORAGE_KEYS.CART);
            }
        }
    }, []);

    // persist cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cartItems));
    }, [cartItems]);

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
                    image: product.imageUrl || product.images?.[0] || '',
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
    function clearCart() {
        setCartItems([]);
    }

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
