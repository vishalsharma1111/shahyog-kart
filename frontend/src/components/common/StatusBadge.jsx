import React from 'react';

const statusConfig = {
  // Order statuses
  pending: { label: 'Pending', bg: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmed: { label: 'Confirmed', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  shipped: { label: 'Shipped', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  out_for_delivery: { label: 'Out for Delivery', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
  delivered: { label: 'Delivered', bg: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100 text-red-800 border-red-200' },

  // Partner verification statuses
  approved: { label: 'Verified Partner', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  rejected: { label: 'Verification Rejected', bg: 'bg-rose-100 text-rose-800 border-rose-300' },

  // Payment statuses
  paid: { label: 'Paid', bg: 'bg-green-100 text-green-800 border-green-200' },
  completed: { label: 'Completed', bg: 'bg-green-100 text-green-800 border-green-200' },
  failed: { label: 'Failed', bg: 'bg-red-100 text-red-800 border-red-200' },

  // Roles
  admin: { label: 'Administrator', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
  seller: { label: 'Verified Seller', bg: 'bg-brand-orange-100 text-brand-orange-700 border-brand-orange-200' },
  ngo: { label: 'NGO Partner', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  delivery: { label: 'Delivery Partner', bg: 'bg-sky-100 text-sky-800 border-sky-200' },
  customer: { label: 'Donor & Customer', bg: 'bg-gray-100 text-gray-800 border-gray-200' }
};

const StatusBadge = ({ status, className = '' }) => {
  const normalized = status ? status.toLowerCase() : 'pending';
  const conf = statusConfig[normalized] || {
    label: status || 'Unknown',
    bg: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${conf.bg} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {conf.label}
    </span>
  );
};

export default StatusBadge;
