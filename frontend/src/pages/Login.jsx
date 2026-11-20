import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Lock, Mail, ArrowRight, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, getDashboardRoute } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const redirect = queryParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showLegacyLogin, setShowLegacyLogin] = useState(false);

  const demoAccounts = [
    { role: 'Customer / Donor', email: 'customer@shahyogkart.com', pass: 'Customer@123', color: 'bg-green-50 text-green-800 border-green-200' },
    { role: 'Artisan Seller', email: 'seller@shahyogkart.com', pass: 'Seller@123', color: 'bg-orange-50 text-orange-800 border-orange-200' },
    { role: 'NGO Partner', email: 'ngo@shahyogkart.com', pass: 'Ngo@123', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { role: 'Platform Admin', email: 'admin@shahyogkart.com', pass: 'Admin@123', color: 'bg-purple-50 text-purple-800 border-purple-200' },
    { role: 'Delivery Partner', email: 'delivery@shahyogkart.com', pass: 'Delivery@123', color: 'bg-sky-50 text-sky-800 border-sky-200' }
  ];

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setShowLegacyLogin(true);
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email, password);
      const destination = redirect || getDashboardRoute(res.user?.role);
      navigate(destination);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-green-900 to-brand-green-700 flex items-center justify-center text-white mx-auto shadow-md">
          <Heart className="w-6 h-6 fill-brand-orange-500 text-brand-orange-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
          Welcome to Shahyog Kart
        </h1>
        <p className="text-xs text-gray-500">
          Shop with Purpose, Donate with Love. Sign in to your account.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
        {/* MANDATORY GOOGLE AUTHENTICATION */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider text-center">
            Sign In with Google Identity
          </label>
          <GoogleLoginButton
            text="Continue with Google"
            onSuccess={(res) => {
              const destination = redirect || getDashboardRoute(res.user?.role);
              navigate(destination);
            }}
          />
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">
            Or Legacy Access
          </span>
        </div>

        {/* Collapsible Password Login (For Seed Testing & Backwards Compatibility) */}
        <div>
          <button
            type="button"
            onClick={() => setShowLegacyLogin(!showLegacyLogin)}
            className="w-full flex items-center justify-between text-xs font-bold text-gray-600 hover:text-gray-900 py-1"
          >
            <span>Sign in with Email & Password</span>
            {showLegacyLogin ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showLegacyLogin && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-3 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                    placeholder="name@shahyogkart.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-brand-orange-600 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-2xl font-bold bg-brand-green-900 hover:bg-brand-green-950 text-white shadow-md transition active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
              >
                {loading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    Sign In with Password <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-brand-orange-600 hover:underline">
              Create an account with Google
            </Link>
          </p>
        </div>
      </div>

      {/* Demo Credentials Quick Switcher */}
      <div className="bg-brand-gray-100 p-5 rounded-3xl border border-gray-200/80 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
          <Sparkles className="w-4 h-4 text-brand-orange-500" />
          <span>One-Click Pre-Seeded Roles (Evaluator Testing)</span>
        </div>
        <p className="text-[11px] text-gray-500">
          Autofills credentials for any of the 5 platform roles:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {demoAccounts.map((acc, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickFill(acc)}
              className={`p-2 rounded-xl text-left border text-xs font-semibold hover:shadow-xs transition ${acc.color}`}
            >
              <div className="font-bold">{acc.role}</div>
              <div className="text-[10px] opacity-80 font-mono truncate">{acc.email}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
