

import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

// Components
import Layout from './components/layout/Layout.jsx';
import ToastContainer from './components/ui/Toast.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Register from './pages/Register.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';

// Admin
import AdminRoute from './components/layout/AdminRoute.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminReviewsPage from './pages/admin/AdminReviewsPage.jsx';
import AdminDashboardOverview from './pages/admin/AdminDashboardOverview.jsx';

// Dummy Pages for features not yet implemented
const DummyPage = ({ title }) => (
  <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
    <h1 className="text-dark">{title}</h1>
    <p className="text-muted">This page will be fully implemented in a later phase.</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            
            <ToastContainer />
            
            <Routes>
              {/* Public & Customer Routes wrapped in standard Layout */}
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<MyOrdersPage />} />
                
                {/* Remaining Dummy Pages for future phases */}
                <Route path="/profile" element={<DummyPage title="My Profile" />} />
                <Route path="/wishlist" element={<DummyPage title="My Wishlist" />} />
              </Route>

              {/* Admin Routes (No standard layout, or separate admin layout) */}
                <Route element={<AdminRoute />}>
                <Route element={<Layout />}>
                    <Route path="/admin" element={<AdminDashboardOverview />} />
                    <Route path="/admin/products" element={<AdminProductsPage />} />
                    <Route path="/admin/orders" element={<AdminOrdersPage />} />
                    <Route path="/admin/reviews" element={<AdminReviewsPage />} />
                </Route>
              </Route>
            </Routes>

          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}