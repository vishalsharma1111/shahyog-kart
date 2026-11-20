import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, X, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../api/axiosInstance';
import ProductCard from '../components/common/ProductCard';
import Loader from '../components/common/Loader';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load Categories once
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/products/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (e) {
        console.error('Failed to load categories:', e);
      }
    };
    fetchCats();
  }, []);

  // Fetch Products whenever filters change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (inStockOnly) params.append('inStock', 'true');
        if (sort) params.append('sort', sort);

        setSearchParams(params, { replace: true });

        const res = await api.get(`/products?${params.toString()}`);
        if (res.data.success) {
          setProducts(res.data.products);
          setTotalCount(res.data.pagination.total);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [search, selectedCategory, minPrice, maxPrice, inStockOnly, sort]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSort('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Search Bar */}
      <div className="bg-brand-green-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs uppercase font-extrabold tracking-widest text-brand-orange-500">
            Conscious Marketplace
          </span>
          <h1 className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
            Shop Products with Purpose
          </h1>
          <p className="text-gray-300 text-sm mt-2">
            Every handcrafted item supports Indian artisanal families and channels up to 20% to verified social causes.
          </p>

          {/* Search Bar */}
          <div className="mt-6 relative flex items-center">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search handloom kurta, pure honey, terracotta clay, plantable pens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange-500 shadow-md"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-brand-green-900 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.slug
                ? 'bg-brand-green-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat.name} ({cat.product_count || 0})
          </button>
        ))}
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 sticky top-28">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-green-900" />
              Filter Catalog
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-orange-600 hover:underline font-semibold"
            >
              Reset All
            </button>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Price Range (₹)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              />
            </div>
          </div>

          {/* In Stock Only */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-green-900 focus:ring-brand-green-800"
              />
              <span>In Stock Available Only</span>
            </label>
          </div>

          {/* Ethical Guarantee Box */}
          <div className="bg-brand-green-50/70 p-4 rounded-2xl border border-brand-green-200 text-xs text-brand-green-950 space-y-1">
            <p className="font-bold">🌱 Social Impact Pledge</p>
            <p className="text-gray-600 leading-relaxed">
              Every item has an automated charity allocation displayed right on the card.
            </p>
          </div>
        </div>

        {/* Products Grid & Sorting Header */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sorting Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-500 font-medium">
              Showing <strong className="text-gray-900">{products.length}</strong> of{' '}
              <strong className="text-gray-900">{totalCount}</strong> conscious products
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="sort-select" className="text-xs font-bold text-gray-500 whitespace-nowrap">
                Sort By:
              </label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-green-900 outline-none cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="popular">Popular Impact</option>
              </select>
            </div>
          </div>

          {/* Product Listing */}
          {loading ? (
            <div className="py-20">
              <Loader text="Loading purposeful catalog..." />
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No matching products found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Try clearing your search keyword, adjusting the price range, or selecting a different category.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition"
                >
                  Reset All Filters
                </button>
                <Link
                  to="/register?role=seller"
                  className="px-5 py-2.5 rounded-xl bg-brand-green-900 text-white text-xs font-bold hover:bg-brand-green-800 transition"
                >
                  Become a Seller
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
