import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState(null);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'customer') {
      setCart(null);
      setItemCount(0);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.data.success) {
        setCart(res.data.cart);
        setItemCount(res.data.cart.itemCount || 0);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      return { success: false, requireLogin: true };
    }
    try {
      const res = await api.post('/cart/items', { productId, quantity });
      if (res.data.success) {
        await fetchCart();
      }
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Could not add product to cart.'
      };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await api.put(`/cart/items/${itemId}`, { quantity });
      if (res.data.success) {
        await fetchCart();
      }
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update quantity.'
      };
    }
  };

  const removeItem = async (itemId) => {
    try {
      const res = await api.delete(`/cart/items/${itemId}`);
      if (res.data.success) {
        await fetchCart();
      }
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to remove item.'
      };
    }
  };

  const clearCart = async () => {
    try {
      const res = await api.delete('/cart');
      if (res.data.success) {
        setCart(null);
        setItemCount(0);
      }
      return res.data;
    } catch (err) {
      return { success: false, message: 'Failed to clear cart.' };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
