import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Layers,
  TrendingUp,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle,
  Truck,
  Building,
  Upload,
  AlertCircle,
  Clock,
  ShieldAlert
} from 'lucide-react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

const SellerDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders'

  // Add / Edit Product Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    stock: '',
    donation_percentage: '10',
    description: '',
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const isPendingVerification = user?.status === 'pending';

  const loadSellerData = async () => {
    try {
      setLoading(true);
      const [statsRes, prodRes, orderRes, catRes] = await Promise.all([
        api.get('/seller/stats'),
        api.get('/seller/products'),
        api.get('/seller/orders'),
        api.get('/products/categories')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (orderRes.data.success) setOrders(orderRes.data.orders);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      console.error('Error loading seller dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || '1',
      price: '',
      stock: '20',
      donation_percentage: '10',
      description: '',
      image_url: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category_id: p.category_id,
      price: p.price,
      stock: p.stock,
      donation_percentage: p.donation_percentage || '10',
      description: p.description || '',
      image_url: p.image_url || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.price || !formData.category_id) {
      setFormError('Please fill in required fields.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingProduct) {
        await api.put(`/seller/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/seller/products', formData);
      }
      setIsModalOpen(false);
      loadSellerData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/seller/products/${id}`);
      loadSellerData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const handleQuickStockUpdate = async (id, newStock) => {
    const val = parseInt(newStock, 10);
    if (isNaN(val) || val < 0) return;
    try {
      await api.patch(`/seller/products/${id}/stock`, { stock: val });
      loadSellerData();
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/seller/orders/${orderId}/status`, { status: newStatus });
      loadSellerData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  if (loading) {
    return <Loader fullScreen text="Loading artisan seller dashboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Verification Notice Banner */}
      {isPendingVerification && (
        <div className="bg-amber-50 border border-amber-300 p-5 rounded-3xl flex items-start gap-3.5 shadow-sm">
          <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1 text-xs text-amber-900">
            <h4 className="font-bold text-sm">Seller Account Pending Admin Verification</h4>
            <p>
              Your enterprise/artisan account is currently in queue for compliance verification. Once our administrative panel verifies your collective's authentic background, full product creation and fulfillment powers will be automatically unlocked!
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange-600">
            Artisan & Merchant Hub
          </span>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">
            Seller Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Logged in as <strong>{user?.name}</strong> •{' '}
            {user?.organization_name || 'Independent Artisan Collective'}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          disabled={isPendingVerification}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg transition active:scale-95 ${
            isPendingVerification
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-brand-orange-500 hover:bg-brand-orange-600 text-white shadow-brand-orange-500/25'
          }`}
        >
          <Plus className="w-4 h-4" /> Add New Listing
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-green-100 text-brand-green-900 flex items-center justify-center mb-3">
            <Package className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-gray-950">{stats?.totalProducts || 0}</div>
          <div className="text-xs font-semibold text-gray-500">Active Listings</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-gray-950">{stats?.totalStock || 0}</div>
          <div className="text-xs font-semibold text-gray-500">Total Units in Inventory</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-orange-100 text-brand-orange-600 flex items-center justify-center mb-3">
            <Truck className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-gray-950">{stats?.totalOrders || 0}</div>
          <div className="text-xs font-semibold text-gray-500">Orders Received</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-gray-950">
            ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-semibold text-gray-500">Artisan Sales Revenue</div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'products'
              ? 'border-brand-green-900 text-brand-green-950'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-brand-green-900 text-brand-green-950'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Incoming Orders ({orders.length})
        </button>
      </div>

      {/* Tab 1: Products Management Table */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500 space-y-3">
              <Package className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="text-base font-bold text-gray-900">You haven't added any products yet.</h3>
              <p className="text-xs text-gray-400">List handcrafted artisan goods to reach conscious shoppers nationwide.</p>
              {!isPendingVerification && (
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 rounded-xl bg-brand-orange-500 text-white font-bold text-xs hover:bg-brand-orange-600 transition"
                >
                  + Add Product
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6">Product</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Price</th>
                    <th className="py-4 px-4">Stock</th>
                    <th className="py-4 px-4">Donation %</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-100 bg-gray-50 flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-gray-900 line-clamp-1">{p.name}</div>
                            <div className="text-[11px] text-gray-400 font-mono">ID: {p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-600">{p.category_name}</td>
                      <td className="py-4 px-4 font-bold text-gray-900">
                        ₹{parseFloat(p.price).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            defaultValue={p.stock}
                            disabled={isPendingVerification}
                            onBlur={(e) => handleQuickStockUpdate(p.id, e.target.value)}
                            className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-center font-bold focus:ring-1 focus:ring-brand-green-900 outline-none"
                          />
                          {p.stock <= 5 && (
                            <span title="Low stock warning">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-brand-green-800">
                        {p.donation_percentage || 5}%
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {p.is_active ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          disabled={isPendingVerification}
                          className="p-1.5 text-gray-400 hover:text-brand-green-900 transition disabled:opacity-30"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          disabled={isPendingVerification}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition disabled:opacity-30"
                          title="Delete Product"
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

      {/* Tab 2: Orders Fulfillment Table */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500 space-y-3">
              <Truck className="w-10 h-10 text-gray-300 mx-auto" />
              <p>No orders received yet for your listed products.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6">Order Ref</th>
                    <th className="py-4 px-4">Ordered Item</th>
                    <th className="py-4 px-4">Recipient</th>
                    <th className="py-4 px-4">Qty × Price</th>
                    <th className="py-4 px-4">Total</th>
                    <th className="py-4 px-4">Current Status</th>
                    <th className="py-4 px-6">Update Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.order_item_id} className="hover:bg-gray-50/60 transition">
                      <td className="py-4 px-6 font-mono font-bold text-gray-900">
                        {o.order_number}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={o.product_image}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <span className="font-semibold text-gray-900">{o.product_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{o.customer_name}</div>
                        <div className="text-[10px] text-gray-400">{o.customer_city}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {o.quantity} × ₹{parseFloat(o.price).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 font-black text-gray-950">
                        ₹{parseFloat(o.item_total).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={o.order_status} />
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={o.order_status}
                          disabled={isPendingVerification}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-green-900 outline-none cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Artisan Product' : 'Add New Handcrafted Listing'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
              placeholder="e.g. Hand-spun Khadi Kurta"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-green-900 outline-none bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none font-bold"
                placeholder="899"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Available Stock Units *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                placeholder="25"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Social Donation % *
              </label>
              <select
                value={formData.donation_percentage}
                onChange={(e) => setFormData({ ...formData, donation_percentage: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-green-900 outline-none bg-white"
              >
                <option value="5">5% to social causes</option>
                <option value="8">8% to social causes</option>
                <option value="10">10% to social causes</option>
                <option value="15">15% to social causes</option>
                <option value="20">20% to social causes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Description & Artisan Story
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
              placeholder="Describe the craft techniques, materials used, and community impact..."
            />
          </div>

          {formError && (
            <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold text-xs shadow-md transition"
            >
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Publish Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SellerDashboard;
