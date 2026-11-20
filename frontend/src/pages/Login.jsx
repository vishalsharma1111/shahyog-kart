import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';
import { DEMO_ACCOUNTS } from '../api/mockService';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, getDashboardRoute } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const redirect = queryParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoadingRole, setQuickLoadingRole] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1-Click Instant Login for Evaluators & Students
  const handleQuickLogin = async (acc) => {
    setErrorMsg('');
    setEmail(acc.email);
    setPassword(acc.pass);
    setQuickLoadingRole(acc.role);

    try {
      const res = await login(acc.email, acc.pass);
      const destination = redirect || getDashboardRoute(res.user?.role);
      navigate(destination);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    } finally {
      setQuickLoadingRole(null);
    }
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
      setErrorMsg(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
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

      {/* 6 One-Click Test Accounts Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 p-5 rounded-3xl border border-emerald-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
            <Sparkles className="w-4 h-4 text-brand-orange-500" />
            <span>Instant 1-Click Test Accounts (Works on Any Device)</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
            6 Ready Roles
          </span>
        </div>
        <p className="text-[11px] text-gray-600">
          Click any card below to log in immediately as that persona:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const isLoggingIn = quickLoadingRole === acc.role;
            return (
              <button
                key={acc.id}
                type="button"
                disabled={loading || !!quickLoadingRole}
                onClick={() => handleQuickLogin(acc)}
                className={`p-3 rounded-2xl text-left border transition active:scale-95 flex flex-col justify-between hover:shadow-md cursor-pointer ${acc.color}`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-xs">{acc.name}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-white/70">
                    {acc.role}
                  </span>
                </div>
                <div className="text-[11px] font-mono opacity-90 truncate">{acc.email}</div>
                <div className="text-[10px] opacity-75 mt-0.5">Password: {acc.pass}</div>
                <div className="mt-2 text-[10px] font-bold text-brand-green-900 flex items-center gap-1">
                  {isLoggingIn ? (
                    <span className="animate-spin w-3 h-3 border-2 border-brand-green-900 border-t-transparent rounded-full" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  <span>{isLoggingIn ? 'Logging in...' : 'Click to Login Instantly →'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
        {/* Google Authentication */}
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
            Or Sign In with Email & Password
          </span>
        </div>

        {/* Manual Email & Password Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
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
            disabled={loading || !!quickLoadingRole}
            className="w-full py-3 px-6 rounded-2xl font-bold bg-brand-green-900 hover:bg-brand-green-950 text-white shadow-md transition active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wide cursor-pointer"
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

        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-brand-orange-600 hover:underline">
              Register New Account Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
