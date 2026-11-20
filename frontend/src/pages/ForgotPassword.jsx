import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Key, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../api/axiosInstance';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: request token, 2: reset password with token

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [issuedToken, setIssuedToken] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Please enter your account email.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        if (res.data.resetToken) {
          setIssuedToken(res.data.resetToken);
          setToken(res.data.resetToken);
        }
        setStep(2);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error processing request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token || !newPassword) {
      setErrorMsg('Token and new password are required.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', { token, newPassword });
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-orange-50 text-brand-orange-500 flex items-center justify-center mx-auto shadow-sm">
          <Key className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-gray-950 tracking-tight">
          {step === 1 ? 'Forgot Your Password?' : 'Set New Password'}
        </h1>
        <p className="text-xs text-gray-500">
          {step === 1
            ? 'Enter your registered email address to receive an authorization reset token.'
            : 'Enter your reset token and your new chosen password.'}
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
        {successMsg ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">{successMsg}</h3>
            <p className="text-xs text-gray-500">Redirecting to login page...</p>
          </div>
        ) : step === 1 ? (
          /* Step 1: Enter email */
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                  placeholder="name@domain.com"
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
              className="w-full py-3 px-6 rounded-2xl font-bold bg-brand-green-900 hover:bg-brand-green-950 text-white shadow-md transition flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  Generate Reset Token <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: Enter token & new password */
          <form onSubmit={handleResetPassword} className="space-y-4">
            {issuedToken && (
              <div className="bg-brand-green-50 p-3.5 rounded-2xl border border-brand-green-200 text-xs text-brand-green-950 space-y-1">
                <p className="font-bold">🔐 Security Reset Token (Auto-populated for testing):</p>
                <p className="font-mono bg-white p-2 rounded-lg border border-brand-green-300 select-all break-all">
                  {issuedToken}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Reset Token
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:ring-2 focus:ring-brand-green-900 outline-none"
                placeholder="Paste token here"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                  placeholder="Re-enter password"
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
              className="w-full py-3.5 px-6 rounded-2xl font-bold bg-brand-orange-500 hover:bg-brand-orange-600 text-white shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  Update Password & Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-gray-100">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
