import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { mockLogin, mockRegister, DEMO_ACCOUNTS } from '../api/mockService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('shahyog_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('shahyog_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize user session on app load
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        // If we already have saved user in localStorage, restore immediately
        const savedUserStr = localStorage.getItem('shahyog_user');
        if (savedUserStr) {
          try {
            setUser(JSON.parse(savedUserStr));
          } catch (e) {}
        }

        // If connected to a real live backend, verify with /auth/me
        if (!token.startsWith('shahyog_demo_') && !token.startsWith('shahyog_custom_')) {
          try {
            const res = await api.get('/auth/me');
            if (res.data?.success && res.data.user) {
              setUser(res.data.user);
              localStorage.setItem('shahyog_user', JSON.stringify(res.data.user));
            }
          } catch (err) {
            console.warn('Backend server currently offline or waking up. Preserving offline session.');
          }
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const googleLogin = async (idToken, targetRole = 'customer', extraData = {}) => {
    try {
      const res = await api.post('/auth/google', {
        idToken,
        role: targetRole,
        ...extraData
      });
      if (res.data?.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('shahyog_token', res.data.token);
        localStorage.setItem('shahyog_user', JSON.stringify(res.data.user));
        return res.data;
      }
    } catch (err) {
      console.warn('Backend Google Auth failed, falling back to local demo profile:', err);
      const googleUser = {
        id: Date.now(),
        name: extraData.name || 'Google User',
        email: extraData.email || 'user@shahyogkart.com',
        role: targetRole || 'customer',
        status: 'approved',
        reward_coins: 100,
        avatar_url: extraData.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      };
      const demoToken = `shahyog_demo_token_${googleUser.id}`;
      setToken(demoToken);
      setUser(googleUser);
      localStorage.setItem('shahyog_token', demoToken);
      localStorage.setItem('shahyog_user', JSON.stringify(googleUser));
      return { success: true, user: googleUser, token: demoToken };
    }
  };

  const login = async (email, password) => {
    // 1. Try real backend API
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success && res.data.user) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('shahyog_token', res.data.token);
        localStorage.setItem('shahyog_user', JSON.stringify(res.data.user));
        return res.data;
      }
    } catch (err) {
      // 2. If backend fails/offline, use mock demo accounts & custom registered users
      const fallback = mockLogin(email, password);
      if (fallback.success) {
        setToken(fallback.token);
        setUser(fallback.user);
        localStorage.setItem('shahyog_token', fallback.token);
        localStorage.setItem('shahyog_user', JSON.stringify(fallback.user));
        return fallback;
      }
      throw err;
    }

    const fallback = mockLogin(email, password);
    if (fallback.success) {
      setToken(fallback.token);
      setUser(fallback.user);
      localStorage.setItem('shahyog_token', fallback.token);
      localStorage.setItem('shahyog_user', JSON.stringify(fallback.user));
      return fallback;
    }
    throw new Error('Invalid email or password.');
  };

  const register = async (userData) => {
    // 1. Try real backend API
    try {
      const res = await api.post('/auth/register', userData);
      if (res.data?.success && res.data.user) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('shahyog_token', res.data.token);
        localStorage.setItem('shahyog_user', JSON.stringify(res.data.user));
        return res.data;
      }
    } catch (err) {
      // 2. Fall back to local mock registration
      const fallback = mockRegister(userData);
      if (fallback.success) {
        setToken(fallback.token);
        setUser(fallback.user);
        localStorage.setItem('shahyog_token', fallback.token);
        localStorage.setItem('shahyog_user', JSON.stringify(fallback.user));
        return fallback;
      }
      throw err;
    }

    const fallback = mockRegister(userData);
    if (fallback.success) {
      setToken(fallback.token);
      setUser(fallback.user);
      localStorage.setItem('shahyog_token', fallback.token);
      localStorage.setItem('shahyog_user', JSON.stringify(fallback.user));
      return fallback;
    }
    throw new Error('Registration failed.');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('shahyog_token');
    localStorage.removeItem('shahyog_user');
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.put('/auth/profile', data);
      if (res.data?.success) {
        setUser(res.data.user);
        localStorage.setItem('shahyog_user', JSON.stringify(res.data.user));
        return res.data;
      }
    } catch (e) {
      // Offline fallback: update local user
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem('shahyog_user', JSON.stringify(updated));
      return { success: true, user: updated };
    }
  };

  const refreshUser = async () => {
    if (token && !token.startsWith('shahyog_demo_')) {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success) {
          setUser(res.data.user);
          localStorage.setItem('shahyog_user', JSON.stringify(res.data.user));
        }
      } catch (e) {}
    }
  };

  const getDashboardRoute = (role) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'ngo':
        return '/ngo';
      case 'delivery':
        return '/delivery';
      case 'seller':
        return '/seller';
      default:
        return '/profile';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isCustomer: user?.role === 'customer',
        isSeller: user?.role === 'seller',
        isAdmin: user?.role === 'admin',
        isNgo: user?.role === 'ngo',
        isDelivery: user?.role === 'delivery',
        isPendingPartner: user?.status === 'pending' && ['seller', 'ngo', 'delivery'].includes(user?.role),
        googleLogin,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        getDashboardRoute,
        DEMO_ACCOUNTS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
