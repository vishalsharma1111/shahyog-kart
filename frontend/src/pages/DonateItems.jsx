import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Shirt,
  Footprints,
  Utensils,
  Pencil,
  Gamepad2,
  Bed,
  Home,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  MapPin,
  Heart,
  Upload,
  AlertCircle,
  Building,
  Navigation
} from 'lucide-react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const categories = [
  { id: 'Books', label: 'Books', icon: BookOpen, desc: 'Textbooks, storybooks, encyclopedias' },
  { id: 'Clothes', label: 'Clothes', icon: Shirt, desc: 'Clean shirts, pants, winter wear, dresses' },
  { id: 'Shoes', label: 'Shoes', icon: Footprints, desc: 'School shoes, sneakers, sandals' },
  { id: 'Food', label: 'Food', icon: Utensils, desc: 'Dry ration grains, packaged nutritional food' },
  { id: 'Stationery', label: 'Stationery', icon: Pencil, desc: 'Notebooks, pens, geometry sets, art kits' },
  { id: 'Toys', label: 'Toys', icon: Gamepad2, desc: 'Board games, puzzles, educational plush toys' },
  { id: 'Blankets', label: 'Blankets', icon: Bed, desc: 'Warm winter blankets, fleece throws, quilts' },
  { id: 'Household essentials', label: 'Household essentials', icon: Home, desc: 'Utensils, hygiene items, bedsheets' }
];

