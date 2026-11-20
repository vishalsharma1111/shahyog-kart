import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart,
  Lock,
  Mail,
  User,
  Phone,
  Building,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, getDashboardRoute } = useAuth();

  const initialRole = searchParams.get('role') || 'customer';

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [causeArea, setCauseArea] = useState('Child Education');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [showLegacyForm, setShowLegacyForm] = useState(false);

  const isPartner = ['seller', 'ngo', 'delivery'].includes(role);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    if (!name || !email || !password) {
      setErrorMsg('Please fill in name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await register({
        name,
        email,
        password,
        role,
        phone,
        organization_name: isPartner ? organizationName : null,
        registration_number: role === 'ngo' ? registrationNumber : null,
        cause_area: role === 'ngo' ? causeArea : null
      });

      if (res.success) {
        if (isPartner) {
          setSuccessNotice(res.message);
          setTimeout(() => {
            const dest = getDashboardRoute(role);
            navigate(dest);
          }, 1500);
        } else {
          navigate('/shop');
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-green-900 to-brand-green-700 flex items-center justify-center text-white mx-auto shadow-md">
          <Heart className="w-6 h-6 fill-brand-orange-500 text-brand-orange-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
          Join the Shahyog Movement
        </h1>
        <p className="text-xs text-gray-500">
          Shop with Purpose, Donate with Love. Select your account type below.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Select Account Role
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'customer', label: 'Customer / Donor' },
              { id: 'seller', label: 'Artisan Seller' },
              { id: 'ngo', label: 'Verified NGO' },
              { id: 'delivery', label: 'Delivery Partner' }
            ].map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center ${
                  role === r.id
                    ? 'bg-brand-green-900 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Verification Rule Notice */}
        {isPartner ? (
          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Clock className="w-4 h-4 flex-shrink-0 text-amber-700 mt-0.5" />
            <div>
              <p className="font-bold">Partner Account Verification Notice</p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                As a {role.toUpperCase()} partner, your account will be created with status <strong>"Pending Verification"</strong>. Our administrator team reviews partner accounts to maintain fair trade authenticity and donor trust.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 p-3.5 rounded-2xl border border-green-200 text-xs text-green-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-700 flex-shrink-0" />
            <span>Customer & Donor accounts are instantly active and ready to shop!</span>
          </div>
        )}

        {/* Optional Partner Details before Google SignUp */}
        {isPartner && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              {role === 'ngo' ? 'NGO Organization Details' : role === 'seller' ? 'Artisan Enterprise Details' : 'Logistics Partner Details'}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {role === 'ngo' ? 'Organization / Trust Name *' : 'Business / Store Name *'}
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. Navjeevan Rural Welfare Foundation"
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              />
            </div>
          </div>
        )}

        {/* PRIMARY GOOGLE REGISTRATION */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider text-center">
            Sign Up with Google SSO
          </label>
          <GoogleLoginButton
            targetRole={role}
            organizationName={organizationName}
            phone={phone}
            text={`Register as ${role.toUpperCase()} with Google`}
            onSuccess={(res) => {
              if (isPartner) {
                setSuccessNotice(res.message);
                setTimeout(() => {
                  const dest = getDashboardRoute(role);
                  navigate(dest);
                }, 1500);
              } else {
                navigate('/shop');
              }
            }}
          />
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl border border-emerald-200 text-xs font-semibold">
            {successNotice}
          </div>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">
            Or Register with Password (Legacy)
          </span>
        </div>

        {/* Collapsible Legacy Password Registration */}
        <div>
          <button
            type="button"
            onClick={() => setShowLegacyForm(!showLegacyForm)}
            className="w-full flex items-center justify-between text-xs font-bold text-gray-600 hover:text-gray-900 py-1"
          >
            <span>Manual Registration Form</span>
            {showLegacyForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showLegacyForm && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {isPartner ? 'Representative Contact Name' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                      placeholder="e.g. Ramesh Patel"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                    placeholder="name@shahyogkart.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                    placeholder="Minimum 6 characters"
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
                    Complete Registration <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-orange-600 hover:underline">
              Sign In with Google
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
