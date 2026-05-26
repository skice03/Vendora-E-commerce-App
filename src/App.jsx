

import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
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
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import FAQPage from './pages/FAQPage.jsx';
import ReturnsPage from './pages/ReturnsPage.jsx';

// Admin
import AdminRoute from './components/layout/AdminRoute.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminReviewsPage from './pages/admin/AdminReviewsPage.jsx';
import AdminDashboardOverview from './pages/admin/AdminDashboardOverview.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <WishlistProvider>
              
              <ToastContainer />
              
              <Routes>
                {/* Public Routes wrapped in standard Layout */}
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/returns" element={<ReturnsPage />} />

                  {/* Protected Customer Routes — redirect to /login if not authenticated */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/checkout/success" element={<OrderConfirmationPage />} />
                    <Route path="/orders" element={<MyOrdersPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                  </Route>
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

            </WishlistProvider>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}