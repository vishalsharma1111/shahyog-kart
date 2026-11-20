import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Heart,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, loading, updateQuantity, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (loading) {
    return <Loader fullScreen text="Loading your impact cart..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-gray-100 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-brand-green-50 text-brand-green-900 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Sign in to view your cart</h2>
        <p className="text-gray-500 text-sm">
          Please log in to your customer account to save your items and track your social donations.
        </p>
        <Link
          to="/login?redirect=/cart"
          className="inline-block w-full py-3 px-6 rounded-xl font-bold bg-brand-green-900 text-white hover:bg-brand-green-800 transition shadow-md"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-16 p-10 bg-white rounded-3xl border border-gray-100 shadow-md text-center space-y-4">
        <div className="w-20 h-20 bg-brand-orange-50 text-brand-orange-500 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Your Impact Cart is Empty</h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          You haven't added any ethical products yet. Discover handloom apparel, raw organic honey, and terracotta cookware!
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-brand-orange-500 text-white hover:bg-brand-orange-600 transition shadow-lg shadow-brand-orange-500/20"
        >
          Start Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Shopping Cart</h1>
          <p className="text-xs text-gray-500 mt-1">
            Review your purposeful items before proceeding to checkout.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.item_id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <Link
                  to={`/products/${item.slug || item.product_id}`}
                  className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green-800">
                    {item.category_name}
                  </span>
                  <Link
                    to={`/products/${item.slug || item.product_id}`}
                    className="block font-bold text-gray-900 text-sm hover:text-brand-green-900 transition leading-snug line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <div className="text-xs font-semibold text-gray-500">
                    ₹{item.price.toLocaleString('en-IN')} each
                  </div>
                  <div className="text-[11px] font-medium text-brand-green-700 flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-brand-orange-500 text-brand-orange-500" />
                    <span>Funds ₹{item.donationAccrued} to charity</span>
                  </div>
                </div>
              </div>

              {/* Quantity Controls & Total */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                <div className="flex items-center border border-gray-200 rounded-xl bg-white">
                  <button
                    onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                    className="p-1.5 text-gray-500 hover:text-gray-900 transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-gray-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <div className="text-sm font-extrabold text-gray-900">
                    ₹{item.itemSubtotal.toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.item_id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Order Summary & Impact Card */}
        <div className="lg:col-span-4 space-y-6 sticky top-28">
          {/* Social Impact Card */}
          <div className="bg-gradient-to-br from-brand-green-950 to-brand-green-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-orange-500 flex items-center justify-center text-white font-bold">
                  <Heart className="w-4 h-4 fill-white" />
                </div>
                <h3 className="font-bold text-base">Your Cart's Social Impact</h3>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed">
                By purchasing these items, you are contributing a total of:
              </p>
              <div className="text-3xl font-black text-brand-orange-400">
                ₹{cart.totalDonationValue.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-gray-300">
                Directly channelled to verified NGO partners for food relief and tribal education.
              </p>
            </div>
          </div>

          {/* Checkout Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span className="font-semibold text-gray-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST Tax (5%)</span>
                <span className="font-semibold text-gray-900">₹{cart.estimatedTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="font-semibold text-gray-900">
                  {cart.shippingFee === 0 ? (
                    <span className="text-green-600 font-bold">FREE</span>
                  ) : (
                    `₹${cart.shippingFee}`
                  )}
                </span>
              </div>

              {cart.subtotal < 500 && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg">
                  Add items worth ₹{(500 - cart.subtotal).toFixed(2)} more for Free Shipping!
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
              <span className="text-sm font-bold text-gray-900">Grand Total</span>
              <span className="text-2xl font-black text-gray-950">
                ₹{cart.total.toLocaleString('en-IN')}
              </span>
            </div>

            <Link
              to="/checkout"
              className="w-full py-3.5 px-6 rounded-2xl font-bold bg-brand-orange-500 hover:bg-brand-orange-600 text-white shadow-lg shadow-brand-orange-500/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-green-800" />
              <span>Safe & Secure 256-bit Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
