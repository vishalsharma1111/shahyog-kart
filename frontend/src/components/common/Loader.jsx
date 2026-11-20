import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ size = 'md', text = 'Loading...', fullScreen = false }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-brand-green-800">
      <Loader2 className={`${sizeMap[size] || sizeMap.md} animate-spin text-brand-orange-500 mb-2`} />
      {text && <p className="text-sm font-medium text-gray-600 animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
