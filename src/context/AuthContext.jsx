/* ========================================
   Vendora — Auth Context
   Manages user authentication state across the app
   ======================================== */

import { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS, USER_ROLES } from '../utils/constants.js';

const AuthContext = createContext(null);

/// Provides authentication state and actions to all child components.
/// Persists user session to localStorage (REQ-10: token in local storage).
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // on mount, check localStorage for an existing session
    useEffect(() => {
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
            } catch {
                localStorage.removeItem(STORAGE_KEYS.USER);
            }
        }
        setIsLoading(false);
    }, []);

    // login: save user data to state and localStorage
    function login(userData) {
        setUser(userData);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    }

    // logout: clear user data from state and localStorage (REQ-10)
    function logout() {
        setUser(null);
        localStorage.removeItem(STORAGE_KEYS.USER);
    }

    const isAuthenticated = user !== null;
    const isAdmin = user?.role === USER_ROLES.ADMIN;

    const contextValue = {
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

/// Hook to access authentication state from any component
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
