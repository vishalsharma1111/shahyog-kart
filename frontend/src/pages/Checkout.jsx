import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  CreditCard,
  Truck,
  Heart,
  CheckCircle2,
  ShieldCheck,
  Plus,
  AlertCircle,
  Coins,
  Sparkles
} from 'lucide-react';
import api from '../api/axiosInstance';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India'
  });

  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'upi', 'card', 'cod'
  const [availableCoins, setAvailableCoins] = useState(0);
  const [redeemCoins, setRedeemCoins] = useState(false);
  const [coinsToRedeem, setCoinsToRedeem] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const [addrRes, coinRes] = await Promise.all([
          api.get('/addresses').catch(() => ({ data: { success: false } })),
          api.get('/coins/my-wallet').catch(() => ({ data: { success: false } }))
        ]);

        if (addrRes.data?.success) {
          setAddresses(addrRes.data.addresses);
          const defaultAddr = addrRes.data.addresses.find((a) => a.is_default);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          } else if (addrRes.data.addresses.length > 0) {
            setSelectedAddressId(addrRes.data.addresses[0].id);
          } else {
            setShowNewAddressForm(true);
          }
        }

        if (coinRes.data?.success) {
          setAvailableCoins(coinRes.data.availableCoins || 0);
          if (coinRes.data.availableCoins > 0 && cart?.total) {
            setCoinsToRedeem(Math.min(coinRes.data.availableCoins, Math.floor(cart.total)));
          }
        }
      } catch (err) {
        console.error('Error fetching checkout data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, [cart?.total]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedAddressId && !showNewAddressForm) {
      setErrorMsg('Please select or add a delivery address.');
      return;
    }

    if (showNewAddressForm) {
      if (!newAddress.full_name || !newAddress.phone || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.postal_code) {
        setErrorMsg('Please fill in all address fields.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        paymentMethod,
        coinsToRedeem: redeemCoins ? parseInt(coinsToRedeem, 10) : 0,
        ...(showNewAddressForm ? { newAddress } : { addressId: selectedAddressId })
      };

      const res = await api.post('/orders/checkout', payload);
      if (res.data.success) {
        await fetchCart(); // Refresh cart to empty state
        navigate(`/order-success/${res.data.order.orderNumber}`, {
          state: { order: res.data.order }
        });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Preparing secure checkout..." />;
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-gray-100 shadow-lg text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="text-xs text-gray-500">Please add products before checking out.</p>
        <Link
          to="/shop"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-green-900 text-white text-xs font-bold"
        >
          Explore Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">Checkout with Purpose</h1>
        <p className="text-xs text-gray-500 mt-1">
          Review shipping address, select payment, and empower grassroots causes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Address & Payment Selection */}
        <div className="lg:col-span-8 space-y-8">
          {/* Step 1: Shipping Address */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-orange-500" />
                1. Delivery Address
              </h2>
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                  className="text-xs font-bold text-brand-orange-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showNewAddressForm ? 'Use Saved Address' : 'Add New Address'}
                </button>
              )}
            </div>

            {/* Existing Saved Addresses */}
            {!showNewAddressForm && addresses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`block p-4 rounded-2xl border cursor-pointer transition ${
                      selectedAddressId === addr.id
                        ? 'border-brand-green-900 bg-brand-green-50/40 ring-2 ring-brand-green-900'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedAddress"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-gray-900">{addr.full_name}</div>
                        <div className="text-xs text-gray-600">{addr.street}</div>
                        <div className="text-xs text-gray-600">
                          {addr.city}, {addr.state} - {addr.postal_code}
                        </div>
                        <div className="text-xs font-semibold text-gray-500 pt-1">
                          Phone: {addr.phone}
                        </div>
                      </div>
                      {addr.is_default ? (
                        <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* New Address Form */}
            {showNewAddressForm && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newAddress.full_name}
                    onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                    placeholder="Recipient's Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Street / House Address</label>
                  <input
                    type="text"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                    placeholder="Flat 102, Green Avenue, MG Road"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                    placeholder="Bengaluru"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                    placeholder="Karnataka"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">PIN Postal Code</label>
                  <input
                    type="text"
                    value={newAddress.postal_code}
                    onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                    placeholder="560001"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Payment Method */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <CreditCard className="w-5 h-5 text-brand-orange-500" />
              2. Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* UPI */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  paymentMethod === 'upi'
                    ? 'border-brand-green-900 bg-brand-green-50/40 ring-2 ring-brand-green-900'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm text-gray-900">Instant UPI</span>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="text-brand-green-900"
                  />
                </div>
                <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm, or BHIM</p>
              </label>

              {/* Cards */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  paymentMethod === 'card'
                    ? 'border-brand-green-900 bg-brand-green-50/40 ring-2 ring-brand-green-900'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm text-gray-900">Credit / Debit Card</span>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="text-brand-green-900"
                  />
                </div>
                <p className="text-xs text-gray-500">Visa, MasterCard, RuPay, Amex</p>
              </label>

              {/* COD */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  paymentMethod === 'cod'
                    ? 'border-brand-green-900 bg-brand-green-50/40 ring-2 ring-brand-green-900'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm text-gray-900">Cash on Delivery</span>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="text-brand-green-900"
                  />
                </div>
                <p className="text-xs text-gray-500">Pay cash or UPI upon delivery</p>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6 sticky top-28">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3">
              Order Review
            </h3>

            {/* Line items mini preview */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.item_id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <p className="font-bold text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-gray-400">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900">₹{item.itemSubtotal}</span>
                </div>
              ))}
            </div>

            {/* Social Impact Pill */}
            <div className="bg-brand-green-100/60 p-3 rounded-xl border border-brand-green-300 text-xs text-brand-green-950 flex items-center gap-2">
              <Heart className="w-4 h-4 fill-brand-orange-500 text-brand-orange-500 flex-shrink-0" />
              <span>
                <strong>₹{cart.totalDonationValue}</strong> will be channelled to social causes!
              </span>
            </div>

            {/* Shahyog Reward Coins Redemption Section */}
            {availableCoins > 0 && (
              <div className="bg-brand-orange-50/60 p-4 rounded-2xl border border-brand-orange-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-brand-orange-600" />
                    <span className="font-bold text-gray-900">Shahyog Reward Coins</span>
                  </div>
                  <span className="font-bold text-brand-orange-600">
                    {availableCoins} Available (₹{availableCoins})
                  </span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
                  <input
                    type="checkbox"
                    checked={redeemCoins}
                    onChange={(e) => setRedeemCoins(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-orange-500 focus:ring-0"
                  />
                  <span>Redeem coins for instant discount (1 Coin = ₹1)</span>
                </label>

                {redeemCoins && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Coins to apply:</span>
                      <span className="font-bold text-gray-900">{coinsToRedeem} Coins (-₹{coinsToRedeem})</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={Math.min(availableCoins, Math.floor(cart.total))}
                      value={coinsToRedeem}
                      onChange={(e) => setCoinsToRedeem(parseInt(e.target.value, 10) || 0)}
                      className="w-full accent-brand-orange-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Cost breakdown */}
            <div className="space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (5%)</span>
                <span className="font-semibold text-gray-900">₹{cart.estimatedTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-gray-900">
                  {cart.shippingFee === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${cart.shippingFee}`}
                </span>
              </div>
              {redeemCoins && coinsToRedeem > 0 && (
                <div className="flex justify-between text-brand-orange-600 font-bold">
                  <span>Coins Discount ({coinsToRedeem} pts)</span>
                  <span>-₹{coinsToRedeem.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
              <span className="text-sm font-bold text-gray-900">Grand Total</span>
              <span className="text-2xl font-black text-gray-950">
                ₹{Math.max(0, cart.total - (redeemCoins ? coinsToRedeem : 0)).toLocaleString('en-IN')}
              </span>
            </div>

            {errorMsg && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl font-bold bg-brand-orange-500 hover:bg-brand-orange-600 text-white shadow-xl shadow-brand-orange-500/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Place Order with Purpose
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
