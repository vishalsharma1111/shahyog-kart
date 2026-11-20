import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Heart,
  ExternalLink,
  MapPin,
  Search,
  Building2,
  Tag,
  Clock,
  Eye,
  CheckCircle2,
  Award,
  Users,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import api from '../api/axiosInstance';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

const Ngos = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [causeFilter, setCauseFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Selected NGO for detailed profile modal
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [ngoRequirements, setNgoRequirements] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);

  useEffect(() => {
    const fetchNgos = async () => {
      try {
        setLoading(true);
        // Load full NGO directory
        const res = await api.get('/donations/ngos');
        if (res.data.success) {
          setNgos(res.data.ngos);
        }
      } catch (err) {
        console.error('Failed to load NGOs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNgos();
  }, []);

  const handleOpenProfile = async (ngo) => {
    setSelectedNgo(ngo);
    setReqLoading(true);
    try {
      // Fetch public requirements for this NGO
      const res = await api.get(`/donations/items/1/recommendations`).catch(() => null);
      // Also fetch requirements list
      const allReqsRes = await api.get('/admin/ngos').catch(() => null);
      if (allReqsRes?.data?.ngos) {
        const found = allReqsRes.data.ngos.find(n => n.id === ngo.id);
        if (found) {
          setSelectedNgo(prev => ({ ...prev, ...found }));
        }
      }
    } catch (e) {
      // non-blocking
    } finally {
      setReqLoading(false);
    }
  };

  const causes = ['all', 'Child Education', 'Hunger & Nutrition', 'Environment & Forestry', 'Women Empowerment', 'Healthcare & Elder Care'];

  const filteredNgos = ngos.filter((ngo) => {
    const matchesCause = causeFilter === 'all' || ngo.cause_area === causeFilter;
    const matchesSearch =
      search === '' ||
      ngo.organization_name?.toLowerCase().includes(search.toLowerCase()) ||
      ngo.description?.toLowerCase().includes(search.toLowerCase()) ||
      ngo.city?.toLowerCase().includes(search.toLowerCase());
    return matchesCause && matchesSearch;
  });

  const parseCategories = (cats) => {
    if (!cats) return ['Books', 'Clothes', 'Stationery'];
    if (Array.isArray(cats)) return cats;
    try {
      const parsed = JSON.parse(cats);
      return Array.isArray(parsed) ? parsed : ['Books', 'Clothes', 'Stationery'];
    } catch (e) {
      return cats.split(',').map(s => s.trim());
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Header */}
      <div className="bg-brand-green-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-xs uppercase font-extrabold tracking-widest text-brand-orange-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            100% Audited Partners
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Our Grassroots NGO Network
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            Every organization featured here is vetted for Section 80G/12A compliance, fiscal transparency, and verifiable on-the-ground beneficiary distribution.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Cause Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {causes.map((c) => (
            <button
              key={c}
              onClick={() => setCauseFilter(c)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                causeFilter === c
                  ? 'bg-brand-green-900 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {c === 'all' ? 'All Causes' : c}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search NGO by name, cause, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
          />
        </div>
      </div>

      {/* NGOs Grid */}
      {loading ? (
        <Loader text="Loading verified NGOs directory..." />
      ) : filteredNgos.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4 max-w-md mx-auto">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">No Verified NGOs Listed Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No registered non-profit organizations currently match your filter. Registered charitable foundations can apply for verification below.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => { setCauseFilter('all'); setSearch(''); }}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition"
            >
              Reset Filters
            </button>
            <Link
              to="/register?role=ngo"
              className="px-4 py-2 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-xs font-bold transition"
            >
              Register an NGO
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNgos.map((ngo) => {
            const acceptedList = parseCategories(ngo.accepted_categories);
            const percentage = Math.min(100, Math.round((ngo.raised_amount / (ngo.target_amount || 1)) * 100));

            return (
              <div
                key={ngo.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <div className="h-48 overflow-hidden relative bg-gray-100">
                    <img
                      src={ngo.image_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80'}
                      alt={ngo.organization_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-brand-green-900/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-orange-400" />
                      <span>{ngo.cause_area}</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-bold text-gray-950 text-lg leading-tight">
                        {ngo.organization_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        <span>Reg: <strong className="font-mono text-gray-700">{ngo.registration_number}</strong></span>
                        {ngo.city && <span>• {ngo.city}</span>}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {ngo.description}
                    </p>

                    {/* Accepted Categories Badges */}
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Accepted Item Categories
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {acceptedList.slice(0, 4).map((c, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100"
                          >
                            {c}
                          </span>
                        ))}
                        {acceptedList.length > 4 && (
                          <span className="text-[10px] text-gray-400 font-semibold self-center">
                            +{acceptedList.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-50">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-brand-green-900 font-bold">
                          ₹{parseFloat(ngo.raised_amount || 0).toLocaleString('en-IN')} Raised
                        </span>
                        <span className="text-gray-400">
                          Target: ₹{parseFloat(ngo.target_amount || 100000).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-green-800 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-gray-50 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleOpenProfile(ngo)}
                    className="text-xs font-bold text-brand-green-900 hover:text-brand-orange-500 inline-flex items-center gap-1 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Needs
                  </button>

                  <Link
                    to={`/donate?ngo=${ngo.id}&title=${encodeURIComponent(ngo.organization_name)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-xs font-bold shadow-sm transition ml-auto"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    Donate Now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Organization Registration CTA Section */}
      <section className="bg-gradient-to-r from-brand-green-900 to-brand-green-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-orange-400">
            Join the Alliance
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Are you a Registered Non-Profit in India?
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Partner with Shahyog Kart to publish real-time item needs, receive automated doorstep courier deliveries, and connect with conscious donors nationwide.
          </p>
        </div>
        <Link
          to="/register?role=ngo"
          className="px-6 py-3.5 rounded-2xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-orange-500/25 transition shrink-0"
        >
          Register as an NGO Partner
        </Link>
      </section>

      {/* Detailed NGO Profile & Requirements Modal */}
      {selectedNgo && (
        <Modal
          isOpen={!!selectedNgo}
          onClose={() => setSelectedNgo(null)}
          title={selectedNgo.organization_name}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs">
              <div>
                <span className="text-gray-500">Government Registration:</span>
                <div className="font-mono font-bold text-emerald-900">{selectedNgo.registration_number}</div>
              </div>
              <div className="text-right">
                <span className="text-gray-500">Cause Focus:</span>
                <div className="font-bold text-emerald-900">{selectedNgo.cause_area}</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">About the Mission</h4>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-2xl">
                {selectedNgo.description || 'Dedicated to humanitarian service, education, and social transformation.'}
              </p>
            </div>

            {selectedNgo.address && (
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Operational Center</h4>
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-orange-500 shrink-0" />
                  {selectedNgo.address}, {selectedNgo.city}, {selectedNgo.state}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Accepted Categories</h4>
              <div className="flex flex-wrap gap-2">
                {parseCategories(selectedNgo.accepted_categories).map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-100"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <Link
                to={`/donate?ngo=${selectedNgo.id}&category=${encodeURIComponent(parseCategories(selectedNgo.accepted_categories)[0] || 'Books')}`}
                className="px-5 py-2.5 rounded-xl bg-brand-green-900 text-white font-bold text-xs hover:bg-brand-green-800 transition shadow-sm"
              >
                Donate Items to this NGO
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Ngos;
