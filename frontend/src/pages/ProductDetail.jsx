import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Building
} from 'lucide-react';
import api from '../api/axiosInstance';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import ProductCard from '../components/common/ProductCard';

const ProductDetail = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, isCustomer } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${identifier}`);
        if (res.data.success) {
          setProduct(res.data.product);
          setRelated(res.data.related || []);
          setQuantity(1);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [identifier]);

  if (loading) {
    return <Loader fullScreen text="Loading product details..." />;
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">The requested product could not be found or has been deactivated.</p>
        <Link
          to="/shop"
          className="px-6 py-2.5 rounded-xl bg-brand-green-900 text-white text-sm font-semibold hover:bg-brand-green-800 transition"
        >
          Back to Shop Catalog
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const unitPrice = parseFloat(product.price);
  const donationPercentage = product.donation_percentage || 5;
  const donationValue = ((unitPrice * quantity * donationPercentage) / 100).toFixed(2);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/products/${identifier}`);
      return;
    }

    if (!isCustomer) {
      setErrorMsg('Only customer accounts can purchase products.');
      return;
    }

    if (isOutOfStock) return;

    setAdding(true);
    setErrorMsg('');
    const res = await addToCart(product.id, quantity);
    setAdding(false);

    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } else {
      setErrorMsg(res.message || 'Error adding item to cart.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back Link */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-green-900 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Shop
      </Link>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Product Image */}
        <div className="lg:col-span-6 bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-lg aspect-square relative">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'}
            alt={product.name}
            className="w-full h-full object-cover object-center"
          />

          <div className="absolute top-4 left-4 bg-brand-green-950/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 fill-brand-orange-500 text-brand-orange-500" />
            <span>{donationPercentage}% Donated to Social Relief</span>
          </div>
        </div>

        {/* Right: Product Info & Buy Box */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-green-800 mb-1">
              <span>{product.category_name}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-gray-500">
                <Building className="w-3.5 h-3.5" />
                {product.seller_organization || product.seller_name}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-950 tracking-tight leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing & Impact Ticker */}
          <div className="bg-brand-gray-100 p-5 rounded-2xl border border-gray-200/80 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-gray-950">
                ₹{unitPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-500 font-medium">inclusive of all taxes</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-brand-green-900 bg-brand-green-100/70 p-2.5 rounded-xl border border-brand-green-300">
              <Heart className="w-4 h-4 fill-brand-orange-500 text-brand-orange-500 flex-shrink-0" />
              <span>
                <strong>Your Social Impact:</strong> Buying {quantity} of this product automatically funds{' '}
                <strong className="text-brand-orange-600">₹{donationValue}</strong> directly into verified partner NGOs.
              </span>
            </div>
          </div>

          {/* Stock Indicator */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {isOutOfStock ? (
              <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                Currently Out of Stock
              </span>
            ) : product.stock <= 5 ? (
              <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                Hurry, only {product.stock} units remaining!
              </span>
            ) : (
              <span className="text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                In Stock ({product.stock} units available)
              </span>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 text-sm text-gray-600 leading-relaxed border-t border-b border-gray-100 py-4">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
              About This Handcrafted Piece
            </h4>
            <p>{product.description}</p>
          </div>

          {/* Quantity Management & Add to Cart */}
          {!isOutOfStock && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Quantity:
                </span>
                <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-gray-500 hover:text-gray-900 disabled:opacity-30"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="p-2 text-gray-500 hover:text-gray-900 disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm shadow-lg transition active:scale-95 flex items-center justify-center gap-2 ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : 'bg-brand-orange-500 hover:bg-brand-orange-600 text-white shadow-brand-orange-500/25'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-5 h-5" /> Added to Your Impact Cart!
                    </>
                  ) : adding ? (
                    <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" /> Add to Cart (₹{(unitPrice * quantity).toLocaleString('en-IN')})
                    </>
                  )}
                </button>
              </div>

              {errorMsg && (
                <div className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Social Guarantee Badges */}
          <div className="grid grid-cols-2 gap-3 pt-4 text-xs text-gray-500">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <ShieldCheck className="w-4 h-4 text-brand-green-800" />
              <span>Certified Handcrafted & Fair Trade</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <Truck className="w-4 h-4 text-brand-green-800" />
              <span>Free Delivery Above ₹500</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="border-t border-gray-100 pt-10">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            More Conscious Goods in This Category
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
