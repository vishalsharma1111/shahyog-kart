import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Package,
  TrendingUp,
  Heart,
  Layers,
  Clock,
  Plus,
  Search,
  Filter,
  Truck,
  Building2,
  Coins,
  AlertTriangle,
  RotateCcw,
  Eye,
  Check,
  X,
  FileText,
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  ShoppingBag,
  Award,
  ChevronRight,
  ExternalLink,
  Edit2
} from 'lucide-react';
import api from '../api/axiosInstance';
import StatusBadge from '../components/common/StatusBadge';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [donations, setDonations] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coinsLedger, setCoinsLedger] = useState({ totals: {}, transactions: [] });
  const [rewardRules, setRewardRules] = useState([]);

  // Search and Filter states
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [donationFilter, setDonationFilter] = useState('all');

  // Add Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catSubmitting, setCatSubmitting] = useState(false);

  // Edit Reward Rule Modal
  const [selectedRule, setSelectedRule] = useState(null);
  const [ruleCoins, setRuleCoins] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleUpdating, setRuleUpdating] = useState(false);

  // Photo viewer modal
  const [viewPhotoUrl, setViewPhotoUrl] = useState(null);

  const loadDataForTab = async (tab) => {
    try {
      if (tab === 'analytics') {
        const res = await api.get('/admin/stats');
        if (res.data.success) setStats(res.data.stats);
      } else if (tab === 'users') {
        const res = await api.get('/admin/users');
        if (res.data.success) setUsers(res.data.users);
      } else if (tab === 'verifications') {
        const res = await api.get('/admin/verifications');
        if (res.data.success) setVerifications(res.data.pendingPartners);
      } else if (tab === 'ngos') {
        const res = await api.get('/admin/ngos');
        if (res.data.success) setNgos(res.data.ngos);
      } else if (tab === 'donations') {
        const [donRes, distRes] = await Promise.all([
          api.get('/admin/donations'),
          api.get('/admin/distribution-records')
        ]);
        if (donRes.data.success) setDonations(donRes.data.donations);
        if (distRes.data.success) setDistributions(distRes.data.distributionRecords);
      } else if (tab === 'delivery') {
        const [courierRes, pickupRes] = await Promise.all([
          api.get('/admin/delivery-partners'),
          api.get('/admin/pickup-requests')
        ]);
        if (courierRes.data.success) setCouriers(courierRes.data.partners);
        if (pickupRes.data.success) setPickups(pickupRes.data.pickupRequests);
      } else if (tab === 'ecommerce') {
        const [prodRes, ordRes] = await Promise.all([
          api.get('/admin/products'),
          api.get('/admin/orders')
        ]);
        if (prodRes.data.success) setProducts(prodRes.data.products);
        if (ordRes.data.success) setOrders(ordRes.data.orders);
      } else if (tab === 'coins') {
        const [ledgerRes, rulesRes] = await Promise.all([
          api.get('/admin/coins/ledger'),
          api.get('/coins/rules')
        ]);
        if (ledgerRes.data.success) setCoinsLedger(ledgerRes.data);
        if (rulesRes.data.success) setRewardRules(rulesRes.data.rules);
      }
    } catch (err) {
      console.error(`Error loading ${tab}:`, err);
    }
  };

  useEffect(() => {
    setLoading(true);
    // Load active tab data + background stats
    Promise.all([loadDataForTab(activeTab), api.get('/admin/stats').then(res => setStats(res.data.stats))])
      .finally(() => setLoading(false));
  }, [activeTab]);

  // Actions
  const handleUserStatusChange = async (userId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change user status to ${newStatus}?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      loadDataForTab('users');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handlePartnerVerify = async (userId, newStatus) => {
    try {
      await api.patch(`/admin/verifications/${userId}`, { status: newStatus });
      loadDataForTab('verifications');
    } catch (err) {
      alert(err.response?.data?.message || 'Verification update failed.');
    }
  };

  const handleResetPickup = async (pickupId) => {
    if (!window.confirm('Reset this pickup request to "pending" so another courier can accept it?')) return;
    try {
      await api.post(`/admin/pickup-requests/${pickupId}/reset`);
      alert('Pickup request reset successfully.');
      loadDataForTab('delivery');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset pickup.');
    }
  };

  const handleToggleProduct = async (productId) => {
    try {
      await api.patch(`/admin/products/${productId}/toggle`);
      loadDataForTab('ecommerce');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update product.');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName) return;
    try {
      setCatSubmitting(true);
      await api.post('/admin/categories', {
        name: catName,
        description: catDesc,
        image_url: catImage
      });
      setIsCategoryModalOpen(false);
      setCatName('');
      setCatDesc('');
      setCatImage('');
      alert('Category created successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleUpdateRewardRule = async (e) => {
    e.preventDefault();
    if (!selectedRule) return;
    try {
      setRuleUpdating(true);
      await api.put(`/coins/rules/${selectedRule.id}`, {
        coins_reward: Number(ruleCoins),
        description: ruleDescription
      });
      setSelectedRule(null);
      loadDataForTab('coins');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update rule.');
    } finally {
      setRuleUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesSearch =
      userSearch === '' ||
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone?.toLowerCase().includes(userSearch.toLowerCase());
    return matchesRole && matchesStatus && matchesSearch;
  });

  const filteredDonations = donations.filter((d) => {
    if (donationFilter === 'all') return true;
    if (donationFilter === 'physical') return d.donation_type === 'item';
    if (donationFilter === 'monetary') return d.donation_type === 'monetary';
    return d.status?.toLowerCase() === donationFilter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-gray-50/70 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-800">
                <Shield className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
                Super Admin Control Center
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Platform governance, partner verifications, cross-city logistics & social impact oversight.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 shadow-xs"
            >
              <Plus className="w-4 h-4 text-purple-600" />
              Add Category
            </button>
            <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              System Live & Healthy
            </div>
          </div>
        </div>

        {/* Global KPI Summary Bar (Strict Real-time Database Driven) */}
        {stats && (
          <>
            {Number(stats.totalUsers || 0) === 0 && Number(stats.totalOrders || 0) === 0 && Number(stats.totalDonations || 0) === 0 && (
              <div className="my-4 p-6 bg-white rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-bold text-gray-800">No platform activity recorded yet.</p>
                <p className="text-[11px] text-gray-400">Database is active and listening for live user registrations, orders, and donations.</p>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 my-6">
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Users</div>
                <div className="text-xl font-black text-gray-900 mt-1">{stats.totalUsers || 0}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{stats.totalCustomers || 0} Customers</div>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total NGOs</div>
                <div className="text-xl font-black text-emerald-700 mt-1">{stats.totalVerifiedNgos || 0}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{stats.totalNgos || 0} Registered</div>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Donations</div>
                <div className="text-xl font-black text-brand-orange-600 mt-1">{stats.totalDonations || 0}</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">{stats.totalReceivedDonations || 0} Received</div>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Products</div>
                <div className="text-xl font-black text-gray-900 mt-1">{stats.totalProducts || 0}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{stats.totalSellers || 0} Sellers</div>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</div>
                <div className="text-xl font-black text-gray-900 mt-1">{stats.totalOrders || 0}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">₹{Number(stats.totalRevenue || 0).toLocaleString('en-IN')} GMV</div>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Funds Raised</div>
                <div className="text-xl font-black text-purple-700 mt-1">₹{Number(stats.totalDonationsRaised || 0).toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">100% Verified</div>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Coins Issued</div>
                <div className="text-xl font-black text-amber-600 mt-1">{stats.totalRewardCoinsIssued || 0}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{stats.totalRewardCoinsRedeemed || 0} Redeemed</div>
              </div>
            </div>
          </>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-200 scrollbar-none">
          {[
            { id: 'analytics', label: 'Overview & Analytics', icon: TrendingUp },
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'verifications', label: `Pending Approvals (${stats?.pendingVerifications || 0})`, icon: CheckCircle },
            { id: 'ngos', label: 'NGO Network', icon: Building2 },
            { id: 'donations', label: 'Donations & Distribution', icon: Heart },
            { id: 'delivery', label: 'Logistics Fleet', icon: Truck },
            { id: 'ecommerce', label: 'Products & Orders', icon: ShoppingBag },
            { id: 'coins', label: 'Shahyog Coins & Rules', icon: Coins }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-purple-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-950 hover:bg-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-200' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="mt-6">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader text="Loading live admin stream..." />
            </div>
          ) : (
            <>
              {/* TAB 1: ANALYTICS & OVERVIEW */}
              {activeTab === 'analytics' && stats && (
                <div className="space-y-6">
                  {/* Visual Chart / Distribution Grids */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Item Categories Breakdown */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                      <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-4">
                        <Tag className="w-4 h-4 text-brand-orange-500" />
                        Donation Categories Breakdown
                      </h3>
                      <div className="space-y-3">
                        {stats.categoryBreakdown?.map((cat) => {
                          const total = stats.totalItemUnitsDonated || 1;
                          const pct = Math.round((cat.units / total) * 100);
                          return (
                            <div key={cat.category}>
                              <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-gray-700 capitalize">{cat.category}</span>
                                <span className="text-gray-900">{cat.units} units ({pct}%)</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-brand-orange-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Partner Breakdown */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                      <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4 text-purple-600" />
                        Platform Partner Status
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-purple-50/60 rounded-xl">
                          <span className="text-xs font-bold text-purple-900">Verified NGOs</span>
                          <span className="text-sm font-black text-purple-900">{stats.totalVerifiedNgos} of {stats.totalNgos}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-amber-50/60 rounded-xl">
                          <span className="text-xs font-bold text-amber-900">Active Delivery Couriers</span>
                          <span className="text-sm font-black text-amber-900">{stats.totalVerifiedDeliveryPartners} of {stats.totalDeliveryPartners}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-brand-orange-50/60 rounded-xl">
                          <span className="text-xs font-bold text-brand-orange-900">Registered Artisans / Sellers</span>
                          <span className="text-sm font-black text-brand-orange-900">{stats.totalSellers}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50/60 rounded-xl">
                          <span className="text-xs font-bold text-red-900">Suspended / Flagged Accounts</span>
                          <span className="text-sm font-black text-red-900">{stats.suspendedUsers}</span>
                        </div>
                      </div>
                    </div>

                    {/* Social Impact KPI */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-emerald-600" />
                          Social Transformation Index
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                          Verified beneficiary impact certified by NGO ground reports and photo timestamps.
                        </p>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                          <div className="text-3xl font-black text-emerald-800">
                            {stats.totalBeneficiariesReported}
                          </div>
                          <div className="text-xs font-bold text-emerald-700 mt-1 uppercase tracking-wide">
                            Needy Citizens Empowered
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>Direct Cash Donated:</span>
                        <strong className="text-gray-900 font-bold">₹{Number(stats.totalDirectDonated || 0).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Table */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-black text-gray-900">Recent Platform Activities</h3>
                      <span className="text-xs text-gray-400">Live operational feed</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {stats.recentActivity?.map((act, idx) => (
                        <div key={idx} className="p-4 hover:bg-gray-50/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="p-2 rounded-lg bg-gray-100 text-gray-600">
                              <Clock className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="font-bold text-gray-900">{act.message}</div>
                              <div className="text-gray-500 text-[10px] mt-0.5">{act.meta}</div>
                            </div>
                          </div>
                          <div className="text-gray-400 text-[11px]">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: USER DIRECTORY & SUSPENSION */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:w-80">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Search by name, email, phone..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 rounded-xl text-xs border border-gray-200 font-semibold text-gray-700 focus:outline-none"
                      >
                        <option value="all">All Roles</option>
                        <option value="customer">Customer</option>
                        <option value="ngo">NGO</option>
                        <option value="delivery">Delivery</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 rounded-xl text-xs border border-gray-200 font-semibold text-gray-700 focus:outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Joined Date</th>
                            <th className="p-4 text-right">Account Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="p-8 text-center text-gray-400">
                                No users match the given criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((u) => (
                              <tr key={u.id} className="hover:bg-gray-50/60">
                                <td className="p-4">
                                  <div className="font-bold text-gray-900">{u.name}</div>
                                  <div className="text-[11px] text-gray-500">{u.email} • {u.phone || 'No phone'}</div>
                                </td>
                                <td className="p-4">
                                  <span className="capitalize px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-bold text-[10px]">
                                    {u.role}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <StatusBadge status={u.status} />
                                </td>
                                <td className="p-4 text-gray-500">
                                  {new Date(u.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  {u.status === 'suspended' ? (
                                    <button
                                      onClick={() => handleUserStatusChange(u.id, 'active')}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px]"
                                    >
                                      Reactivate
                                    </button>
                                  ) : (
                                    u.role !== 'admin' && (
                                      <button
                                        onClick={() => handleUserStatusChange(u.id, 'suspended')}
                                        className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-bold text-[11px]"
                                      >
                                        Suspend
                                      </button>
                                    )
                                  )}
                                  {u.status === 'pending' && (
                                    <button
                                      onClick={() => handleUserStatusChange(u.id, 'approved')}
                                      className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[11px]"
                                    >
                                      Approve
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PENDING PARTNER VERIFICATIONS */}
              {activeTab === 'verifications' && (
                <div className="space-y-4">
                  {verifications.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 text-gray-400">
                      <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                      <h3 className="text-sm font-bold text-gray-700">All Partners Verified</h3>
                      <p className="text-xs text-gray-400 mt-1">There are no pending partner verification requests.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {verifications.map((partner) => (
                        <div key={partner.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-purple-100 text-purple-800">
                                {partner.role} Verification Request
                              </span>
                              <span className="text-[11px] text-gray-400">
                                Applied: {new Date(partner.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-gray-900">{partner.name}</h3>
                            <p className="text-xs text-gray-500">{partner.email} • {partner.phone || 'No phone'}</p>

                            {/* Role details */}
                            {partner.role === 'ngo' && partner.ngo_details && (
                              <div className="mt-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-gray-700 space-y-1">
                                <div><strong>Org Name:</strong> {partner.ngo_details.organization_name}</div>
                                <div><strong>Reg No:</strong> {partner.ngo_details.registration_number}</div>
                                <div><strong>Contact:</strong> {partner.ngo_details.contact_person}</div>
                                <div><strong>Accepted:</strong> {partner.ngo_details.accepted_categories}</div>
                              </div>
                            )}

                            {partner.role === 'delivery' && partner.delivery_details && (
                              <div className="mt-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-gray-700 space-y-1">
                                <div><strong>Vehicle:</strong> {partner.delivery_details.vehicle_type} ({partner.delivery_details.vehicle_number})</div>
                                <div><strong>License:</strong> {partner.delivery_details.driving_license_no}</div>
                              </div>
                            )}

                            {partner.role === 'seller' && partner.seller_details && (
                              <div className="mt-3 p-3 bg-brand-orange-50/50 rounded-xl border border-brand-orange-100 text-xs text-gray-700 space-y-1">
                                <div><strong>Store Name:</strong> {partner.seller_details.store_name}</div>
                                <div><strong>GST Number:</strong> {partner.seller_details.gst_number || 'N/A'}</div>
                              </div>
                            )}
                          </div>

                          <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                            <button
                              onClick={() => handlePartnerVerify(partner.id, 'rejected')}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition"
                            >
                              Reject Request
                            </button>
                            <button
                              onClick={() => handlePartnerVerify(partner.id, 'approved')}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm transition"
                            >
                              Verify & Activate Partner
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: NGO DIRECTORY & IMPACT */}
              {activeTab === 'ngos' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ngos.map((ngo) => (
                      <div key={ngo.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                              {ngo.verification_status || 'Verified'}
                            </span>
                            <span className="text-[11px] text-gray-400">Reg: {ngo.registration_number}</span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900">{ngo.organization_name}</h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ngo.description || ngo.address}</p>

                          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="p-2 bg-gray-50 rounded-xl">
                              <div className="font-black text-gray-900">{ngo.active_requirements_count || 0}</div>
                              <div className="text-[10px] text-gray-400">Requirements</div>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-xl">
                              <div className="font-black text-emerald-700">{ngo.verified_receipts_count || 0}</div>
                              <div className="text-[10px] text-emerald-600">Receipts</div>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-xl">
                              <div className="font-black text-purple-700">{ngo.distributions_count || 0}</div>
                              <div className="text-[10px] text-purple-600">Drives</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
                          <span>Contact: {ngo.contact_person}</span>
                          <span>{ngo.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: DONATIONS & DISTRIBUTION */}
              {activeTab === 'donations' && (
                <div className="space-y-6">
                  {/* Donations Filter Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900">Donations Audit Stream</h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={donationFilter}
                        onChange={(e) => setDonationFilter(e.target.value)}
                        className="px-3 py-1.5 bg-gray-50 rounded-xl text-xs border border-gray-200 font-semibold"
                      >
                        <option value="all">All Donations</option>
                        <option value="physical">Physical Items</option>
                        <option value="monetary">Monetary Contributions</option>
                        <option value="submitted">Submitted</option>
                        <option value="received by ngo">Received by NGO</option>
                        <option value="distributed to beneficiaries">Distributed</option>
                      </select>
                    </div>
                  </div>

                  {/* Donations Table */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="p-4">Donation Details</th>
                            <th className="p-4">Donor</th>
                            <th className="p-4">Assigned NGO</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Coins Awarded</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredDonations.map((d) => (
                            <tr key={d.id} className="hover:bg-gray-50/60">
                              <td className="p-4">
                                <div className="font-bold text-gray-900">{d.item_name || 'Monetary Contribution'}</div>
                                <div className="text-[11px] text-gray-500">
                                  {d.donation_type === 'item' ? `${d.quantity} units • ${d.category}` : `₹${d.amount}`}
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono">ID: {d.donation_code}</span>
                              </td>
                              <td className="p-4">
                                <div className="font-semibold text-gray-800">{d.donor_name}</div>
                                <div className="text-[11px] text-gray-500">{d.donor_email}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-semibold text-gray-800">{d.ngo_name || 'Unassigned'}</div>
                                {d.matching_score && (
                                  <div className="text-[10px] text-emerald-600 font-bold">
                                    Match: {d.matching_score}%
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <StatusBadge status={d.status} />
                              </td>
                              <td className="p-4">
                                {d.reward_coins_awarded > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-amber-700 font-black">
                                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                                    +{d.reward_coins_awarded}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Ground Distribution Impact Records */}
                  <div className="mt-8">
                    <h3 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-600" />
                      NGO Ground Distribution & Beneficiary Photo Evidence
                    </h3>
                    {distributions.length === 0 ? (
                      <div className="bg-white p-8 text-center rounded-2xl border border-gray-200 text-gray-400 text-xs">
                        No beneficiary distribution records filed yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {distributions.map((dist) => (
                          <div key={dist.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md">
                                {dist.organization_name}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(dist.distribution_date).toLocaleDateString()}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-sm font-black text-gray-900">{dist.item_name}</h4>
                              <p className="text-xs text-emerald-700 font-bold mt-0.5">
                                {dist.distributed_quantity} units given to {dist.beneficiary_count} beneficiaries
                              </p>
                              <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                {dist.distribution_location}
                              </p>
                              {dist.description && (
                                <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg italic">
                                  "{dist.description}"
                                </p>
                              )}
                            </div>

                            {/* Photographs */}
                            {dist.supporting_photographs && (
                              <div className="pt-2">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                                  Supporting Photo Proof
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                  {Array.isArray(dist.supporting_photographs) ? (
                                    dist.supporting_photographs.map((photo, i) => (
                                      <img
                                        key={i}
                                        src={photo}
                                        alt="Distribution Proof"
                                        onClick={() => setViewPhotoUrl(photo)}
                                        className="w-16 h-16 rounded-xl object-cover cursor-pointer border border-gray-200 hover:scale-105 transition"
                                      />
                                    ))
                                  ) : (
                                    <span className="text-xs text-gray-400">No photos</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: LOGISTICS & DELIVERY FLEET */}
              {activeTab === 'delivery' && (
                <div className="space-y-6">
                  {/* Fleet Overview */}
                  <div>
                    <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-amber-600" />
                      Active Delivery Fleet
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {couriers.map((c) => (
                        <div key={c.user_id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                          <div>
                            <div className="font-bold text-xs text-gray-900">{c.driver_name}</div>
                            <div className="text-[11px] text-gray-500">{c.vehicle_type} • {c.vehicle_number}</div>
                            <div className="text-[10px] text-amber-600 font-bold mt-1">★ {c.rating} Rating</div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              {c.is_available ? 'Available' : 'On Delivery'}
                            </span>
                            <div className="text-[10px] text-gray-400 mt-1">{c.total_deliveries} trips completed</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pickup Trips & Issue Resolution */}
                  <div>
                    <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      Pickup Dispatch Monitor & Resolution
                    </h3>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="p-4">Trip Details</th>
                              <th className="p-4">Assigned Driver</th>
                              <th className="p-4">Pickup Address</th>
                              <th className="p-4">Trip Status</th>
                              <th className="p-4 text-right">Intervention</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {pickups.map((p) => (
                              <tr key={p.id} className="hover:bg-gray-50/60">
                                <td className="p-4">
                                  <div className="font-bold text-gray-900">{p.item_name} ({p.quantity} units)</div>
                                  <div className="text-[10px] text-gray-400 font-mono">Trip #{p.id} • Donation #{p.donation_code}</div>
                                </td>
                                <td className="p-4">
                                  <div className="font-semibold text-gray-800">{p.driver_name || 'Unassigned'}</div>
                                  <div className="text-[11px] text-gray-500">{p.driver_phone || '—'}</div>
                                </td>
                                <td className="p-4 max-w-xs truncate text-gray-600">
                                  {p.pickup_address}
                                </td>
                                <td className="p-4">
                                  <StatusBadge status={p.status} />
                                </td>
                                <td className="p-4 text-right">
                                  {p.status === 'assigned' && (
                                    <button
                                      onClick={() => handleResetPickup(p.id)}
                                      className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-[11px] inline-flex items-center gap-1"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      Reset Pickup
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: E-COMMERCE PRODUCTS & ORDERS */}
              {activeTab === 'ecommerce' && (
                <div className="space-y-6">
                  {/* Products Management */}
                  <div>
                    <h3 className="text-sm font-black text-gray-900 mb-3">Product Catalog Moderation</h3>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="p-4">Product</th>
                              <th className="p-4">Seller</th>
                              <th className="p-4">Price / Stock</th>
                              <th className="p-4">Moderation</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {products.map((prod) => (
                              <tr key={prod.id} className="hover:bg-gray-50/60">
                                <td className="p-4">
                                  <div className="font-bold text-gray-900">{prod.name}</div>
                                  <div className="text-[11px] text-gray-500">{prod.category_name}</div>
                                </td>
                                <td className="p-4">
                                  <div className="font-semibold text-gray-800">{prod.seller_name}</div>
                                </td>
                                <td className="p-4">
                                  <div className="font-bold text-gray-900">₹{prod.price}</div>
                                  <div className="text-[11px] text-gray-500">{prod.stock} in stock</div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    prod.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                  }`}>
                                    {prod.is_active ? 'Active on Store' : 'Hidden / Delisted'}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleToggleProduct(prod.id)}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                                      prod.is_active
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {prod.is_active ? 'Delist' : 'Publish'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Orders Stream */}
                  <div>
                    <h3 className="text-sm font-black text-gray-900 mb-3">Global Orders Ledger</h3>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="p-4">Order ID</th>
                              <th className="p-4">Customer</th>
                              <th className="p-4">Amount</th>
                              <th className="p-4">Coin Discount</th>
                              <th className="p-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {orders.map((ord) => (
                              <tr key={ord.id} className="hover:bg-gray-50/60">
                                <td className="p-4 font-mono font-bold text-gray-900">
                                  #{ord.order_number}
                                </td>
                                <td className="p-4">
                                  <div className="font-semibold text-gray-800">{ord.customer_name}</div>
                                  <div className="text-[11px] text-gray-500">{ord.customer_email}</div>
                                </td>
                                <td className="p-4 font-bold text-gray-900">
                                  ₹{ord.total_amount}
                                </td>
                                <td className="p-4">
                                  {ord.coins_redeemed > 0 ? (
                                    <span className="text-amber-700 font-bold">
                                      -{ord.coins_redeemed} coins (₹{ord.coins_redeemed})
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">0</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <StatusBadge status={ord.order_status} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: SHAHYOG COINS & REWARD RULES */}
              {activeTab === 'coins' && (
                <div className="space-y-6">
                  {/* Reward Rules Configuration */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-500" />
                          Configurable Reward Coin Policy
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Configure how many reward coins donors receive when an NGO verifies their donation.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {rewardRules.map((rule) => (
                        <div key={rule.id} className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200 flex flex-col justify-between">
                          <div>
                            <div className="font-bold text-xs text-amber-900 capitalize">{rule.category}</div>
                            <div className="text-2xl font-black text-amber-700 mt-2">
                              {rule.coins_reward} <span className="text-xs font-semibold">coins/unit</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1">{rule.description || 'Standard donation incentive'}</p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedRule(rule);
                              setRuleCoins(rule.coins_reward);
                              setRuleDescription(rule.description || '');
                            }}
                            className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit Rule
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coin Transaction Ledger */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-black text-gray-900">Platform Coin Audit Ledger</h3>
                      <div className="text-xs text-gray-500">
                        Total Coins Issued: <strong>{coinsLedger.totals?.totalCoinsIssued || 0}</strong> | Total Redeemed: <strong>{coinsLedger.totals?.totalCoinsRedeemed || 0}</strong>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="p-4">User</th>
                              <th className="p-4">Type</th>
                              <th className="p-4">Amount</th>
                              <th className="p-4">Balance After</th>
                              <th className="p-4">Reason / Description</th>
                              <th className="p-4">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {coinsLedger.transactions?.map((t) => (
                              <tr key={t.id} className="hover:bg-gray-50/60">
                                <td className="p-4">
                                  <div className="font-semibold text-gray-900">{t.user_name}</div>
                                  <div className="text-[11px] text-gray-500">{t.user_email}</div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    t.type === 'earned' ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-orange-50 text-brand-orange-700'
                                  }`}>
                                    {t.type}
                                  </span>
                                </td>
                                <td className="p-4 font-bold text-gray-900">
                                  {t.type === 'earned' ? `+${t.coins}` : `-${t.coins}`}
                                </td>
                                <td className="p-4 font-mono text-gray-700">
                                  {t.balance_after}
                                </td>
                                <td className="p-4 text-gray-600 max-w-xs truncate">
                                  {t.description}
                                </td>
                                <td className="p-4 text-gray-400">
                                  {new Date(t.created_at).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD CATEGORY */}
      {isCategoryModalOpen && (
        <Modal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          title="Create New E-Commerce Category"
        >
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category Name *</label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Eco-Friendly Crafts"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
              <textarea
                rows="2"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Brief summary for this category..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
              ></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Image URL</label>
              <input
                type="url"
                value={catImage}
                onChange={(e) => setCatImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={catSubmitting}
                className="px-4 py-2 bg-purple-900 text-white rounded-xl text-xs font-bold hover:bg-purple-800 disabled:opacity-50"
              >
                {catSubmitting ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: EDIT REWARD RULE */}
      {selectedRule && (
        <Modal
          isOpen={!!selectedRule}
          onClose={() => setSelectedRule(null)}
          title={`Configure Coin Reward: ${selectedRule.category}`}
        >
          <form onSubmit={handleUpdateRewardRule} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Reward Coins per verified item unit *
              </label>
              <input
                type="number"
                required
                min="1"
                max="500"
                value={ruleCoins}
                onChange={(e) => setRuleCoins(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-amber-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Policy Description</label>
              <textarea
                rows="2"
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              ></textarea>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRule(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={ruleUpdating}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 disabled:opacity-50"
              >
                {ruleUpdating ? 'Updating...' : 'Save Reward Policy'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: PHOTO VIEWER */}
      {viewPhotoUrl && (
        <Modal
          isOpen={!!viewPhotoUrl}
          onClose={() => setViewPhotoUrl(null)}
          title="Verified Ground Distribution Photograph"
        >
          <div className="p-2">
            <img
              src={viewPhotoUrl}
              alt="Beneficiary Distribution Evidence"
              className="w-full max-h-[70vh] object-contain rounded-xl"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
