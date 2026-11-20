import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  User,
  LogOut,
  Package,
  Layers,
  Shield,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Building2,
  Truck,
  Coins,
  Bell,
  Check,
  ExternalLink,
  Gift
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import StatusBadge from './StatusBadge';
import api from '../../api/axiosInstance';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isAdmin, isSeller, isCustomer, isNgo, isDelivery, isPendingPartner } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Non-intrusive error
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // 15s poll
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const handleMarkAsRead = async (id, link) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        setNotificationOpen(false);
        navigate(link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Donate', path: '/donate' },
    { name: 'NGOs', path: '/ngos' },
    { name: 'About & Contact', path: '/about' }
  ];

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setNotificationOpen(false);
    navigate('/');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reward_coins':
      case 'coin':
        return <Coins className="w-4 h-4 text-brand-orange-500" />;
      case 'pickup':
      case 'delivery':
        return <Truck className="w-4 h-4 text-blue-500" />;
      case 'ngo':
      case 'distribution':
        return <Building2 className="w-4 h-4 text-emerald-600" />;
      case 'order':
        return <Package className="w-4 h-4 text-purple-600" />;
      default:
        return <Heart className="w-4 h-4 text-brand-orange-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      {/* Top Banner */}
      <div className="bg-brand-green-950 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-brand-orange-500 animate-pulse" />
        <span>
          <strong>Shahyog Kart:</strong> Shop with Purpose, Donate with Love. Empowering Verified NGOs & Indian Rural Artisans.
        </span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Tagline */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-green-900 to-brand-green-700 flex items-center justify-center text-white shadow-md shadow-brand-green-900/20 group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 fill-brand-orange-500 text-brand-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-brand-green-950 tracking-tight">
                  Shahyog<span className="text-brand-orange-500">Kart</span>
                </span>
              </div>
              <p className="text-[10px] text-gray-500 tracking-wider font-semibold uppercase -mt-0.5 hidden sm:block">
                Shop with Purpose, Donate with Love
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-brand-green-900 bg-brand-green-50'
                      : 'text-gray-600 hover:text-brand-green-900 hover:bg-gray-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Dedicated Role Dashboards */}
            {isNgo && (
              <Link
                to="/ngo"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
              >
                <Building2 className="w-3.5 h-3.5" />
                NGO Hub
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Portal
              </Link>
            )}

            {isDelivery && (
              <Link
                to="/delivery"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
              >
                <Truck className="w-3.5 h-3.5" />
                Delivery Fleet
              </Link>
            )}

            {isSeller && (
              <Link
                to="/seller"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-orange-50 text-brand-orange-700 border border-brand-orange-200 hover:bg-brand-orange-100 transition"
              >
                <Layers className="w-3.5 h-3.5" />
                Seller Hub
              </Link>
            )}

            {/* Shopping Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl text-gray-700 hover:text-brand-green-900 hover:bg-gray-50 transition border border-gray-100 flex items-center justify-center"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Notification Bell (Authenticated Users) */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationOpen(!notificationOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="relative p-2.5 rounded-xl text-gray-700 hover:text-brand-green-900 hover:bg-gray-50 transition border border-gray-100 flex items-center justify-center"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {notificationOpen && (
                  <div
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 max-h-[480px] overflow-hidden flex flex-col"
                    onMouseLeave={() => setNotificationOpen(false)}
                  >
                    <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-orange-100 text-brand-orange-700">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-brand-green-800 hover:underline font-semibold"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-xs">
                          <Bell className="w-8 h-8 mx-auto text-gray-300 mb-2 stroke-1" />
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 15).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkAsRead(n.id, n.link)}
                            className={`p-3.5 hover:bg-gray-50 transition cursor-pointer flex gap-3 items-start ${
                              !n.is_read ? 'bg-amber-50/40' : ''
                            }`}
                          >
                            <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 shrink-0">
                              {getNotificationIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className={`text-xs font-bold truncate ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {n.title}
                                </h4>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-brand-orange-500 shrink-0 ml-1"></span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5 leading-snug">
                                {n.message}
                              </p>
                              <span className="text-[9px] text-gray-400 mt-1 block">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth State Management */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotificationOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-2xl hover:bg-gray-50 border border-gray-200 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-green-900 text-white flex items-center justify-center font-bold text-xs">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-gray-900 truncate max-w-[100px]">
                      {user?.name}
                    </div>
                    <div className="text-[10px] text-gray-500 capitalize">
                      {user?.role}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      <div className="mt-2">
                        <StatusBadge status={user?.status} />
                      </div>
                      {isPendingPartner && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded-md mt-2 leading-tight">
                          Account pending admin verification.
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        My Profile & Addresses
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Package className="w-4 h-4 text-gray-400" />
                        My Orders & Impact
                      </Link>

                      <Link
                        to="/donate/items"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-brand-orange-600 hover:bg-brand-orange-50 font-medium"
                      >
                        <Heart className="w-4 h-4 text-brand-orange-500" />
                        Donate Physical Items
                      </Link>

                      <Link
                        to="/rewards"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-brand-orange-600 hover:bg-brand-orange-50 font-bold"
                      >
                        <Coins className="w-4 h-4 text-brand-orange-500" />
                        My Shahyog Coins
                      </Link>

                      {(isNgo || isAdmin) && (
                        <Link
                          to="/ngo"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 font-semibold"
                        >
                          <Building2 className="w-4 h-4" />
                          NGO Dashboard
                        </Link>
                      )}

                      {(isDelivery || isAdmin) && (
                        <Link
                          to="/delivery"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-amber-800 hover:bg-amber-50 font-semibold"
                        >
                          <Truck className="w-4 h-4" />
                          Delivery Dashboard
                        </Link>
                      )}

                      {isSeller && (
                        <Link
                          to="/seller"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-brand-orange-600 hover:bg-brand-orange-50 font-semibold"
                        >
                          <Layers className="w-4 h-4" />
                          Seller Dashboard
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 font-semibold"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Console
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:text-brand-green-950 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-brand-green-900 hover:bg-brand-green-800 text-white shadow-sm transition active:scale-95"
                >
                  Join Us
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-gray-800" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-semibold text-gray-700 hover:bg-brand-green-50 hover:text-brand-green-900"
            >
              {link.name}
            </Link>
          ))}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-bold text-purple-700 bg-purple-50"
            >
              Admin Portal
            </Link>
          )}

          {isNgo && (
            <Link
              to="/ngo"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-bold text-emerald-700 bg-emerald-50"
            >
              NGO Dashboard
            </Link>
          )}

          {isDelivery && (
            <Link
              to="/delivery"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-bold text-amber-800 bg-amber-50"
            >
              Delivery Dashboard
            </Link>
          )}

          {isAuthenticated && (
            <Link
              to="/rewards"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-bold text-brand-orange-700 bg-brand-orange-50"
            >
              My Shahyog Coins (Rewards)
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
