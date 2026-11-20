import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Building,
  Heart,
  ArrowLeft,
  FileText,
  ShieldCheck,
  Package,
  Sparkles,
  AlertCircle,
  Truck,
  KeyRound,
  Coins,
  Users,
  ImageIcon
} from 'lucide-react';
import api from '../api/axiosInstance';
import StatusBadge from '../components/common/StatusBadge';
import Loader from '../components/common/Loader';

const DonationTracking = () => {
  const { identifier } = useParams();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/donations/items/${identifier}`);
        if (res.data.success) {
          setDonation(res.data.donation);
        }
      } catch (err) {
        console.error('Failed to load donation tracking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDonation();
  }, [identifier]);

  if (loading) {
    return <Loader fullScreen text="Loading live donation tracking..." />;
  }

  if (!donation) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-gray-100 shadow-sm text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Donation Record Not Found</h2>
        <p className="text-xs text-gray-500">We could not locate this donation reference number.</p>
        <Link
          to="/donate/items"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-green-900 text-white text-xs font-bold"
        >
          Donate Usable Goods
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link
        to="/profile"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-brand-green-900 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Profile & Giving History
      </Link>

      {/* Header Info Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange-600">
            Physical Donation Tracking
          </span>
          <h1 className="text-2xl font-black text-gray-950 font-mono mt-1">
            {donation.donation_code}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Submitted on{' '}
            {new Date(donation.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={donation.status} className="text-sm px-4 py-1.5" />
        </div>
      </div>

      {/* 11-Stage Visual Progress Stepper */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <h3 className="font-bold text-gray-900 text-base">Donation Journey Pipeline (11 Stages)</h3>

        <div className="overflow-x-auto pb-4">
          <div className="flex items-center min-w-[800px] justify-between relative">
            {donation.trackingTimeline?.map((item, idx) => {
              const isCompleted = item.state === 'completed';
              const isCurrent = item.state === 'current';
              const isRejected = item.state === 'cancelled';

              return (
                <div key={idx} className="flex flex-col items-center text-center relative z-10 flex-1 px-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                      isCompleted
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : isCurrent
                        ? 'bg-brand-orange-500 text-white ring-4 ring-brand-orange-100 animate-pulse'
                        : isRejected
                        ? 'bg-red-600 text-white ring-4 ring-red-100'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>

                  <span
                    className={`text-[11px] font-bold mt-2 leading-tight ${
                      isCurrent
                        ? 'text-brand-orange-600'
                        : isCompleted
                        ? 'text-gray-900'
                        : isRejected
                        ? 'text-red-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Item & Matched NGO Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Item details */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-orange-500" />
              Donation Item Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-400">Category</span>
                <p className="font-bold text-gray-900">{donation.category}</p>
              </div>
              <div>
                <span className="text-gray-400">Item Name</span>
                <p className="font-bold text-gray-900">{donation.item_name}</p>
              </div>
              <div>
                <span className="text-gray-400">Quantity</span>
                <p className="font-bold text-gray-900">{donation.quantity} units</p>
              </div>
              <div>
                <span className="text-gray-400">Usability Condition</span>
                <p className="font-bold text-brand-green-800">{donation.condition_type}</p>
              </div>
              <div>
                <span className="text-gray-400">Distributed Count</span>
                <p className="font-bold text-gray-900">{donation.distributed_count} / {donation.quantity}</p>
              </div>
              <div>
                <span className="text-gray-400">Doorstep City</span>
                <p className="font-bold text-gray-900">{donation.pickup_city}, {donation.pickup_state}</p>
              </div>
            </div>

            {donation.description && (
              <div className="pt-2 border-t border-gray-50 text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Donor Notes:</span> {donation.description}
              </div>
            )}

            {/* Photos */}
            {donation.images && donation.images.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-semibold text-gray-700 block mb-2">Item Photos:</span>
                <div className="flex items-center gap-3 overflow-x-auto">
                  {donation.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Donation preview"
                      className="w-24 h-24 rounded-2xl object-cover border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Matched NGO Partner Card */}
          {donation.matched_ngo_name && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-brand-green-800" />
                Assigned NGO Beneficiary Partner
              </h3>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900">
                    {donation.matched_ngo_name}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Verified Grassroots NGO
                  </span>
                </div>
                {donation.matched_ngo_address && (
                  <p className="flex items-center gap-1.5 text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-brand-orange-500" />
                    {donation.matched_ngo_address}, {donation.matched_ngo_city}
                  </p>
                )}
                {donation.matched_ngo_phone && (
                  <p className="text-gray-500">Facility Contact: {donation.matched_ngo_phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Official Receipt Card if available */}
          {donation.receipt && (
            <div className="bg-gradient-to-br from-brand-green-950 to-brand-green-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-orange-400" />
                  <h3 className="font-bold text-base">Verified NGO Receipt of Acceptance</h3>
                </div>
                <span className="font-mono text-xs text-brand-orange-300 font-bold">
                  {donation.receipt.receipt_number}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-gray-200">
                <div>
                  <span className="text-gray-400">Received Units</span>
                  <p className="font-bold text-white text-sm">{donation.receipt.quantity_received} units verified</p>
                </div>
                <div>
                  <span className="text-gray-400">Condition Audited</span>
                  <p className="font-bold text-emerald-400">{donation.receipt.condition_verified}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">NGO Intake Notes</span>
                  <p className="italic text-gray-300">{donation.receipt.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Logistics & OTP Verification Card */}
          {donation.delivery && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand-orange-500" />
                  Delivery Fleet & Chain of Custody
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Social Logistics
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-gray-400 font-medium">Assigned Courier</span>
                  <p className="font-bold text-gray-900 text-sm">{donation.delivery.driver_name}</p>
                  <p className="text-gray-500">{donation.delivery.vehicle_type} ({donation.delivery.vehicle_number})</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Handover Verification</span>
                  <p className="font-bold text-emerald-700 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5" />
                    {['Received by NGO', 'Distributed to beneficiaries', 'Completed'].includes(donation.status)
                      ? 'Secure 6-Digit OTP Verified at NGO'
                      : 'Pending OTP Validation at NGO Facility'}
                  </p>
                </div>
              </div>

              {/* Delivery breadcrumbs */}
              {donation.deliveryLogs && donation.deliveryLogs.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-gray-700 block">Transit Audit Logs:</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {donation.deliveryLogs.map((log) => (
                      <div key={log.id} className="text-xs p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-800">{log.status_update}</p>
                          <p className="text-gray-500 text-[11px]">{log.remarks}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Beneficiary Distribution Card (Supporting Photographs & Beneficiary Count) */}
          {donation.distributionRecord && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-200 shadow-md space-y-4 ring-2 ring-emerald-500/10">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-gray-900 text-base">Beneficiary Distribution Impact</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black">
                  Distributed to Beneficiaries
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <span className="text-gray-500 font-medium">Direct Beneficiaries</span>
                  <p className="text-xl font-black text-emerald-700 mt-1">
                    {donation.distributionRecord.beneficiary_count} People
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <span className="text-gray-500 font-medium">Quantity Handed Over</span>
                  <p className="text-xl font-black text-emerald-700 mt-1">
                    {donation.distributionRecord.distributed_quantity} Units
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 col-span-2 sm:col-span-1">
                  <span className="text-gray-500 font-medium">Distribution Date</span>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {new Date(donation.distributionRecord.distribution_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                <p>
                  <strong className="text-gray-900">Ground Distribution Location:</strong>{' '}
                  {donation.distributionRecord.distribution_location}
                </p>
                {donation.distributionRecord.description && (
                  <p className="text-gray-600 italic pt-1">
                    "{donation.distributionRecord.description}"
                  </p>
                )}
              </div>

              {/* Supporting Photographs of actual distribution */}
              {donation.distributionRecord.supporting_photographs &&
                donation.distributionRecord.supporting_photographs.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-brand-orange-500" />
                      Supporting Photographs of Field Distribution:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {donation.distributionRecord.supporting_photographs.map((photo, pIdx) => (
                        <div key={pIdx} className="relative group overflow-hidden rounded-2xl border border-gray-200">
                          <img
                            src={photo}
                            alt={`Beneficiary distribution proof ${pIdx + 1}`}
                            className="w-full h-32 object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Shahyog Coins Earned Card */}
          {donation.coins_awarded > 0 && (
            <div className="bg-gradient-to-r from-brand-orange-500 to-amber-500 text-white p-6 rounded-3xl shadow-lg flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-100 uppercase tracking-wider">
                  <Coins className="w-4 h-4" />
                  Social Rewards Credited
                </div>
                <h4 className="text-2xl font-black">
                  +{donation.coins_awarded} Shahyog Coins Earned!
                </h4>
                <p className="text-xs text-orange-100">
                  Worth ₹{donation.coins_awarded} discount in our shop. Thank you for your verified generosity!
                </p>
              </div>
              <Link
                to="/rewards"
                className="px-4 py-2.5 rounded-xl bg-white text-brand-orange-600 font-bold text-xs shadow hover:bg-orange-50 transition whitespace-nowrap"
              >
                View Coin Wallet →
              </Link>
            </div>
          )}
        </div>

        {/* Right: Doorstep Pickup & Smart Matches */}
        <div className="lg:col-span-4 space-y-6">
          {/* Pickup address */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-2">
              <MapPin className="w-4 h-4 text-brand-orange-500" />
              Pickup Point
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-900">{donation.donor_name}</p>
              <p>{donation.pickup_address}</p>
              <p>
                {donation.pickup_city}, {donation.pickup_state} - {donation.pickup_pincode}
              </p>
              <p className="text-gray-400 pt-1">{donation.donor_email}</p>
            </div>
          </div>

          {/* Smart Matches overview */}
          {donation.allMatches && donation.allMatches.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-2">
                <Sparkles className="w-4 h-4 text-brand-orange-500" />
                Algorithm Match Scores
              </h4>

              <div className="space-y-3">
                {donation.allMatches.slice(0, 3).map((m) => (
                  <div key={m.id} className="p-3 bg-gray-50 rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{m.organization_name}</span>
                      <span className="text-brand-green-900">{m.final_score}%</span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Distance: {m.distance_km} km away
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationTracking;
