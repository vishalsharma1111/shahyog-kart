import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, isCustomer } = useAuth();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login?redirect=/shop');
      return;
    }

    if (!isCustomer) {
      setErrorMsg('Only customer accounts can purchase items.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    if (isOutOfStock) return;

    setAdding(true);
    const res = await addToCart(product.id, 1);
    setAdding(false);

    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      setErrorMsg(res.message || 'Error adding item');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image & Badges Container */}
      <Link to={`/products/${product.slug || product.id}`} className="relative block aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Social Donation Percentage Badge */}
        <div className="absolute top-3 left-3 bg-brand-green-900/90 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
          <Heart className="w-3 h-3 fill-brand-orange-500 text-brand-orange-500" />
          <span>{product.donation_percentage || 5}% Donated</span>
        </div>

        {/* Stock Status Badge */}
        {isOutOfStock ? (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow">
            Out of Stock
          </div>
        ) : product.stock <= 5 ? (
          <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow">
            Only {product.stock} Left!
          </div>
        ) : null}
      </Link>

      {/* Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-medium text-brand-green-700 uppercase tracking-wider">
              {product.category_name || 'Handcrafted'}
            </span>
            <span className="truncate max-w-[120px]" title={product.seller_organization || 'Artisan Partner'}>
              By {product.seller_organization || 'Artisan Partner'}
            </span>
          </div>

          <Link to={`/products/${product.slug || product.id}`}>
            <h3 className="font-semibold text-gray-900 text-base group-hover:text-brand-green-800 transition line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {product.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400">Price</div>
            <div className="text-lg font-bold text-gray-900">
              ₹{parseFloat(product.price).toLocaleString('en-IN')}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 ${
              added
                ? 'bg-emerald-600 text-white'
                : isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-brand-orange-500 hover:bg-brand-orange-600 text-white shadow-brand-orange-500/20'
            }`}
            title={isOutOfStock ? 'Currently out of stock' : 'Add to cart'}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" /> Added
              </>
            ) : adding ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" /> Add
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
