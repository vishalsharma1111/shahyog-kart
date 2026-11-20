import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  ArrowRight,
  ShieldCheck,
  Truck,
  Users,
  Sparkles,
  Award,
  ChevronRight,
  BookOpen,
  Shirt,
  Footprints,
  Utensils,
  PenTool,
  Gamepad2,
  Flame,
  Home as HomeIcon,
  Star,
  Quote,
  CheckCircle2
} from 'lucide-react';
import api from '../api/axiosInstance';
import ProductCard from '../components/common/ProductCard';
import ImpactCounter from '../components/common/ImpactCounter';
import Loader from '../components/common/Loader';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);

  const donationCategories = [
    { name: 'Books', icon: BookOpen, desc: 'School curriculum, storybooks, and competitive exams.', color: 'from-blue-500 to-indigo-600', count: '10 Coins/unit' },
    { name: 'Clothes', icon: Shirt, desc: 'Jackets, shirts, trousers, and traditional wear.', color: 'from-purple-500 to-pink-600', count: '20 Coins/unit' },
    { name: 'Shoes', icon: Footprints, desc: 'School shoes, sports sneakers, and sandals.', color: 'from-amber-500 to-orange-600', count: '10 Coins/pair' },
    { name: 'Food', icon: Utensils, desc: 'Packaged rations, pulses, grains, and dry essentials.', color: 'from-emerald-500 to-teal-600', count: 'High Urgency' },
    { name: 'Stationery', icon: PenTool, desc: 'Notebooks, geometry boxes, school bags, and pens.', color: 'from-cyan-500 to-blue-600', count: '3 Coins/unit' },
    { name: 'Toys', icon: Gamepad2, desc: 'Educational puzzles, board games, and soft toys.', color: 'from-rose-500 to-red-600', count: '8 Coins/unit' },
    { name: 'Blankets', icon: Flame, desc: 'Warm winter blankets and thermal quilts.', color: 'from-orange-500 to-amber-700', count: '25 Coins/unit' },
    { name: 'Household Essentials', icon: HomeIcon, desc: 'Utensils, hygiene kits, and home emergency kits.', color: 'from-teal-500 to-emerald-700', count: '15 Coins/unit' }
  ];

  // Strict Zero-Prefilled Data Policy: All business statistics and items are fetched from MySQL API
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [prodRes, catRes, ngoRes] = await Promise.all([
          api.get('/products?limit=8'),
          api.get('/products/categories'),
          api.get('/donations/ngos')
        ]);

        if (prodRes.data?.success) setFeaturedProducts(prodRes.data.products || []);
        if (catRes.data?.success) setCategories(catRes.data.categories || []);
        if (ngoRes.data?.success) setNgos((ngoRes.data.ngos || []).slice(0, 3));
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="space-y-20 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-green-50/70 via-white to-white pt-8 pb-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-green-100/70 border border-brand-green-300 text-brand-green-950 text-xs sm:text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-brand-orange-500 fill-brand-orange-500" />
                <span>India's Conscious Social Commerce & Donation Movement</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 tracking-tight leading-[1.12]">
                Shop with <span className="text-brand-green-900 underline decoration-brand-orange-500 decoration-wavy decoration-2">Purpose</span>, <br className="hidden sm:inline" />
                Donate with <span className="text-brand-orange-500">Love</span>.
              </h1>

              <p className="text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
                Empowering India's rural weavers, potters, organic farmers, and verified NGOs. Every single product you buy channels up to 20% directly into grassroots food relief, child literacy, and women self-help drives.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/shop"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold bg-brand-green-900 hover:bg-brand-green-950 text-white shadow-lg shadow-brand-green-900/25 transition active:scale-95"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Explore Ethical Shop
                </Link>

                <Link
                  to="/donate"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold bg-brand-orange-500 hover:bg-brand-orange-600 text-white shadow-lg shadow-brand-orange-500/25 transition active:scale-95"
                >
                  <Heart className="w-5 h-5 fill-white" />
                  Donate Items & Causes
                </Link>
              </div>

              {/* Guarantees */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-gray-100 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="text-xs font-bold text-gray-900">100% Verified</h6>
                    <p className="text-[11px] text-gray-500">Govt-registered NGOs</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="text-xs font-bold text-gray-900">Doorstep Pickup</h6>
                    <p className="text-[11px] text-gray-500">OTP-verified couriers</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="text-xs font-bold text-gray-900">Reward Coins</h6>
                    <p className="text-[11px] text-gray-500">1 Coin = ₹1 Discount</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual Collage */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="aspect-4/5 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img
                    src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80"
                    alt="Indian artisan at work"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Floating Social Impact Card */}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-green-900 text-white flex items-center justify-center">
                    <Heart className="w-6 h-6 fill-brand-orange-500 text-brand-orange-500 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Automatic Impact</p>
                    <p className="text-sm font-extrabold text-gray-900">5% to 20% Donated</p>
                    <p className="text-[11px] text-brand-green-700 font-semibold">Included in every price</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Platform Impact Metric Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ImpactCounter />
      </section>

      {/* 3. Physical Item Donation Categories (Phase 2 & 3 Core) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange-600">
              Grassroots Relief Program
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 mt-1">
              Essential Items You Can Donate Today
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Free doorstep courier pickup, smart NGO matching, and reward coins for every verified item.
            </p>
          </div>
          <Link
            to="/donate"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-orange-600 hover:underline"
          >
            Start Doorstep Donation <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {donationCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                to={`/donate?category=${encodeURIComponent(cat.name)}`}
                className="group p-5 bg-white rounded-3xl border border-gray-100 shadow-xs hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-brand-green-900 transition">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] font-bold text-brand-orange-600">
                  <span>{cat.count}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Browse by Ethical Product Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green-800">
              Conscious Collections
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 mt-1">
              Curated by Tradition & Sustainability
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-green-900 hover:text-brand-orange-500 transition"
          >
            Browse all categories <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col text-center p-4 hover:-translate-y-1"
            >
              <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50">
                <img
                  src={cat.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h4 className="font-bold text-gray-900 text-sm group-hover:text-brand-green-900 transition">
                {cat.name}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {cat.product_count || 0} products
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Featured Ethical Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-orange-600">
              Trending Social Products
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 mt-1">
              Handcrafted with Love & Purpose
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-green-900 hover:text-brand-orange-500 transition"
          >
            View all products <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <Loader text="Loading conscious goods..." />
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center max-w-xl mx-auto shadow-xs">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">No Products Listed Yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Our marketplace connects rural artisans and social sellers directly. Are you an indigenous artisan or self-help cooperative?
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link to="/register?role=seller" className="px-4 py-2 rounded-xl bg-brand-green-900 text-white font-bold text-xs hover:bg-brand-green-800 transition">
                Register as an Artisan Seller
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 6. How Shahyog Works: The Circular Model */}
      <section className="bg-brand-gray-100 py-16 sm:py-20 rounded-3xl max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-xs uppercase font-extrabold tracking-widest text-brand-green-800">
            Our Circular Impact Model
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-950 mt-2">
            How Shahyog Kart Changes Lives
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mt-2">
            We bridge the gap between ethical consumerism, fair-trade manufacturing, and direct humanitarian relief.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              step: '01',
              title: 'Artisan Creates',
              desc: 'Rural weavers, self-help groups, and organic farmers list authenticated products at dignified pricing.'
            },
            {
              step: '02',
              title: 'You Shop with Purpose',
              desc: 'You select premium handcrafted items. A designated percentage (5%-20%) is locked directly for social good.'
            },
            {
              step: '03',
              title: 'Transparent Transfer',
              desc: 'Funds from every order are automatically pooled and audited into verified NGO cause funds.'
            },
            {
              step: '04',
              title: 'Ground Level Relief',
              desc: 'NGO partners deliver midday meals, school libraries, healthcare kits, and trees with transparent progress logs.'
            }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80 relative">
              <span className="text-4xl font-black text-brand-green-100 absolute top-4 right-4">
                {item.step}
              </span>
              <div className="w-10 h-10 rounded-xl bg-brand-green-900 text-white font-bold flex items-center justify-center mb-4 text-sm">
                {item.step}
              </div>
              <h4 className="font-bold text-gray-900 text-base mb-2">{item.title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Verified NGO Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green-800">
              Grassroots Heroes
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 mt-1">
              Verified NGO Spotlight
            </h2>
          </div>
          <Link
            to="/ngos"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-green-900 hover:text-brand-orange-500 transition"
          >
            Explore all NGOs <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {ngos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ngos.map((ngo) => {
              const percentage = Math.min(100, Math.round((ngo.raised_amount / (ngo.target_amount || 1)) * 100));
              return (
                <div
                  key={ngo.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition"
                >
                  <div>
                    <div className="h-44 overflow-hidden relative bg-gray-100">
                      <img
                        src={ngo.image_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80'}
                        alt={ngo.organization_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-brand-green-950 text-xs font-bold px-2.5 py-1 rounded-full shadow">
                        {ngo.cause_area}
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2">
                        {ngo.organization_name}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                        {ngo.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-brand-green-900">
                            ₹{parseFloat(ngo.raised_amount || 0).toLocaleString('en-IN')} Raised
                          </span>
                          <span className="text-gray-400">
                            Goal: ₹{parseFloat(ngo.target_amount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-green-800 rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-right text-[11px] text-gray-400 font-medium">
                          {percentage}% funded
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Reg: {ngo.registration_number}
                    </span>
                    <Link
                      to={`/donate?ngo=${ngo.id}&title=${encodeURIComponent(ngo.organization_name)}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-xs font-bold shadow-sm transition"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      Donate Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center max-w-xl mx-auto shadow-xs">
            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">No Verified NGOs Listed Yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Non-profit foundations are audited by platform administrators before publication. Registered NGOs can apply below.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link to="/register?role=ngo" className="px-4 py-2 rounded-xl bg-brand-orange-500 text-white font-bold text-xs hover:bg-brand-orange-600 transition">
                Register Your Non-Profit
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 8. Citizen & Beneficiary Transparency Commitment */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase font-extrabold tracking-widest text-brand-orange-600">
            Trust & Integrity Guarantee
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-950 mt-1">
            Built on Real Truth, Not Manufactured Numbers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-green-50 text-brand-green-900 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Cryptographic Delivery Proofs</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Every physical donation handover requires an expiring 6-digit OTP verified in real-time by the recipient NGO representative. No silent handoffs or fake receipts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] font-bold text-brand-green-800 uppercase tracking-wider">
              100% Verified Custody
            </div>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-orange-50 text-brand-orange-600 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Verified Ground Distributions</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Beneficiary counts and distribution records can only be submitted with photographic evidence and timestamps from the ground. Donors can track the journey on their personal dashboard.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] font-bold text-brand-orange-600 uppercase tracking-wider">
              Verifiable Human Impact
            </div>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-green-50 text-brand-green-900 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Zero-Prefilled Data Architecture</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Every rupee raised, order completed, and item received is queried directly from live MySQL records. No simulated users, fabricated reviews, or dummy counters.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] font-bold text-brand-green-800 uppercase tracking-wider">
              True Platform Transparency
            </div>
          </div>
        </div>
      </section>

      {/* 9. Bottom Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-green-900 via-brand-green-950 to-brand-green-900 rounded-3xl p-8 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Make Every Rupee Count?
            </h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Whether you are an ethical shopper, a certified NGO looking for steady fundraising, or an artisan collective desiring direct market access — Shahyog Kart is your home.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                to="/register"
                className="px-6 py-3 rounded-2xl bg-brand-orange-500 hover:bg-brand-orange-600 font-bold text-white shadow-lg shadow-brand-orange-500/25 transition"
              >
                Create Free Account
              </Link>
              <Link
                to="/register?role=seller"
                className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-white transition"
              >
                Join as an Artisan Seller
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
