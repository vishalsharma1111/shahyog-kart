import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  ArrowRight,
  User,
  Star,
  RefreshCw,
  Navigation
} from 'lucide-react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import StatusBadge from '../components/common/StatusBadge';

const DeliveryDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('active'); // 'active', 'available', 'history'
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [availablePickups, setAvailablePickups] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);

  // OTP Modal State
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  // Status updating state
  const [updatingId, setUpdatingId] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, availRes, activeRes, histRes] = await Promise.all([
        api.get('/delivery/overview'),
        api.get('/delivery/available-pickups'),
        api.get('/delivery/my-deliveries?filter=active'),
        api.get('/delivery/my-deliveries?filter=completed')
      ]);

      if (overviewRes.data.success) {
        setPartner(overviewRes.data.partner);
        setMetrics(overviewRes.data.metrics);
      }
      if (availRes.data.success) {
        setAvailablePickups(availRes.data.pickupRequests);
      }
      if (activeRes.data.success) {
        setActiveDeliveries(activeRes.data.deliveries);
      }
      if (histRes.data.success) {
        setCompletedDeliveries(histRes.data.deliveries);
      }
    } catch (err) {
      console.error('Error loading delivery dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Accept a pickup request
  const handleAcceptPickup = async (pickupId) => {
    try {
      const res = await api.post(`/delivery/pickups/${pickupId}/accept`);
      alert(res.data.message || 'Pickup accepted! Trip assigned to you.');
      setActiveTab('active');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept pickup request.');
    }
  };

  // Update status along the progression
  const handleStatusProgression = async (assignmentId, newStatus) => {
    try {
      setUpdatingId(assignmentId);
      const res = await api.patch(`/delivery/assignments/${assignmentId}/status`, {
        status: newStatus
      });
      loadDashboardData();
      if (newStatus === 'Arrived at NGO') {
        // Open OTP verification modal automatically
        const target = activeDeliveries.find((d) => d.id === assignmentId);
        if (target) {
          handleOpenOtpModal(target);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update delivery status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Open OTP Modal
  const handleOpenOtpModal = (delivery) => {
    setSelectedAssignment(delivery);
    setOtpInput('');
    setOtpError('');
    setOtpSuccess(null);
    setIsOtpModalOpen(true);
  };

  // Submit OTP Verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!selectedAssignment || !otpInput || otpInput.trim().length !== 6) {
      setOtpError('Please enter a complete 6-digit OTP.');
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError('');
      const res = await api.post(`/delivery/assignments/${selectedAssignment.id}/verify-otp`, {
        otp: otpInput.trim()
      });

      setOtpSuccess(res.data);
      setTimeout(() => {
        setIsOtpModalOpen(false);
        loadDashboardData();
      }, 2500);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'OTP Verification failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Request fresh OTP
  const handleRequestFreshOtp = async () => {
    if (!selectedAssignment) return;
    try {
      const res = await api.post(`/delivery/assignments/${selectedAssignment.id}/request-otp`);
      alert(res.data.message || 'Fresh OTP dispatched to NGO.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to regenerate OTP.');
    }
  };

  if (loading) {
    return <Loader fullScreen text="Connecting to Shahyog Social Logistics Fleet..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Bar */}
      <div className="bg-gradient-to-r from-brand-green-950 via-brand-green-900 to-brand-green-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-brand-green-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-orange-500/20 border border-brand-orange-400/30 flex items-center justify-center text-brand-orange-400">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">{user?.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Social Courier
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1">
              Vehicle: <strong>{partner?.vehicle_type}</strong> • Reg: <strong>{partner?.vehicle_number}</strong> • Operating City: <strong>{partner?.current_city}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
          <div className="text-center px-3">
            <div className="flex items-center justify-center gap-1 text-brand-orange-400 font-black text-lg">
              <Star className="w-4 h-4 fill-brand-orange-400" />
              {partner?.rating || '4.95'}
            </div>
            <p className="text-[10px] text-gray-300 uppercase tracking-wider font-bold">Driver Rating</p>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="text-center px-3">
            <div className="text-white font-black text-lg">{metrics?.completedDeliveries || 0}</div>
            <p className="text-[10px] text-gray-300 uppercase tracking-wider font-bold">Deliveries Completed</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-brand-orange-100 text-brand-orange-600 flex items-center justify-center mb-2">
            <Navigation className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-gray-950">{metrics?.activeTrips || 0}</div>
          <div className="text-xs font-semibold text-gray-500">Active Trips in Progress</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
            <Package className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-purple-700">{metrics?.availablePickups || 0}</div>
          <div className="text-xs font-semibold text-gray-500">Available Pickup Requests</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-brand-green-100 text-brand-green-900 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-gray-950">{metrics?.completedDeliveries || 0}</div>
          <div className="text-xs font-semibold text-gray-500">Completed NGO Deliveries</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-blue-700">100%</div>
          <div className="text-xs font-semibold text-gray-500">OTP Handover Compliance</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-brand-green-900 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Navigation className="w-4 h-4" />
          Active Deliveries ({activeDeliveries.length})
        </button>

        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'available'
              ? 'bg-brand-green-900 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package className="w-4 h-4" />
          Available Pickups ({availablePickups.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-brand-green-900 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Trip History ({completedDeliveries.length})
        </button>
      </div>

      {/* TAB 1: ACTIVE DELIVERIES */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {activeDeliveries.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-4">
              <Truck className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-bold text-gray-900">No Active Trips Assigned</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                You have no active deliveries in progress. Check available pickup requests to accept a new doorstep donation trip!
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="px-5 py-2.5 rounded-xl bg-brand-green-900 text-white font-bold text-xs"
              >
                Browse Available Pickups
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {activeDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-brand-green-950">
                          {delivery.assignment_code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-orange-100 text-brand-orange-800 uppercase">
                          {delivery.package_category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                          Qty: {delivery.package_quantity}
                        </span>
                      </div>
                      <h3 className="font-black text-gray-900 text-lg mt-1">{delivery.package_item_name}</h3>
                      <p className="text-xs text-gray-400 font-mono">Donation Code: {delivery.donation_code}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Status: {delivery.status}
                      </span>
                    </div>
                  </div>

                  {/* Route & Locations: Donor -> NGO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/70 p-5 rounded-2xl border border-gray-100 text-xs">
                    {/* Pickup Point */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                        <MapPin className="w-4 h-4 text-brand-orange-500" />
                        Step 1: Donor Pickup Location
                      </div>
                      <p className="font-semibold text-gray-800">{delivery.donor_name}</p>
                      <p className="text-gray-600">{delivery.pickup_address}, {delivery.pickup_city}</p>
                      <p className="text-gray-500 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {delivery.donor_phone}
                      </p>
                    </div>

                    {/* Dropoff Point */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        Step 2: NGO Destination Center
                      </div>
                      <p className="font-semibold text-gray-800">{delivery.ngo_name}</p>
                      <p className="text-gray-600">{delivery.ngo_address}, {delivery.ngo_city}</p>
                      <p className="text-emerald-700 font-semibold flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5" /> Requires 6-digit NGO OTP on handover
                      </p>
                    </div>
                  </div>

                  {/* Action Bar based on current status */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="text-xs text-gray-500">
                      Accepted: {new Date(delivery.accepted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {delivery.status === 'Assigned' && (
                        <button
                          disabled={updatingId === delivery.id}
                          onClick={() => handleStatusProgression(delivery.id, 'Out for Pickup')}
                          className="px-4 py-2 rounded-xl bg-brand-green-900 text-white font-bold text-xs hover:bg-brand-green-800 transition flex items-center gap-1.5"
                        >
                          Heading to Donor Step
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {delivery.status === 'Out for Pickup' && (
                        <button
                          disabled={updatingId === delivery.id}
                          onClick={() => handleStatusProgression(delivery.id, 'Collected')}
                          className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Goods Collected from Donor
                        </button>
                      )}

                      {delivery.status === 'Collected' && (
                        <button
                          disabled={updatingId === delivery.id}
                          onClick={() => handleStatusProgression(delivery.id, 'Out for Delivery')}
                          className="px-4 py-2 rounded-xl bg-brand-green-900 text-white font-bold text-xs hover:bg-brand-green-800 transition flex items-center gap-1.5"
                        >
                          En Route to NGO Center
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {delivery.status === 'Out for Delivery' && (
                        <button
                          disabled={updatingId === delivery.id}
                          onClick={() => handleStatusProgression(delivery.id, 'Arrived at NGO')}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition flex items-center gap-1.5"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Arrived at NGO Facility
                        </button>
                      )}

                      {delivery.status === 'Arrived at NGO' && (
                        <button
                          onClick={() => handleOpenOtpModal(delivery)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center gap-2 animate-bounce"
                        >
                          <KeyRound className="w-4 h-4" />
                          Verify Delivery with NGO OTP
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AVAILABLE PICKUPS */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          {availablePickups.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-gray-900">All Pickups Assigned!</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No open pickup requests are currently pending in your operating territory. New requests arrive as soon as NGOs accept donations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availablePickups.map((pickup) => (
                <div
                  key={pickup.id}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-gray-400">{pickup.request_code}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        pickup.priority === 'Urgent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-brand-green-100 text-brand-green-900'
                      }`}>
                        {pickup.priority} Priority
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-gray-950 text-base">{pickup.package_item_name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="font-semibold text-gray-900">{pickup.package_category}</span>
                        <span>•</span>
                        <span>Qty: <strong>{pickup.package_quantity}</strong> units</span>
                        <span>•</span>
                        <span>Condition: {pickup.item_condition || 'Good'}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-gray-400 font-semibold block text-[10px] uppercase">Doorstep Pickup:</span>
                        <p className="font-medium text-gray-800">{pickup.pickup_address}, {pickup.pickup_city}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block text-[10px] uppercase">Destination NGO:</span>
                        <p className="font-medium text-emerald-800 font-bold">{pickup.ngo_name} ({pickup.ngo_city})</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptPickup(pickup.id)}
                    className="w-full py-2.5 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold text-xs shadow transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    Accept Pickup & Start Trip
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRIP HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">Completed Social Delivery Records</h3>
            <p className="text-xs text-gray-500">Every delivery directly impacts children and communities across India.</p>
          </div>

          {completedDeliveries.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">
              No completed deliveries in your history yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-100">
                  <tr>
                    <th className="p-4">Trip Code</th>
                    <th className="p-4">Package</th>
                    <th className="p-4">Donor Pickup</th>
                    <th className="p-4">Delivered NGO</th>
                    <th className="p-4">Completed On</th>
                    <th className="p-4">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {completedDeliveries.map((del) => (
                    <tr key={del.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-mono font-bold text-brand-green-950">{del.assignment_code}</td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{del.package_item_name}</div>
                        <div className="text-[11px] text-gray-400">{del.package_quantity}x ({del.package_category})</div>
                      </td>
                      <td className="p-4 text-gray-600">{del.pickup_city}</td>
                      <td className="p-4 font-bold text-gray-900">{del.ngo_name}</td>
                      <td className="p-4 text-gray-500">
                        {del.delivered_at ? new Date(del.delivered_at).toLocaleDateString('en-IN') : 'Completed'}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          OTP Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* OTP VERIFICATION MODAL */}
      {isOtpModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-gray-950">Handover OTP Verification</h3>
              <p className="text-xs text-gray-500">
                Ask the authorized representative at <strong>{selectedAssignment.ngo_name}</strong> for their 6-digit security code.
              </p>
            </div>

            {otpSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">{otpSuccess.message}</p>
                <p className="text-xs text-emerald-700">
                  🎉 {otpSuccess.coinsAwarded} Shahyog Coins credited to donor {otpSuccess.donorName}!
                </p>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {otpError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase text-center tracking-wider">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono font-black p-3.5 border-2 border-gray-200 rounded-2xl focus:border-emerald-600 focus:ring-0 outline-none"
                  />
                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    Valid for 15 minutes • Max 5 attempts
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-400">Did not receive OTP?</span>
                  <button
                    type="button"
                    onClick={handleRequestFreshOtp}
                    className="font-bold text-brand-green-900 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Regenerate Code
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOtpModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition disabled:opacity-50"
                  >
                    {otpLoading ? 'Verifying...' : 'Confirm Handover'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
