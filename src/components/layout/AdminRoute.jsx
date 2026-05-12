import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminRoute() {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();

    if (isLoading) {
        return <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading...</div>;
    }

    if (!isAuthenticated || !isAdmin) {
        // Redirect unauthorized users to home page (REQ-34 Frontend Enforcement)
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
