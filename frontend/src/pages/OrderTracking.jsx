import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Heart,
  ArrowLeft,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import api from '../api/axiosInstance';
import StatusBadge from '../components/common/StatusBadge';
import Loader from '../components/common/Loader';

const OrderTracking = () => {
  const { identifier } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${identifier}`);
        if (res.data.success) {
          setOrder(res.data.order);
        }
      } catch (err) {
        console.error('Failed to load order tracking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [identifier]);

  if (loading) {
    return <Loader fullScreen text="Loading real-time order tracking..." />;
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-gray-100 shadow-sm text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
        <p className="text-xs text-gray-500">We could not locate tracking records for this order ID.</p>
        <Link
          to="/orders"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-green-900 text-white text-xs font-bold"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-brand-green-900 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Orders
      </Link>

      {/* Header Info Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange-600">
            Order Reference
          </span>
          <h1 className="text-2xl font-black text-gray-950 font-mono mt-1">
            {order.order_number}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Placed on{' '}
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} className="text-sm px-3.5 py-1" />
        </div>
      </div>

      {/* Visual Tracking Milestones Stepper */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-sm space-y-8">
        <h3 className="font-bold text-gray-900 text-base">Fulfillment Journey</h3>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
            {order.trackingMilestones?.map((milestone, idx) => {
              const isCompleted = milestone.state === 'completed';
              const isCurrent = milestone.state === 'current';

              return (
                <div key={idx} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-md ${
                      isCompleted
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : isCurrent
                        ? 'bg-brand-orange-500 text-white ring-4 ring-brand-orange-100 animate-pulse'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : idx + 1}
                  </div>

                  <div>
                    <h5
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-brand-orange-600'
                          : isCompleted
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {milestone.label}
                    </h5>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      {milestone.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delivery & Items Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Items in Order */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3">
            Items in this Consignment ({order.items?.length || 0})
          </h3>

          <div className="space-y-4">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-14 h-14 rounded-xl object-cover bg-gray-50 border border-gray-100"
                  />
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">{item.product_name}</h5>
                    <p className="text-xs text-gray-400">
                      Sold by: {item.seller_organization || 'Artisan Partner'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Qty: {item.quantity} × ₹{parseFloat(item.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="text-sm font-extrabold text-gray-900">
                  ₹{parseFloat(item.total).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Shipping Address & Payment Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Shipping destination */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
              <MapPin className="w-4 h-4 text-brand-orange-500" />
              Delivery Destination
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-900">{order.shipping_name}</p>
              <p>{order.street}</p>
              <p>
                {order.city}, {order.state} - {order.postal_code}
              </p>
              <p className="text-gray-500 pt-1">Phone: {order.shipping_phone}</p>
            </div>
          </div>

          {/* Social Impact Note */}
          <div className="bg-gradient-to-br from-brand-green-950 to-brand-green-900 text-white p-6 rounded-3xl shadow-lg space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 fill-brand-orange-500 text-brand-orange-500" />
              <h4 className="font-bold text-sm">Automated Social Impact</h4>
            </div>
            <p className="text-xs text-gray-300">
              ₹{parseFloat(order.donation_amount || 0).toFixed(2)} from this order was channeled to partner grassroots trusts.
            </p>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3 text-xs text-gray-600">
            <h4 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
              Payment Summary
            </h4>
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-semibold text-gray-900">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>GST Tax</span>
              <span className="font-semibold text-gray-900">₹{order.tax}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-semibold text-gray-900">₹{order.shipping_fee}</span>
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline font-bold text-gray-900 text-sm">
              <span>Total Paid</span>
              <span className="text-lg font-black text-gray-950">₹{order.total_amount}</span>
            </div>
            <div className="text-[11px] text-gray-400">
              Payment Mode: <strong className="uppercase">{order.payment_method}</strong> ({order.payment_status})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
