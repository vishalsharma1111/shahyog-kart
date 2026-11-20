import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('shahyog_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize user from token on app load
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('shahyog_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const googleLogin = async (idToken, targetRole = 'customer', extraData = {}) => {
    const res = await api.post('/auth/google', {
      idToken,
      role: targetRole,
      ...extraData
    });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('shahyog_token', res.data.token);
      localStorage.setItem('shahyog_user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('shahyog_token', res.data.token);
      localStorage.setItem('shahyog_user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('shahyog_token', res.data.token);
      localStorage.setItem('shahyog_user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('shahyog_token');
    localStorage.removeItem('shahyog_user');
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('shahyog_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const refreshUser = async () => {
    if (token) {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('shahyog_user', JSON.stringify(res.data.user));
      }
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
        getDashboardRoute
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
