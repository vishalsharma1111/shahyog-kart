import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  CreditCard,
  Building,
  AlertCircle,
  Truck,
  BookOpen,
  Shirt,
  Footprints,
  Utensils,
  PenTool,
  Gamepad2,
  Flame,
  Home as HomeIcon,
  Upload,
  MapPin,
  Clock,
  Search,
  Award,
  ChevronRight,
  Coins
} from 'lucide-react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

const Donate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState(searchParams.get('mode') === 'monetary' ? 'monetary' : 'items');

  // Tracking code search
  const [trackingSearchCode, setTrackingSearchCode] = useState('');

  // ------------------------------------------------------------------
  // TAB 1: PHYSICAL ITEM DONATION STATE
  // ------------------------------------------------------------------
  const initialCategory = searchParams.get('category') || 'Books';
  const [category, setCategory] = useState(initialCategory);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [conditionType, setConditionType] = useState('Gently Used');
  const [description, setDescription] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState('New Delhi');
  const [pickupState, setPickupState] = useState('Delhi');
  const [pickupPincode, setPickupPincode] = useState('110001');
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.2090);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [createdDonation, setCreatedDonation] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [selectedNgoId, setSelectedNgoId] = useState(null);
  const [offerSuccess, setOfferSuccess] = useState(false);
  const [itemError, setItemError] = useState('');

  // ------------------------------------------------------------------
  // TAB 2: MONETARY DONATION STATE
  // ------------------------------------------------------------------
  const [monetaryNgos, setMonetaryNgos] = useState([]);
  const [targetNgoId, setTargetNgoId] = useState(searchParams.get('ngo') || '');
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState(user?.name || '');
  const [donorEmail, setDonorEmail] = useState(user?.email || '');
  const [causeTitle, setCauseTitle] = useState(searchParams.get('title') || 'General Social Welfare Fund');
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [monetarySubmitting, setMonetarySubmitting] = useState(false);
  const [monetaryReceipt, setMonetaryReceipt] = useState(null);
  const [monetaryError, setMonetaryError] = useState('');

  const quickAmounts = [250, 500, 1000, 2500, 5000];

  const donationCategories = [
    { name: 'Books', icon: BookOpen, reward: '10 Coins/unit', desc: 'School curriculum, storybooks, notebooks' },
    { name: 'Clothes', icon: Shirt, reward: '20 Coins/unit', desc: 'Jackets, woolens, shirts, trousers' },
    { name: 'Shoes', icon: Footprints, reward: '10 Coins/pair', desc: 'School shoes, sport sneakers, slippers' },
    { name: 'Food', icon: Utensils, reward: 'High Priority', desc: 'Packaged grains, pulses, baby nutrition' },
    { name: 'Stationery', icon: PenTool, reward: '3 Coins/unit', desc: 'Geometry boxes, school bags, art kits' },
    { name: 'Toys', icon: Gamepad2, reward: '8 Coins/unit', desc: 'Educational board games, puzzles, toys' },
    { name: 'Blankets', icon: Flame, reward: '25 Coins/unit', desc: 'Winter quilts, bedrolls, wool blankets' },
    { name: 'Household essentials', icon: HomeIcon, reward: '15 Coins/unit', desc: 'Utensils, hygiene items, emergency kits' }
  ];

  useEffect(() => {
    // Load NGOs for monetary donation
    api.get('/donations/ngos').then((res) => {
      if (res.data.success) setMonetaryNgos(res.data.ngos);
    }).catch(console.error);

    // Pre-populate address if user profile has address
    if (user) {
      if (!donorName) setDonorName(user.name || '');
      if (!donorEmail) setDonorEmail(user.email || '');
    }
  }, [user]);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Physical Item Donation (Step 1 -> Creates Donation)
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setItemError('');

    if (!itemName.trim() || !category) {
      setItemError('Item name and category are required.');
      return;
    }
    if (!pickupAddress.trim()) {
      setItemError('Doorstep pickup address is required for courier dispatch.');
      return;
    }

    try {
      setItemSubmitting(true);
      const payload = {
        item_name: itemName.trim(),
        category,
        quantity: parseInt(quantity, 10) || 1,
        condition_type: conditionType,
        description,
        pickup_address: pickupAddress.trim(),
        pickup_city: pickupCity,
        pickup_state: pickupState,
        pickup_pincode: pickupPincode,
        latitude,
        longitude,
        donor_name: user?.name || donorName || 'Kind Donor',
        donor_email: user?.email || donorEmail || 'donor@shahyogkart.com',
        images: imagePreview ? [imagePreview] : []
      };

      const res = await api.post('/donations/items', payload);
      if (res.data.success) {
        const don = res.data.donation;
        setCreatedDonation(don);

        // Fetch smart recommendations immediately
        setMatchingLoading(true);
        try {
          const recRes = await api.get(`/donations/items/${don.id}/recommendations`);
          const recs = recRes.data.recommendations || recRes.data.matches || [];
          setRecommendations(recs);
        } catch (matchErr) {
          console.error('Matching fetch error:', matchErr);
        } finally {
          setMatchingLoading(false);
        }

        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    } catch (err) {
      setItemError(err.response?.data?.message || 'Failed to submit donation. Please try again.');
    } finally {
      setItemSubmitting(false);
    }
  };

  // Dispatch Donation Offer to Selected NGO
  const handleOfferToNgo = async (ngoId) => {
    if (!createdDonation) return;
    try {
      setItemSubmitting(true);
      const res = await api.post(`/donations/items/${createdDonation.id}/offer`, {
        ngo_id: ngoId
      });
      if (res.data.success) {
        setSelectedNgoId(ngoId);
        setOfferSuccess(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send donation offer.');
    } finally {
      setItemSubmitting(false);
    }
  };

  // Submit Monetary Donation
  const handleMonetarySubmit = async (e) => {
    e.preventDefault();
    setMonetaryError('');

    const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      setMonetaryError('Please select or enter a valid donation amount.');
      return;
    }
    if (!donorName || !donorEmail) {
      setMonetaryError('Name and email are required for the 80G tax receipt.');
      return;
    }

    try {
      setMonetarySubmitting(true);
      const res = await api.post('/donations', {
        ngo_id: targetNgoId || null,
        cause_title: causeTitle,
        amount: finalAmount,
        donor_name: donorName,
        donor_email: donorEmail,
        message,
        payment_method: paymentMethod
      });

      if (res.data.success) {
        setMonetaryReceipt(res.data.donation);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setMonetaryError(err.response?.data?.message || 'Donation failed. Please try again.');
    } finally {
      setMonetarySubmitting(false);
    }
  };

  const handleTrackingSearch = (e) => {
    e.preventDefault();
    if (!trackingSearchCode.trim()) return;
    navigate(`/donations/track/${encodeURIComponent(trackingSearchCode.trim())}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Banner */}
      <div className="bg-brand-green-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <span className="text-xs uppercase font-extrabold tracking-widest text-brand-orange-500 flex items-center gap-1.5">
            <Heart className="w-4 h-4 fill-brand-orange-500" />
            Social Impact & Relief Portal
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Donate with Love, Empower Lives.
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Donate essential items with free doorstep pickup or fund verified NGO drives directly. Every verified physical donation awards you Shahyog Coins to redeem on our artisan store!
          </p>

          {/* Quick Tracking Search Bar */}
          <form onSubmit={handleTrackingSearch} className="pt-2 max-w-md flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Track code e.g. SK-DON-20261119-485105"
                value={trackingSearchCode}
                onChange={(e) => setTrackingSearchCode(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs focus:outline-none focus:bg-white focus:text-gray-900 transition"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold text-xs shadow-md transition shrink-0"
            >
              Track
            </button>
          </form>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-gray-100 rounded-2xl border border-gray-200">
          <button
            onClick={() => {
              setActiveTab('items');
              setCreatedDonation(null);
              setOfferSuccess(false);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'items'
                ? 'bg-brand-green-900 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            Donate Physical Items (Doorstep Pickup)
          </button>
          <button
            onClick={() => setActiveTab('monetary')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'monetary'
                ? 'bg-brand-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Heart className="w-4 h-4" />
            Monetary Philanthropy (Tax Deductible 80G)
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: PHYSICAL ITEM DONATION & SMART NGO MATCHING                   */}
      {/* =================================================================== */}
      {activeTab === 'items' && (
        <div className="space-y-8">
          {/* If Offer was dispatched successfully */}
          {offerSuccess ? (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-emerald-200 shadow-xl text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Donation Offer Dispatched!</h2>
              <p className="text-sm text-gray-600">
                Your donation of <strong>{createdDonation.quantity}x {createdDonation.item_name}</strong> has been offered to the selected NGO. Once they accept, a delivery courier will be automatically dispatched to your doorstep.
              </p>
              <div className="p-4 bg-gray-50 rounded-2xl font-mono text-xs text-gray-700 max-w-sm mx-auto">
                Tracking ID: <strong>{createdDonation.donation_code}</strong>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Link
                  to={`/donations/track/${createdDonation.donation_code}`}
                  className="px-6 py-3 rounded-xl bg-brand-green-900 text-white font-bold text-xs hover:bg-brand-green-800 transition"
                >
                  View Live Tracking Journey
                </Link>
                <button
                  onClick={() => {
                    setCreatedDonation(null);
                    setOfferSuccess(false);
                    setItemName('');
                    setDescription('');
                  }}
                  className="px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition"
                >
                  Donate Another Item
                </button>
              </div>
            </div>
          ) : createdDonation ? (
            /* STEP 2 OF PHYSICAL DONATION: SMART MATCHING RECOMMENDATIONS */
            <div className="space-y-6">
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                    Step 2: Smart NGO Recommendations
                  </span>
                  <h3 className="text-xl font-black text-gray-900 mt-0.5">
                    Select Verified NGO for {createdDonation.item_name}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Ranked by our multi-factor formula: <strong>Category (40%) + Location (25%) + Quantity (20%) + Urgency (15%)</strong>.
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
                  ID: {createdDonation.donation_code}
                </div>
              </div>

              {matchingLoading ? (
                <Loader text="Calculating intelligent NGO matching scores..." />
              ) : recommendations.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border border-gray-200 text-center text-gray-400 text-sm">
                  No active NGOs currently matched this criteria. Our admin team will manually review and assign an NGO within 24 hours.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendations.map((rec) => {
                    const bd = rec.scores_breakdown || {};
                    const score = rec.final_score || rec.matching_score || 0;
                    return (
                      <div
                        key={rec.ngo_id || rec.id}
                        className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800">
                              {rec.cause_area || 'Community Relief'}
                            </span>
                            <div className="flex items-center gap-1 text-emerald-700 font-black text-sm">
                              <Sparkles className="w-4 h-4 text-emerald-500" />
                              {score}% Match
                            </div>
                          </div>

                          <h4 className="text-base font-black text-gray-900">{rec.organization_name}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {rec.city}, {rec.state} ({rec.distance_km ? `${rec.distance_km} km away` : 'Regional'})
                          </p>

                          {/* Score Weights Breakdown */}
                          <div className="p-3 bg-gray-50 rounded-2xl space-y-1.5 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Category Match (40%):</span>
                              <strong className="text-gray-800">{bd.category_score || 100}%</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Proximity (25%):</span>
                              <strong className="text-gray-800">{bd.location_score || 85}%</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Quantity Need (20%):</span>
                              <strong className="text-gray-800">{bd.quantity_score || 75}%</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Urgency Priority (15%):</span>
                              <strong className="text-gray-800">{bd.urgency_score || 60}%</strong>
                            </div>
                          </div>

                          {rec.match_reasons && rec.match_reasons.length > 0 && (
                            <p className="text-[11px] text-emerald-800 bg-emerald-50/60 p-2 rounded-xl italic">
                              "{rec.match_reasons[0]}"
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleOfferToNgo(rec.ngo_id || rec.id)}
                          disabled={itemSubmitting}
                          className="mt-5 w-full py-2.5 px-4 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          Send Offer to this NGO <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* STEP 1: PHYSICAL DONATION FORM */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: Category Picker & Benefits */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <h3 className="text-base font-black text-gray-900 mb-2">1. Select Item Category</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {donationCategories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category.toLowerCase() === cat.name.toLowerCase();
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setCategory(cat.name)}
                          className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-brand-green-900 text-white border-brand-green-900 shadow-md'
                              : 'bg-white text-gray-800 border-gray-200 hover:border-brand-green-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-brand-orange-400' : 'text-brand-green-900'}`} />
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-brand-orange-50 text-brand-orange-700'
                            }`}>
                              {cat.reward}
                            </span>
                          </div>
                          <div className="font-bold text-xs">{cat.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reward Coin Promise Banner */}
                <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>Guaranteed Shahyog Reward Coins</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Once the NGO verifies received items with our 6-digit handover OTP, reward coins are credited to your wallet (<strong>1 Coin = ₹1 Discount</strong>).
                  </p>
                </div>
              </div>

              {/* Right: Submission Form */}
              <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-5">
                <h3 className="text-base font-black text-gray-900">2. Item Details & Pickup Location</h3>

                <form onSubmit={handleItemSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Item Description / Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g. 15 NCERT Grade 9 & 10 Mathematics & Science Textbooks"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Quantity (Units/Pairs) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Condition Quality *
                      </label>
                      <select
                        value={conditionType}
                        onChange={(e) => setConditionType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
                      >
                        <option value="New">Brand New / Unused</option>
                        <option value="Gently Used">Gently Used (Good Condition)</option>
                        <option value="Fair">Fair (Fully Usable)</option>
                      </select>
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Supporting Photograph (Condition Inspection)
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-brand-green-800 bg-gray-50/50 transition">
                        <Upload className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-[11px] font-semibold text-gray-600">Click to upload photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shadow-xs"
                        />
                      )}
                    </div>
                  </div>

                  {/* Doorstep Pickup Address */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Doorstep Pickup Address *
                    </label>
                    <textarea
                      rows="2"
                      required
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="Flat/House number, Society/Building name, Landmark"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">City</label>
                      <input
                        type="text"
                        value={pickupCity}
                        onChange={(e) => setPickupCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">State</label>
                      <input
                        type="text"
                        value={pickupState}
                        onChange={(e) => setPickupState(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pincode</label>
                      <input
                        type="text"
                        value={pickupPincode}
                        onChange={(e) => setPickupPincode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                      />
                    </div>
                  </div>

                  {itemError && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{itemError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={itemSubmitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {itemSubmitting ? (
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        Submit & Find Best NGO Match <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: MONETARY DONATION & 80G RECEIPT                               */}
      {/* =================================================================== */}
      {activeTab === 'monetary' && (
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-xl space-y-6">
          {monetaryReceipt ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Donation Confirmed!</h2>
              <p className="text-xs text-gray-600">
                Thank you, <strong>{monetaryReceipt.donor_name}</strong>! Your contribution of <strong>₹{monetaryReceipt.amount}</strong> to <em>"{monetaryReceipt.cause_title}"</em> was successfully processed.
              </p>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 font-mono text-xs text-gray-700 space-y-1">
                <div>Receipt Txn: <strong>{monetaryReceipt.transaction_id}</strong></div>
                <div>80G Tax Deductible Registration Approved</div>
              </div>
              <button
                onClick={() => setMonetaryReceipt(null)}
                className="px-6 py-2.5 rounded-xl bg-brand-green-900 text-white text-xs font-bold"
              >
                Make Another Contribution
              </button>
            </div>
          ) : (
            <form onSubmit={handleMonetarySubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Select Donation Amount (₹)
                </label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition ${
                        selectedAmount === amt && !customAmount
                          ? 'bg-brand-orange-500 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Or enter custom amount in ₹"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Select Cause / Beneficiary NGO
                </label>
                <select
                  value={targetNgoId}
                  onChange={(e) => setTargetNgoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-orange-500 outline-none"
                >
                  <option value="">General Social Welfare Pool (Auto-allocated)</option>
                  {monetaryNgos.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.organization_name} — ({n.cause_area})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Donor Name *</label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-orange-500 outline-none"
                    placeholder="Full name for tax receipt"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-orange-500 outline-none"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {monetaryError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{monetaryError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={monetarySubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {monetarySubmitting ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    Complete ₹{customAmount || selectedAmount} Donation (80G Receipt) <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default Donate;
