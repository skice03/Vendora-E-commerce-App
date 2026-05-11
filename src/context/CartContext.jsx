import { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS, TAX_RATE, DEFAULT_SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from '../utils/constants.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

/// Provides cart state and actions.
export function CartProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [cartItems, setCartItems] = useState([]);

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

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cartItems));
    }, [cartItems]);

    /// Add a product to the cart, or increment quantity if it already exists.
    /// Validates against available stock (REQ-19).
    function addToCart(product, quantity = 1) {
        setCartItems(currentItems => {
            const existingIndex = currentItems.findIndex(item => item.productId === product.id);

            if (existingIndex >= 0) {
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

            if (quantity > product.stockQuantity) {
                return currentItems;
            }

            return [
                ...currentItems,
                {
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images?.[0] || '',
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
    /// Setting quantity to 0 removes the item (Section 4.5.2).
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
    const taxAmount = subtotal * TAX_RATE;
    const cartTotal = subtotal + shippingCost + taxAmount;

    const contextValue = {
        cartItems,
        cartCount,
        subtotal,
        shippingCost,
        taxAmount,
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
