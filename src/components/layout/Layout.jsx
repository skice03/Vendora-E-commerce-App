/* ========================================
   Vendora UI — Layout Component
   ======================================== */

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

/// Standard page wrapper including Navbar, main content area, and Footer.
export default function Layout() {
    return (
        <>
            <Navbar />
            {/* The main content area where child routes are rendered */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Outlet />
            </main>
            <Footer />
        </>
    );
}
