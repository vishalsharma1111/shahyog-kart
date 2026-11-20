import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { CheckCircle, Heart, ArrowRight, Package, ShoppingBag } from 'lucide-react';

const OrderSuccess = () => {
  const { orderNumber } = useParams();
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-8">
      {/* Success Badge */}
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-75 duration-300">
        <CheckCircle className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-orange-600">
          Order Successfully Placed
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight">
          Thank You for Shopping with Purpose!
        </h1>
        <p className="text-gray-600 text-sm max-w-lg mx-auto">
          Your order has been confirmed and routed to our artisan collectives and verified delivery partners.
        </p>
      </div>

      {/* Details Box */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm text-left space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
          <div>
            <div className="text-xs text-gray-400">Order Reference</div>
            <div className="text-base font-bold text-gray-900 font-mono">{orderNumber}</div>
          </div>
          {order?.transactionId && (
            <div>
              <div className="text-xs text-gray-400">Payment Transaction ID</div>
              <div className="text-xs font-semibold text-gray-700 font-mono">{order.transactionId}</div>
            </div>
          )}
        </div>

        {/* Social Impact Celebration */}
        <div className="bg-brand-green-50 p-4 rounded-2xl border border-brand-green-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green-900 text-white flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 fill-brand-orange-500 text-brand-orange-500" />
          </div>
          <div>
            <h4 className="font-bold text-brand-green-950 text-sm">
              Social Transformation Impact Generated!
            </h4>
            <p className="text-xs text-gray-600">
              {order?.totalDonation
                ? `₹${order.totalDonation} from this checkout has been allocated to grassroots food & education relief.`
                : 'A portion of your checkout has been deposited to verified NGO social relief drives.'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to={`/orders/${orderNumber}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold bg-brand-green-900 text-white hover:bg-brand-green-950 transition shadow-md"
        >
          <Package className="w-4 h-4" /> Track This Order
        </Link>
        <Link
          to="/shop"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 transition"
        >
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