const cityPresets = [
  { name: 'New Delhi', state: 'Delhi', pincode: '110001', lat: 28.6139, lng: 77.2090 },
  { name: 'Noida / NCR', state: 'Uttar Pradesh', pincode: '201301', lat: 28.5355, lng: 77.3910 },
  { name: 'Mumbai', state: 'Maharashtra', pincode: '400001', lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru', state: 'Karnataka', pincode: '560001', lat: 12.9716, lng: 77.5946 },
  { name: 'Jaipur', state: 'Rajasthan', pincode: '302001', lat: 26.9124, lng: 75.7873 }
];

const DonateItems = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [category, setCategory] = useState('Books');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [condition, setCondition] = useState('Good');
  const [imageUrl, setImageUrl] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [pincode, setPincode] = useState('110001');
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.2090);
  const [donorName, setDonorName] = useState(user?.name || '');
  const [donorEmail, setDonorEmail] = useState(user?.email || '');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultDonation, setResultDonation] = useState(null);
  const [matchedNgos, setMatchedNgos] = useState([]);
  const [offeringId, setOfferingId] = useState(null);
  const [offeredNgoName, setOfferedNgoName] = useState('');

  // Autofill user saved address if available
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/addresses').then((res) => {
        if (res.data.success && res.data.addresses.length > 0) {
          const addr = res.data.addresses.find((a) => a.is_default) || res.data.addresses[0];
          setPickupAddress(addr.street);
          setCity(addr.city);
          setState(addr.state);
          setPincode(addr.postal_code);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleCityPreset = (preset) => {
    setCity(preset.name);
    setState(preset.state);
    setPincode(preset.pincode);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!itemName || !quantity) {
      setErrorMsg('Please specify the item name and quantity.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        item_name: itemName,
        category,
        description,
        quantity: parseInt(quantity, 10),
        condition_type: condition,
        images: imageUrl ? [imageUrl] : [],
        pickup_address: pickupAddress,
        pickup_city: city,
        pickup_state: state,
        pickup_pincode: pincode,
        latitude,
        longitude,
        donor_name: donorName,
        donor_email: donorEmail
      };

      const res = await api.post('/donations/items', payload);
      if (res.data.success) {
        setResultDonation(res.data.donation);
        setMatchedNgos(res.data.recommendedNgos || []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit item donation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOffer = async (ngo) => {
    if (!resultDonation) return;
    try {
      setOfferingId(ngo.ngo_id);
      const res = await api.post(`/donations/items/${resultDonation.id}/offer`, {
        ngoId: ngo.ngo_id,
        requirementId: ngo.requirement_id
      });
      if (res.data.success) {
        setOfferedNgoName(ngo.organization_name);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send donation offer.');
    } finally {
      setOfferingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-gray-100 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-orange-600 bg-brand-orange-50 px-3 py-1 rounded-full border border-brand-orange-200">
            Physical Item Giving Portal
          </span>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight mt-1">
            Donate Usable Physical Goods
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Direct doorstep collection matched with vetted grassroots NGO demands.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/donate"
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            Switch to Monetary Donation
          </Link>
        </div>
      </div>

      {resultDonation ? (
        /* Submission Success & Smart Matching Recommendations */
        <div className="space-y-8 animate-in zoom-in-95 duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-semibold">Donation Submitted</span>
                  <h3 className="text-xl font-black text-gray-900 font-mono">
                    {resultDonation.donation_code}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/donations/track/${resultDonation.donation_code}`}
                  className="px-4 py-2 rounded-xl bg-brand-green-900 text-white text-xs font-bold hover:bg-brand-green-800 transition shadow"
                >
                  Live Status Tracker
                </Link>
              </div>
            </div>

            {/* Donation item summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-brand-gray-100 rounded-2xl text-xs">
              <div>
                <span className="text-gray-400 font-medium">Category</span>
                <p className="font-bold text-gray-900">{resultDonation.category}</p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Item Details</span>
                <p className="font-bold text-gray-900">{resultDonation.item_name}</p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Quantity</span>
                <p className="font-bold text-gray-900">{resultDonation.quantity} units ({resultDonation.condition_type})</p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Pickup City</span>
                <p className="font-bold text-gray-900">{resultDonation.pickup_city}</p>
              </div>
            </div>

            {offeredNgoName && (
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-semibold">
                <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>
                  Donation offer dispatched to <strong>{offeredNgoName}</strong>! The NGO has been notified to review and accept your offer.
                </span>
              </div>
            )}
          </div>

          {/* Smart Matching Recommendations Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-orange-500 animate-pulse" />
              <h2 className="text-xl font-bold text-gray-950">
                Smart NGO Match Recommendations
              </h2>
            </div>
            <p className="text-xs text-gray-500">
              Ranked via our 4-factor algorithm: <strong>Category (40%)</strong>, <strong>Location Proximity (25%)</strong>, <strong>Quantity Match (20%)</strong>, and <strong>Urgency (15%)</strong>.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {matchedNgos.map((ngo, idx) => (
                <div
                  key={ngo.ngo_id}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-brand-green-900 text-white text-xs font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <h3 className="font-black text-gray-900 text-base">
                        {ngo.organization_name}
                      </h3>
                      <span className="text-xs bg-brand-green-50 text-brand-green-800 font-semibold px-2 py-0.5 rounded-full">
                        {ngo.cause_area}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-orange-500" />
                        {ngo.city} ({ngo.distance_km} km away)
                      </span>
                    </div>

                    {/* Reasons breakdown */}
                    <div className="space-y-1 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                      {ngo.match_reasons.map((r, rIdx) => (
                        <div key={rIdx} className="flex items-start gap-1.5">
                          <span className="text-brand-orange-500 font-bold">•</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    {/* Weight scores pill */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">
                        Category: {ngo.scores_breakdown?.category_score}/100
                      </span>
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-semibold">
                        Proximity: {ngo.scores_breakdown?.location_score}/100
                      </span>
                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-semibold">
                        Quantity: {ngo.scores_breakdown?.quantity_score}/100
                      </span>
                      <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md font-semibold">
                        Urgency: {ngo.scores_breakdown?.urgency_score}/100
                      </span>
                    </div>
                  </div>

                  {/* Match Percentage & Offer Action */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-4 flex-shrink-0 pt-4 md:pt-0 border-t md:border-0 border-gray-100">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        Match Score
                      </div>
                      <div className="text-3xl font-black text-brand-green-900">
                        {ngo.final_score}%
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendOffer(ngo)}
                      disabled={offeringId === ngo.ngo_id || offeredNgoName === ngo.organization_name}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md flex items-center gap-1.5 ${
                        offeredNgoName === ngo.organization_name
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-brand-orange-500 hover:bg-brand-orange-600 text-white active:scale-95'
                      }`}
                    >
                      {offeringId === ngo.ngo_id ? (
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : offeredNgoName === ngo.organization_name ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Offer Sent
                        </>
                      ) : (
                        <>
                          Offer to this NGO <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* The Physical Item Donation Form */
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xl space-y-8">
          {/* Step 1: Select Category */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              1. Select Item Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-brand-green-900 bg-brand-green-50 ring-2 ring-brand-green-900 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <IconComponent
                      className={`w-6 h-6 mb-2 ${
                        isSelected ? 'text-brand-orange-500' : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-sm text-gray-900">{cat.label}</div>
                      <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{cat.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Item Details */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              2. Donation Details
            </label>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Item Title / Specific Name *</label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                placeholder="e.g. Primary School Storybooks & Elementary Math Books"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Total Quantity (Pieces / Units) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-brand-green-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Item Usability Condition *</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none bg-white font-medium"
                >
                  <option value="New">Brand New / Unused</option>
                  <option value="Gently Used">Gently Used (Like New)</option>
                  <option value="Good">Good Working Condition</option>
                  <option value="Fair">Fair (Clean & Functional)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Item Photo / Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description & Packing Details</label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                placeholder="Describe bundle details, age group suitability, packaging type..."
              />
            </div>
          </div>

          {/* Step 3: Doorstep Pickup Location */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                3. Doorstep Pickup Address & Proximity
              </label>

              {/* City Presets Chips for Testing */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-gray-400 font-semibold whitespace-nowrap">Quick Location:</span>
                {cityPresets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleCityPreset(p)}
                    className={`px-2 py-0.5 rounded-md border whitespace-nowrap ${
                      city === p.name
                        ? 'bg-brand-green-900 text-white border-brand-green-900 font-bold'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                required
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                placeholder="Flat / House No., Society / Road name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Donor Contact Information */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              4. Donor Contact Details
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                  placeholder="Aarav Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                  placeholder="donor@shahyogkart.com"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl font-bold bg-brand-orange-500 hover:bg-brand-orange-600 text-white shadow-xl shadow-brand-orange-500/25 transition active:scale-95 flex items-center justify-center gap-2 text-base"
          >
            {submitting ? (
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Submit & Calculate Smart NGO Matches
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default DonateItems;
