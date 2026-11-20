import React, { useState, useEffect } from 'react';
import {
  Building,
  Layers,
  Heart,
  TrendingUp,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  Package,
  MapPin,
  Share2,
  FileText,
  AlertCircle,
  Truck,
  Users,
  Edit2,
  Trash2,
  Sparkles,
  KeyRound
} from 'lucide-react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

const ALL_CATEGORIES = [
  'Books',
  'Clothes',
  'Shoes',
  'Food',
  'Stationery',
  'Toys',
  'Blankets',
  'Household essentials'
];

const NgoDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [ngo, setNgo] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [incomingOffers, setIncomingOffers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [reports, setReports] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  // Campaign Modal State
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    fundraising_goal: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    photographs: ''
  });

  // Requirement Modal State
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [reqForm, setReqForm] = useState({
    item_category: 'Books',
    item_name: '',
    required_quantity: 50,
    priority: 'Urgent',
    description: '',
    required_date: ''
  });

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingDonationId, setRejectingDonationId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Physical Receipt Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receivingDonationId, setReceivingDonationId] = useState(null);
  const [receiptForm, setReceiptForm] = useState({
    condition_verified: 'Good',
    notes: '',
    requirement_id: ''
  });

  // Arriving Deliveries & OTP State
  const [arrivingDeliveries, setArrivingDeliveries] = useState([]);

  // Distribution Modal State
  const [isDistModalOpen, setIsDistModalOpen] = useState(false);
  const [distForm, setDistForm] = useState({
    inventory_id: '',
    beneficiary_group: '',
    beneficiary_count: 10,
    location: '',
    quantity_distributed: 10,
    distributed_date: new Date().toISOString().slice(0, 10),
    notes: '',
    supporting_photographs: ''
  });

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    organization_name: '',
    contact_person: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    latitude: 28.6139,
    longitude: 77.2090,
    accepted_categories: [],
    capacity_limit: 1000,
    description: '',
    website: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const loadAllNgoData = async () => {
    try {
      setLoading(true);
      const [overviewRes, reqRes, offersRes, invRes, distRes, repRes, arrivingRes, campRes] = await Promise.all([
        api.get('/ngo/overview'),
        api.get('/ngo/requirements'),
        api.get('/ngo/incoming-donations'),
        api.get('/ngo/inventory'),
        api.get('/ngo/distributions'),
        api.get('/ngo/reports'),
        api.get('/ngo/deliveries/arriving').catch(() => ({ data: { success: false } })),
        api.get('/fundraising/my-campaigns').catch(() => ({ data: { success: false } }))
      ]);

      if (overviewRes.data.success) {
        setNgo(overviewRes.data.ngo);
        setMetrics(overviewRes.data.metrics);
        // Sync profile form
        const n = overviewRes.data.ngo;
        let cats = [];
        try {
          cats = typeof n.accepted_categories === 'string' ? JSON.parse(n.accepted_categories) : (n.accepted_categories || []);
        } catch (e) {}
        setProfileForm({
          organization_name: n.organization_name || '',
          contact_person: n.contact_person || '',
          phone: n.phone || '',
          address: n.address || '',
          city: n.city || '',
          state: n.state || '',
          latitude: n.latitude || 28.6139,
          longitude: n.longitude || 77.2090,
          accepted_categories: cats,
          capacity_limit: n.capacity_limit || 1000,
          description: n.description || '',
          website: n.website || ''
        });
      }
      if (reqRes.data.success) setRequirements(reqRes.data.requirements);
      if (offersRes.data.success) setIncomingOffers(offersRes.data.offers);
      if (invRes.data.success) setInventory(invRes.data.inventory);
      if (distRes.data.success) setDistributions(distRes.data.distributions);
      if (repRes.data.success) setReports(repRes.data.reports);
      if (arrivingRes.data?.success) setArrivingDeliveries(arrivingRes.data.deliveries);
      if (campRes.data?.success) setCampaigns(campRes.data.campaigns || []);
    } catch (err) {
      console.error('Error loading NGO dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllNgoData();
  }, []);

  // --- Requirements Actions ---
  const handleOpenAddReq = () => {
    setEditingReq(null);
    setReqForm({
      item_category: 'Books',
      item_name: '',
      required_quantity: 50,
      priority: 'Urgent',
      description: '',
      required_date: ''
    });
    setIsReqModalOpen(true);
  };

  const handleSaveRequirement = async (e) => {
    e.preventDefault();
    try {
      if (editingReq) {
        await api.put(`/ngo/requirements/${editingReq.id}`, reqForm);
      } else {
        await api.post('/ngo/requirements', reqForm);
      }
      setIsReqModalOpen(false);
      loadAllNgoData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save requirement.');
    }
  };

  const handleDeleteRequirement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this requirement?')) return;
    try {
      await api.delete(`/ngo/requirements/${id}`);
      loadAllNgoData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete requirement.');
    }
  };

  // --- Incoming Offer Actions ---
  const handleAcceptDonation = async (donationId) => {
    try {
      const res = await api.post(`/ngo/donations/${donationId}/respond`, { decision: 'accept' });
      alert(res.data.message);
      loadAllNgoData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept donation.');
    }
  };

  const handleOpenRejectModal = (donationId) => {
    setRejectingDonationId(donationId);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingDonationId) return;
    try {
      await api.post(`/ngo/donations/${rejectingDonationId}/respond`, {
        decision: 'reject',
        rejection_reason: rejectionReason
      });
      setIsRejectModalOpen(false);
      loadAllNgoData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to decline donation.');
    }
  };

  // --- Receipt Logging Action ---
  const handleOpenReceiptModal = (donationId) => {
    setReceivingDonationId(donationId);
    setReceiptForm({
      condition_verified: 'Good',
      notes: '',
      requirement_id: ''
    });
    setIsReceiptModalOpen(true);
  };

  const handleSaveReceipt = async (e) => {
    e.preventDefault();
    if (!receivingDonationId) return;
    try {
      const res = await api.post(`/ngo/donations/${receivingDonationId}/receipt`, receiptForm);
      alert(`Receipt recorded! Number: ${res.data.receipt?.receiptNumber}`);
      setIsReceiptModalOpen(false);
      loadAllNgoData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log receipt.');
    }
  };

  // --- Distribution Logging Action ---
  const handleSaveDistribution = async (e) => {
    e.preventDefault();
    try {
      const photos = distForm.supporting_photographs
        ? distForm.supporting_photographs.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const res = await api.post('/ngo/distributions', {
        ...distForm,
        beneficiary_count: parseInt(distForm.beneficiary_count, 10) || 1,
        supporting_photographs: photos
      });
      alert(res.data.message);
      setIsDistModalOpen(false);
      loadAllNgoData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log distribution.');
    }
  };

  // --- Campaign Create Action ---
  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/fundraising/my-campaigns', {
        ...campaignForm,
        fundraising_goal: parseFloat(campaignForm.fundraising_goal)
      });
      alert(res.data?.message || 'Campaign created successfully!');
      setIsCampaignModalOpen(false);
      setCampaignForm({
        title: '',
        description: '',
        fundraising_goal: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        photographs: ''
      });
      loadAllNgoData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create fundraising campaign.');
    }
  };

  // --- Profile Save Action ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileMsg('');
      const res = await api.put('/ngo/profile', profileForm);
      if (res.data.success) {
        setProfileMsg('Organization profile updated successfully!');
        setTimeout(() => setProfileMsg(''), 3000);
        loadAllNgoData();
      }
    } catch (err) {
      setProfileMsg('Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleCategorySelection = (cat) => {
    const current = profileForm.accepted_categories || [];
    if (current.includes(cat)) {
      setProfileForm({ ...profileForm, accepted_categories: current.filter((c) => c !== cat) });
    } else {
      setProfileForm({ ...profileForm, accepted_categories: [...current, cat] });
    }
  };

  if (loading) {
    return <Loader fullScreen text="Loading NGO mission control..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-green-800">
            Grassroots Organization Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight mt-1">
            {ngo?.organization_name || 'NGO Management Dashboard'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Reg: <strong className="font-mono text-gray-700">{ngo?.registration_number}</strong> •{' '}
            {ngo?.city}, {ngo?.state}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status="approved" />
          <button
            onClick={handleOpenAddReq}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Publish Requirement
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-2 scrollbar-none text-xs sm:text-sm font-bold">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'deliveries', label: `Arriving Couriers & OTPs (${arrivingDeliveries.length})` },
          { id: 'fundraising', label: `Fundraising (${campaigns.length})` },
          { id: 'requirements', label: `Requirements (${requirements.length})` },
          { id: 'incoming', label: `Incoming Offers (${incomingOffers.filter((o) => o.offer_status === 'Offered').length})` },
          { id: 'inventory', label: `Inventory (${inventory.length})` },
          { id: 'distribution', label: `Distributions (${distributions.length})` },
          { id: 'reports', label: 'Reports & Analytics' },
          { id: 'profile', label: 'Organization Profile' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-brand-green-900 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-orange-100 text-brand-orange-600 flex items-center justify-center mb-3">
                <Heart className="w-5 h-5 fill-brand-orange-600" />
              </div>
              <div className="text-2xl font-black text-gray-950">{metrics?.activeRequirements || 0}</div>
              <div className="text-xs font-semibold text-gray-500">Active Demand Requirements</div>
              <div className="text-[10px] text-gray-400 mt-1">{metrics?.totalRemainingUnits} units still needed</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-purple-700">{metrics?.incomingOffersCount || 0}</div>
              <div className="text-xs font-semibold text-gray-500">Incoming Matched Offers</div>
              <div className="text-[10px] text-gray-400 mt-1">Pending review & acceptance</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-green-100 text-brand-green-900 flex items-center justify-center mb-3">
                <Package className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-gray-950">{metrics?.inventoryInStock || 0}</div>
              <div className="text-xs font-semibold text-gray-500">Units in Facility Stock</div>
              <div className="text-[10px] text-gray-400 mt-1">Ready for beneficiary distribution</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-emerald-700">{metrics?.totalDistributedUnits || 0}</div>
              <div className="text-xs font-semibold text-gray-500">Items Distributed</div>
              <div className="text-[10px] text-gray-400 mt-1">Across {metrics?.distributionDrives || 0} delivery drives</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <Heart className="w-5 h-5 fill-amber-700" />
              </div>
              <div className="text-2xl font-black text-amber-700">₹{Number(metrics?.verifiedFundsReceived || 0).toLocaleString('en-IN')}</div>
              <div className="text-xs font-semibold text-gray-500">Verified Funds Raised</div>
              <div className="text-[10px] text-gray-400 mt-1">{campaigns.length} campaigns active</div>
            </div>
          </div>

          {/* Quick Incoming Offers Preview */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-orange-500" />
                Latest Matched Donations Offered to Your NGO
              </h3>
              <button
                onClick={() => setActiveTab('incoming')}
                className="text-xs font-bold text-brand-green-900 hover:underline"
              >
                View All ({incomingOffers.length})
              </button>
            </div>

            {incomingOffers.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                No active donation offers waiting at this moment. You will be automatically matched as donors submit usable items!
              </p>
            ) : (
              <div className="space-y-3">
                {incomingOffers.slice(0, 3).map((off) => (
                  <div
                    key={off.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-gray-900 text-sm">{off.item_name}</span>
                        <span className="bg-brand-green-100 text-brand-green-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {off.category}
                        </span>
                        <span className="text-gray-400 font-mono">({off.donation_code})</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Quantity: <strong>{off.quantity} units</strong> ({off.condition_type}) • Pickup: {off.pickup_city}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {off.offer_status === 'Offered' ? (
                        <>
                          <button
                            onClick={() => handleAcceptDonation(off.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                          >
                            Accept Offer
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(off.id)}
                            className="px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300 transition"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <StatusBadge status={off.status} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: ARRIVING DELIVERIES & HANDOVER OTPS */}
      {activeTab === 'deliveries' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Arriving Couriers & Verification Security OTPs</h3>
              <p className="text-xs text-gray-500">
                When a social delivery partner arrives at your facility gate with donated goods, share the 6-digit OTP code below to confirm safe receipt and trigger donor reward coins.
              </p>
            </div>

            {arrivingDeliveries.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 space-y-2">
                <Truck className="w-10 h-10 text-gray-300 mx-auto" />
                <p>No delivery couriers are currently en route to your center.</p>
                <p className="text-[11px] text-gray-400">
                  Deliveries appear here automatically once a delivery partner accepts an accepted donation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {arrivingDeliveries.map((del) => (
                  <div key={del.id} className="bg-gray-50/70 p-6 rounded-3xl border border-gray-200 space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-brand-green-950">{del.assignment_code}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {del.status}
                        </span>
                      </div>
                      <h4 className="font-black text-gray-950 text-base">{del.package_item_name}</h4>
                      <div className="text-xs text-gray-500">
                        {del.package_quantity}x ({del.package_category}) • Donor: <strong>{del.donor_name}</strong> ({del.pickup_city})
                      </div>
                      <div className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-200">
                        <p><strong>Courier:</strong> {del.driver_name} ({del.driver_phone})</p>
                        <p className="text-[11px] text-gray-400">{del.vehicle_type} - {del.vehicle_number}</p>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">
                          Handover Security Code (OTP)
                        </span>
                        <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-950 tracking-widest">
                          {del.otp_code || 'Generated on Arrival'}
                        </span>
                        {del.otp_expires_at && (
                          <span className="text-[10px] text-emerald-600 block mt-0.5">
                            Valid until {new Date(del.otp_expires_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-800 bg-white px-3 py-1.5 rounded-xl font-bold shadow-xs border border-emerald-200">
                        Share with driver
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: NGO FUNDRAISING CAMPAIGNS */}
      {activeTab === 'fundraising' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Verified Fundraising Campaigns</h3>
              <p className="text-xs text-gray-500">
                Amounts raised are calculated strictly from verified online payments. Zero prefilled or simulated funds.
              </p>
            </div>
            <button
              onClick={() => setIsCampaignModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-green-900 text-white font-bold text-xs hover:bg-brand-green-800 transition shadow"
            >
              + Create Campaign
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500 space-y-3">
              <Heart className="w-10 h-10 text-gray-300 mx-auto" />
              <h4 className="text-base font-bold text-gray-900">No fundraising campaigns have been created yet.</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Launch a verified humanitarian campaign with a transparent goal. Verified donors can contribute directly.
              </p>
              <button
                onClick={() => setIsCampaignModalOpen(true)}
                className="px-5 py-2 rounded-xl bg-brand-green-900 text-white font-bold text-xs hover:bg-brand-green-800 transition shadow"
              >
                + Create Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((camp) => (
                <div key={camp.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-brand-green-900">ID #{camp.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {camp.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-base">{camp.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{camp.description}</p>
                    
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-emerald-700 font-bold">
                          ₹{Number(camp.amount_raised || 0).toLocaleString('en-IN')} Raised
                        </span>
                        <span className="text-gray-400">
                          Goal: ₹{Number(camp.fundraising_goal || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${camp.progress_percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-400 pt-0.5">
                        <span>Remaining: ₹{Number(camp.remaining_amount || 0).toLocaleString('en-IN')}</span>
                        <span>{camp.donor_count || 0} Verified Donors</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 text-[11px] text-gray-400 flex items-center justify-between">
                    <span>{camp.start_date?.split('T')[0]} to {camp.end_date?.split('T')[0]}</span>
                    <span className="font-bold text-brand-green-900">Verified Payment Ledger</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NGO REQUIREMENTS */}
      {activeTab === 'requirements' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Published Item Demands</h3>
              <p className="text-xs text-gray-500">
                Published requirements receive top priority in our 4-factor matching algorithm (100% Category match rating). Remaining quantities auto-update upon verified receipts.
              </p>
            </div>
            <button
              onClick={handleOpenAddReq}
              className="px-4 py-2 rounded-xl bg-brand-orange-500 text-white font-bold text-xs hover:bg-brand-orange-600 transition shadow"
            >
              + Post New Requirement
            </button>
          </div>

          {requirements.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500 space-y-3">
              <Package className="w-10 h-10 text-gray-300 mx-auto" />
              <h4 className="text-base font-bold text-gray-900">No donation requirements have been created yet.</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Publishing supply demands allows donors and our smart algorithm to route matching donations directly to your foundation.
              </p>
              <button
                onClick={handleOpenAddReq}
                className="px-5 py-2 rounded-xl bg-brand-orange-500 text-white font-bold text-xs hover:bg-brand-orange-600 transition shadow"
              >
                + Create Requirement
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Item Demand</th>
                    <th className="py-3 px-4">Needed</th>
                    <th className="py-3 px-4">Received</th>
                    <th className="py-3 px-4">Remaining</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requirements.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-brand-green-900">{r.item_category}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{r.item_name}</div>
                        <div className="text-[10px] text-gray-400 line-clamp-1">{r.description}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">{r.required_quantity}</td>
                      <td className="py-3.5 px-4 text-emerald-700 font-bold">{r.received_quantity}</td>
                      <td className="py-3.5 px-4">
                        <span className={`font-black ${r.remaining_quantity > 0 ? 'text-brand-orange-600' : 'text-gray-400'}`}>
                          {r.remaining_quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            r.priority === 'Urgent'
                              ? 'bg-red-100 text-red-700'
                              : r.priority === 'High'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {r.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleDeleteRequirement(r.id)}
                          className="text-gray-400 hover:text-red-600 transition p-1"
                          title="Delete requirement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INCOMING DONATIONS */}
      {activeTab === 'incoming' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-base">Incoming Matched Donation Offers</h3>
            <p className="text-xs text-gray-500">
              Review and respond to donations matched by algorithm. Donations will not be scheduled for collection until accepted by your NGO.
            </p>
          </div>

          {incomingOffers.length === 0 ? (
            <p className="text-xs text-gray-400 py-10 text-center">No incoming donation offers at this time.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {incomingOffers.map((off) => (
                <div
                  key={off.id}
                  className="p-5 rounded-3xl border border-gray-200 bg-white hover:shadow-lg transition flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-gray-950 text-base">{off.item_name}</h4>
                      <span className="bg-brand-green-100 text-brand-green-900 font-bold text-xs px-2.5 py-0.5 rounded-full">
                        {off.category}
                      </span>
                      <StatusBadge status={off.status} />
                    </div>

                    <p className="text-xs text-gray-600">
                      Quantity: <strong>{off.quantity} units</strong> • Condition: <strong>{off.condition_type}</strong>
                    </p>

                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-orange-500" />
                      Pickup: {off.pickup_address}, {off.pickup_city} - {off.pickup_pincode}
                    </p>

                    {off.description && (
                      <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg">
                        "{off.description}"
                      </p>
                    )}

                    {off.images && off.images.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        {off.images.map((img, i) => (
                          <img key={i} src={img} alt="" className="w-12 h-12 rounded-xl object-cover border" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions based on status */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {off.offer_status === 'Offered' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptDonation(off.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition"
                        >
                          Accept Donation Offer
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(off.id)}
                          className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition"
                        >
                          Decline
                        </button>
                      </div>
                    ) : off.status === 'NGO Accepted' || off.status === 'Collected' ? (
                      <button
                        onClick={() => handleOpenReceiptModal(off.id)}
                        className="px-4 py-2 rounded-xl bg-brand-green-900 hover:bg-brand-green-950 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" /> Log Verified Physical Receipt
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-gray-400">
                        Status: {off.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Facility Inventory Stock</h3>
              <p className="text-xs text-gray-500">
                All physical items officially received and verified at NGO premises.
              </p>
            </div>
            <button
              onClick={() => setIsDistModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow"
            >
              + Log Distribution Drive
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Total Received</th>
                  <th className="py-3 px-4">Distributed</th>
                  <th className="py-3 px-4">Available In Stock</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-brand-green-900">{inv.category}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{inv.item_name}</td>
                    <td className="py-3.5 px-4">{inv.quantity}</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">{inv.distributed_quantity}</td>
                    <td className="py-3.5 px-4 font-black text-brand-orange-600 text-sm">
                      {inv.available_quantity}
                    </td>
                    <td className="py-3.5 px-4">{inv.condition_type}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'In Stock'
                            ? 'bg-green-100 text-green-800'
                            : inv.status === 'Partially Distributed'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DISTRIBUTION MANAGEMENT */}
      {activeTab === 'distribution' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Beneficiary Distribution History</h3>
              <p className="text-xs text-gray-500">
                Track direct aid handover sessions to slum schools, destitutes, and shelters.
              </p>
            </div>
            <button
              onClick={() => setIsDistModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow"
            >
              + Log New Distribution
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Beneficiary Group</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Items / Category</th>
                  <th className="py-3 px-4">Quantity Handed Over</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {distributions.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4 font-mono text-gray-500">{d.distributed_date}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{d.beneficiary_group}</td>
                    <td className="py-3.5 px-4 text-gray-600">{d.location}</td>
                    <td className="py-3.5 px-4 font-semibold text-brand-green-900">
                      {d.item_name || 'Assorted Category Aid'}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                      {d.quantity_distributed} units
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{d.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-base">Impact Breakdown by Category</h3>
              <div className="space-y-3">
                {reports?.categoryBreakdown?.map((c) => (
                  <div key={c.category} className="p-3 bg-gray-50 rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{c.category}</span>
                      <span>{c.totalUnitsReceived} units received</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-[11px]">
                      <span>Distributed: {c.totalUnitsDistributed}</span>
                      <span className="font-semibold text-brand-green-800">In Stock: {c.totalUnitsInStock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outreach Locations */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-base">Top Beneficiary Communities</h3>
              <div className="space-y-3">
                {reports?.distributionLocations?.map((loc, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-2xl text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">{loc.beneficiary_group}</p>
                      <p className="text-[11px] text-gray-500">{loc.location}</p>
                    </div>
                    <span className="font-black text-emerald-700 text-sm">{loc.unitsDelivered} units</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ORGANIZATION PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-3xl space-y-6">
          <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3">
            Organization Profile & Proximity Coordinates
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.organization_name}
                  onChange={(e) => setProfileForm({ ...profileForm, organization_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  required
                  value={profileForm.contact_person}
                  onChange={(e) => setProfileForm({ ...profileForm, contact_person: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Facility Capacity Limit (Units)</label>
                <input
                  type="number"
                  value={profileForm.capacity_limit}
                  onChange={(e) => setProfileForm({ ...profileForm, capacity_limit: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Facility Address</label>
              <input
                type="text"
                required
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={profileForm.latitude}
                  onChange={(e) => setProfileForm({ ...profileForm, latitude: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={profileForm.longitude}
                  onChange={(e) => setProfileForm({ ...profileForm, longitude: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs outline-none"
                />
              </div>
            </div>

            {/* Accepted Categories Checkable Chips */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Accepted Physical Donation Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const isChecked = profileForm.accepted_categories?.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCategorySelection(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        isChecked
                          ? 'bg-brand-green-900 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat} {isChecked ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            {profileMsg && (
              <div className="text-xs text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-200">
                {profileMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-2.5 rounded-xl bg-brand-green-900 text-white font-bold text-xs shadow hover:bg-brand-green-950 transition"
            >
              {profileSaving ? 'Saving...' : 'Update Organization Settings'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL 1: Add/Edit Requirement */}
      <Modal
        isOpen={isReqModalOpen}
        onClose={() => setIsReqModalOpen(false)}
        title={editingReq ? 'Edit Requirement' : 'Publish NGO Item Demand'}
      >
        <form onSubmit={handleSaveRequirement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Item Category *</label>
            <select
              value={reqForm.item_category}
              onChange={(e) => setReqForm({ ...reqForm, item_category: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-green-900 outline-none bg-white"
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Item Name / Specific Requirement *</label>
            <input
              type="text"
              required
              value={reqForm.item_name}
              onChange={(e) => setReqForm({ ...reqForm, item_name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              placeholder="e.g. Primary School Storybooks in Hindi & English"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Required Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={reqForm.required_quantity}
                onChange={(e) => setReqForm({ ...reqForm, required_quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-brand-green-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Urgency Priority *</label>
              <select
                value={reqForm.priority}
                onChange={(e) => setReqForm({ ...reqForm, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-green-900 outline-none bg-white"
              >
                <option value="Urgent">Urgent (Immediate relief)</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Target Fulfillment Date</label>
            <input
              type="date"
              value={reqForm.required_date}
              onChange={(e) => setReqForm({ ...reqForm, required_date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
            <textarea
              rows="2"
              value={reqForm.description}
              onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              placeholder="Explain how this demand aids community beneficiaries..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReqModalOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold text-xs shadow transition"
            >
              {editingReq ? 'Update' : 'Publish Requirement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Reject Donation Offer */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Decline Donation Offer"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <p className="text-xs text-gray-600">
            Declining this donation will return it to the matching pool so another suitable NGO partner can accept it.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Rejection *</label>
            <textarea
              rows="3"
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-red-600 outline-none"
              placeholder="e.g. Storage capacity currently reached, or lack of transport in this sector..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow transition"
            >
              Decline Offer
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Log Verified Physical Receipt */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Verify & Log Physical Donation Intake"
      >
        <form onSubmit={handleSaveReceipt} className="space-y-4">
          <p className="text-xs text-gray-600">
            Confirming physical receipt will automatically generate an official NGO Receipt number, add items to NGO Inventory, and update matching requirement remaining balances.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Audited Usability Condition *</label>
            <select
              value={receiptForm.condition_verified}
              onChange={(e) => setReceiptForm({ ...receiptForm, condition_verified: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-green-900 outline-none bg-white"
            >
              <option value="New">Brand New / Unopened</option>
              <option value="Gently Used">Gently Used (Like New)</option>
              <option value="Good">Good Verified Working Condition</option>
              <option value="Fair">Fair Usability</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Link to Requirement (Optional)</label>
            <select
              value={receiptForm.requirement_id}
              onChange={(e) => setReceiptForm({ ...receiptForm, requirement_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none bg-white"
            >
              <option value="">Auto-match active requirement by category</option>
              {requirements.filter((r) => r.status === 'Active').map((r) => (
                <option key={r.id} value={r.id}>
                  {r.item_name} ({r.remaining_quantity} remaining)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Inspection Notes</label>
            <textarea
              rows="2"
              value={receiptForm.notes}
              onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              placeholder="e.g. 50 books received in clean condition, placed in Room 2 library racks..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-green-900 hover:bg-brand-green-950 text-white font-bold text-xs shadow transition"
            >
              Issue Verified Receipt & Intake Items
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Log Distribution to Beneficiaries */}
      <Modal
        isOpen={isDistModalOpen}
        onClose={() => setIsDistModalOpen(false)}
        title="Log Beneficiary Distribution Drive"
      >
        <form onSubmit={handleSaveDistribution} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Select Inventory Stock Batch *</label>
            <select
              required
              value={distForm.inventory_id}
              onChange={(e) => setDistForm({ ...distForm, inventory_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-green-900 outline-none bg-white"
            >
              <option value="">Choose available inventory batch...</option>
              {inventory.filter((inv) => inv.available_quantity > 0).map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.item_name} ({inv.category}) — {inv.available_quantity} available
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Beneficiary Group / Community *</label>
            <input
              type="text"
              required
              value={distForm.beneficiary_group}
              onChange={(e) => setDistForm({ ...distForm, beneficiary_group: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              placeholder="e.g. Yamuna Khadar Slum Primary Students"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Distribution Location *</label>
              <input
                type="text"
                required
                value={distForm.location}
                onChange={(e) => setDistForm({ ...distForm, location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
                placeholder="East Delhi Slum Shelter"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Units Handed Over *</label>
              <input
                type="number"
                min="1"
                required
                value={distForm.quantity_distributed}
                onChange={(e) => setDistForm({ ...distForm, quantity_distributed: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-brand-green-900 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Beneficiary Count *</label>
              <input
                type="number"
                min="1"
                required
                value={distForm.beneficiary_count}
                onChange={(e) => setDistForm({ ...distForm, beneficiary_count: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-brand-green-900 outline-none"
                placeholder="e.g. 25 people"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Drive Date *</label>
              <input
                type="date"
                required
                value={distForm.distributed_date}
                onChange={(e) => setDistForm({ ...distForm, distributed_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Supporting Photographs (Image URLs)</label>
            <input
              type="text"
              value={distForm.supporting_photographs}
              onChange={(e) => setDistForm({ ...distForm, supporting_photographs: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              placeholder="https://images.unsplash.com/..., https://..."
            />
            <span className="text-[10px] text-gray-400 mt-1 block">
              Comma-separated public photographic proof URLs of actual handover.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Session Notes / Observations</label>
            <textarea
              rows="2"
              value={distForm.notes}
              onChange={(e) => setDistForm({ ...distForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              placeholder="e.g. Distributed during afternoon remedial session..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDistModalOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition"
            >
              Confirm Distribution
            </button>
          </div>
        </form>
      </Modal>
      {/* 5. CREATE FUNDRAISING CAMPAIGN MODAL */}
      <Modal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        title="Launch Verified Fundraising Campaign"
      >
        <form onSubmit={handleSaveCampaign} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Campaign Title *</label>
            <input
              type="text"
              required
              value={campaignForm.title}
              onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-brand-green-900 outline-none"
              placeholder="e.g. Winter Quilts for Slum Children 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description & Objective *</label>
            <textarea
              required
              rows="3"
              value={campaignForm.description}
              onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              placeholder="Detail the cause, beneficiary group, target location, and item distribution plan..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Goal (₹) *</label>
              <input
                type="number"
                min="1000"
                step="100"
                required
                value={campaignForm.fundraising_goal}
                onChange={(e) => setCampaignForm({ ...campaignForm, fundraising_goal: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-brand-green-900 outline-none"
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={campaignForm.start_date}
                onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={campaignForm.end_date}
                onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Supporting Photographs / Banner URL</label>
            <input
              type="text"
              value={campaignForm.photographs}
              onChange={(e) => setCampaignForm({ ...campaignForm, photographs: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
              placeholder="https://res.cloudinary.com/... or public image URL"
            />
          </div>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-800">
            <strong>Transparency Notice:</strong> Campaign funds raised will be calculated strictly from verified payment gateway transactions. Simulated funds or manual adjustments are strictly prohibited.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCampaignModalOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold text-xs shadow transition"
            >
              Publish Campaign
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NgoDashboard;
