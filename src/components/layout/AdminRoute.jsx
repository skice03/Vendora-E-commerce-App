import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminRoute() {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();

    if (isLoading) {
        return <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading...</div>;
    }

    // Not logged in, send to login page
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Logged in but not admin, send to home page
    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
