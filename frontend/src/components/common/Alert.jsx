import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const alertTypes = {
  success: {
    bg: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle
  },
  error: {
    bg: 'bg-red-50 border-red-200 text-red-800',
    icon: XCircle
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: AlertCircle
  },
  info: {
    bg: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info
  }
};

const Alert = ({ type = 'info', title, message, onClose, className = '' }) => {
  const current = alertTypes[type] || alertTypes.info;
  const IconComponent = current.icon;

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${current.bg} ${className}`}>
      <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        {message && <p>{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
