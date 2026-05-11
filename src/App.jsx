

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

// Dummy Pages for Phase 1 routing validation
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
                <Route path="/checkout" element={<DummyPage title="Checkout" />} />
                
                {/* Protected Customer Routes (Auth logic to be added in Phase 2) */}
                <Route path="/orders" element={<DummyPage title="My Orders" />} />
                <Route path="/profile" element={<DummyPage title="My Profile" />} />
                <Route path="/wishlist" element={<DummyPage title="My Wishlist" />} />
              </Route>
            </Routes>

          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}