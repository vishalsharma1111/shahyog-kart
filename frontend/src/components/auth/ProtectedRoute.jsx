import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../common/Loader';
import { ShieldAlert, Clock } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles = [], requireVerified = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen text="Verifying authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check role authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-red-100 shadow-xl text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600 text-sm mb-6">
          Your current account role (<strong>{user?.role}</strong>) does not have permission to access this section.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Check partner verification requirement
  if (requireVerified && user?.status === 'pending' && ['seller', 'ngo', 'delivery'].includes(user?.role)) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-amber-200 shadow-xl text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Verification In Progress</h2>
        <p className="text-gray-600 text-sm mb-4">
          Hello <strong>{user?.name}</strong>! Your <strong>{user?.role.toUpperCase()}</strong> account application is currently under administrative review by our compliance team.
        </p>
        <div className="bg-amber-50 p-4 rounded-xl text-xs text-amber-800 text-left mb-6">
          <p className="font-semibold mb-1">Why is this required?</p>
          <p>
            Shahyog Kart enforces strict verification for NGOs, sellers, and logistics partners to ensure 100% transparency, authentic handicraft certification, and safe donations.
          </p>
        </div>
        <p className="text-xs text-gray-400">
          Verification typically takes 24 hours. Once approved, you can add products, manage stock, and process fulfillment.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
