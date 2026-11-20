import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import AboutContact from './pages/AboutContact';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Donate from './pages/Donate';
import Ngos from './pages/Ngos';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import OrderTracking from './pages/OrderTracking';
import Profile from './pages/Profile';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DonateItems from './pages/DonateItems';
import DonationTracking from './pages/DonationTracking';
import NgoDashboard from './pages/NgoDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import RewardWallet from './pages/RewardWallet';

// 404 Not Found Page
const NotFound = () => (
  <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-lg space-y-4">
    <h1 className="text-6xl font-black text-brand-green-900">404</h1>
    <h2 className="text-xl font-bold text-gray-900">Page Not Found</h2>
    <p className="text-xs text-gray-500">The destination you requested does not exist or has moved.</p>
    <Link
      to="/"
      className="inline-block px-5 py-2.5 rounded-xl bg-brand-green-900 text-white font-bold text-xs hover:bg-brand-green-800 transition shadow"
    >
      Return to Homepage
    </Link>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="flex flex-col min-h-screen bg-brand-gray-50 text-gray-900">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<AboutContact />} />
                <Route path="/contact" element={<AboutContact />} />
                <Route path="/about-contact" element={<AboutContact />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/products/:identifier" element={<ProductDetail />} />
                <Route path="/donate" element={<Donate />} />
                <Route
                  path="/donate/items"
                  element={
                    <ProtectedRoute>
                      <DonateItems />
                    </ProtectedRoute>
                  }
                />
                <Route path="/donations/track/:identifier" element={<DonationTracking />} />
                <Route path="/ngos" element={<Ngos />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Customer Protected Routes */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-success/:orderNumber"
                  element={
                    <ProtectedRoute>
                      <OrderSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:identifier"
                  element={
                    <ProtectedRoute>
                      <OrderTracking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rewards"
                  element={
                    <ProtectedRoute>
                      <RewardWallet />
                    </ProtectedRoute>
                  }
                />

                {/* Delivery Partner Portal */}
                <Route
                  path="/delivery"
                  element={
                    <ProtectedRoute allowedRoles={['delivery', 'admin']}>
                      <DeliveryDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* NGO Portal (Accessible to verified NGO and admin) */}
                <Route
                  path="/ngo"
                  element={
                    <ProtectedRoute allowedRoles={['ngo', 'admin']}>
                      <NgoDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Seller Portal (Accessible to seller and admin) */}
                <Route
                  path="/seller"
                  element={
                    <ProtectedRoute allowedRoles={['seller', 'admin']}>
                      <SellerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Console */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
