/* ========================================
   Vendora — Named Constants
   Eliminates magic numbers per SRS quality rules
   ======================================== */

// API base URL for the C# backend
export const API_BASE_URL = 'http://localhost:5169/api';

// pagination limits (REQ-12)
export const PRODUCTS_PER_PAGE = 20;

// password validation (REQ-04)
export const MIN_PASSWORD_LENGTH = 8;

// login security (REQ-09)
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;

// session management (JWT expiration — REQ security)
export const SESSION_EXPIRY_HOURS = 2;

// cart rules (REQ-68)
export const ABANDONED_CART_DAYS = 7;

// order statuses (used across order tracking UI)
export const ORDER_STATUSES = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};

// user roles
export const USER_ROLES = {
    CUSTOMER: 'Customer',
    ADMIN: 'Admin',
};

// rating constraints (REQ-56)
export const MIN_RATING = 1;
export const MAX_RATING = 5;

// currency settings (REQ — business rules)
export const CURRENCY_SYMBOL = '$';
export const CURRENCY_DECIMAL_PLACES = 2;

// shipping cost placeholder (REQ-67)
export const DEFAULT_SHIPPING_COST = 9.99;
export const FREE_SHIPPING_THRESHOLD = 75.00;

// tax rate placeholder
export const TAX_RATE = 0.08;

// local storage keys
export const STORAGE_KEYS = {
    USER: 'vendora_user',
    CART: 'vendora_cart',
    THEME: 'vendora_theme',
};

// product sort options (REQ-51)
export const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
    { value: 'rating_desc', label: 'Highest Rated' },
];
