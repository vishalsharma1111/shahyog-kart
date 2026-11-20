import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  Heart,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Clock,
  AlertCircle,
  Box,
  ExternalLink,
  Coins
} from 'lucide-react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import Loader from '../components/common/Loader';

const Profile = () => {
  const { user, updateProfile, refreshUser } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [donations, setDonations] = useState([]);
  const [itemDonations, setItemDonations] = useState([]);
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [orgName, setOrgName] = useState(user?.organization_name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Add Address modal / inline
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    full_name: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    is_default: false
  });

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [addrRes, donRes, itemRes, coinRes] = await Promise.all([
        api.get('/addresses').catch(() => ({ data: { success: false } })),
        api.get('/donations/my').catch(() => ({ data: { success: false } })),
        api.get('/donations/items/my').catch(() => ({ data: { success: false } })),
        api.get('/coins/my-wallet').catch(() => ({ data: { success: false } }))
      ]);

      if (addrRes.data?.success) setAddresses(addrRes.data.addresses);
      if (donRes.data?.success) setDonations(donRes.data.donations);
      if (itemRes.data?.success) setItemDonations(itemRes.data.donations);
      if (coinRes.data?.success) setCoinBalance(coinRes.data.availableCoins || 0);
    } catch (err) {
      console.error('Error loading profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      setSavingProfile(true);
      const res = await updateProfile({
        name,
        phone,
        organization_name: orgName
      });
      if (res.success) {
        setProfileMsg('Profile updated successfully!');
        setTimeout(() => setProfileMsg(''), 3000);
      }
    } catch (err) {
      setProfileMsg('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/addresses', newAddr);
      if (res.data.success) {
        setShowAddressForm(false);
        setNewAddr({
          full_name: user?.name || '',
          phone: user?.phone || '',
          street: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'India',
          is_default: false
        });
        loadProfileData();
      }
    } catch (err) {
      console.error('Failed to add address:', err);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/addresses/${id}`);
      loadProfileData();
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await api.patch(`/addresses/${id}/default`);
      loadProfileData();
    } catch (err) {
      console.error('Failed to set default address:', err);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Loading user profile..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-green-900 text-white flex items-center justify-center font-black text-2xl shadow-md">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-950">{user?.name}</h1>
              <StatusBadge status={user?.role} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
            {user?.organization_name && (
              <p className="text-xs font-semibold text-brand-green-800 mt-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> {user.organization_name}
              </p>
            )}
          </div>
        </div>

        {/* Verification Status Pill */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1 sm:text-right">
          <div className="text-xs text-gray-400">Account Compliance Status</div>
          <div>
            <StatusBadge status={user?.status} />
          </div>
        </div>
      </div>

      {/* Shahyog Reward Coins Balance Card */}
      <div className="bg-gradient-to-r from-brand-orange-500 via-amber-500 to-brand-orange-500 text-white rounded-3xl p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">{coinBalance}</span>
              <span className="text-sm font-bold text-orange-100">Shahyog Coins (Worth ₹{coinBalance})</span>
            </div>
            <p className="text-xs text-orange-100 mt-0.5">
              Redeemable for instant discounts during cart checkout (1 Coin = ₹1).
            </p>
          </div>
        </div>

        <Link
          to="/rewards"
          className="px-5 py-2.5 rounded-xl bg-white text-brand-orange-600 font-bold text-xs shadow hover:bg-orange-50 transition whitespace-nowrap self-stretch sm:self-auto text-center"
        >
          View Coin Ledger & Rules →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Edit Profile Form */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3">
            Profile Details
          </h3>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-400 cursor-not-allowed outline-none"
              />
              <span className="text-[10px] text-gray-400">Email cannot be modified directly.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                placeholder="+91 9876543210"
              />
            </div>

            {user?.role !== 'customer' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Organization / Collective Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                />
              </div>
            )}

            {profileMsg && (
              <div className="text-xs text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-200">
                {profileMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-3 px-6 rounded-xl font-bold bg-brand-green-900 hover:bg-brand-green-950 text-white text-xs shadow-md transition"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Right: Saved Addresses & Donation History */}
        <div className="lg:col-span-7 space-y-8">
          {/* Saved Addresses Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-orange-500" />
                Saved Delivery Addresses ({addresses.length})
              </h3>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="text-xs font-bold text-brand-green-900 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address
              </button>
            </div>

            {/* Add Address Form */}
            {showAddressForm && (
              <form onSubmit={handleAddAddress} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <h4 className="text-xs font-bold text-gray-900">Add New Shipping Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={newAddr.full_name}
                    onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })}
                    className="p-2 border rounded-xl outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Phone"
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                    className="p-2 border rounded-xl outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Street / House details"
                    value={newAddr.street}
                    onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                    className="p-2 border rounded-xl outline-none sm:col-span-2"
                  />
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="p-2 border rounded-xl outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={newAddr.state}
                    onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                    className="p-2 border rounded-xl outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="PIN Code"
                    value={newAddr.postal_code}
                    onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })}
                    className="p-2 border rounded-xl outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-brand-green-900 text-white text-xs font-bold"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}

            {/* List addresses */}
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{addr.full_name}</span>
                      {addr.is_default ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Default Address
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-brand-green-900 hover:underline text-[10px] font-semibold"
                        >
                          Make Default
                        </button>
                      )}
                    </div>
                    <p className="text-gray-600">{addr.street}</p>
                    <p className="text-gray-600">
                      {addr.city}, {addr.state} - {addr.postal_code}
                    </p>
                    <p className="text-gray-400">Phone: {addr.phone}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Personal Donations Ledger */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2 border-b border-gray-100 pb-3">
              <Heart className="w-4 h-4 text-brand-orange-500 fill-brand-orange-500" />
              Direct Philanthropic Contributions ({donations.length})
            </h3>

            {donations.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                No direct donations recorded yet. Every contribution makes a tangible difference!
              </p>
            ) : (
              <div className="space-y-3">
                {donations.map((don) => (
                  <div
                    key={don.id}
                    className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{don.cause_title}</p>
                      <p className="text-[11px] text-gray-400 font-mono">Txn: {don.transaction_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-brand-orange-600 text-sm">
                        ₹{parseFloat(don.amount).toLocaleString('en-IN')}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-700">Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Physical Item Donations */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Box className="w-4 h-4 text-brand-green-900" />
                Physical Item Donations ({itemDonations.length})
              </h3>
              <Link
                to="/donate/items"
                className="text-xs font-bold text-brand-orange-600 hover:text-brand-orange-700 flex items-center gap-1"
              >
                + Donate Goods
              </Link>
            </div>

            {itemDonations.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <h4 className="text-sm font-bold text-gray-900">You haven't submitted any donations yet.</h4>
                <p className="text-xs text-gray-400">
                  Donate surplus books, clothes, shoes, food, or blankets to verified NGOs in your area.
                </p>
                <Link
                  to="/donate/items"
                  className="inline-block px-4 py-1.5 rounded-xl bg-brand-green-900 text-white text-xs font-bold hover:bg-brand-green-800 transition shadow"
                >
                  Donate Items
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {itemDonations.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{item.item_name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-brand-green-100 text-brand-green-900 text-[10px] font-bold uppercase">
                          {item.item_category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                          Qty: {item.quantity}
                        </span>
                      </div>
                      <p className="text-gray-500 text-[11px] font-mono">
                        Tracking ID: <strong>{item.tracking_code}</strong>
                      </p>
                      <p className="text-gray-400 text-[11px]">
                        Condition: {item.item_condition} • Location: {item.pickup_city}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {item.status}
                      </span>
                      <Link
                        to={`/donations/track/${item.tracking_code}`}
                        className="px-3 py-1.5 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        Track Status
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
