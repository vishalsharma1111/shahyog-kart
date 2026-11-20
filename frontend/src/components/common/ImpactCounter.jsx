import React, { useState, useEffect } from 'react';
import { HeartHandshake, Users, ShieldCheck, ShoppingCart, Loader2 } from 'lucide-react';
import api from '../../api/axiosInstance';

const ImpactCounter = ({ className = '' }) => {
  const [stats, setStats] = useState({
    totalVerifiedNgos: 0,
    totalDonations: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalBeneficiaries: 0,
    totalFundsRaised: 0,
    totalCoinsIssued: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/public');
        if (res.data?.success && isMounted) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error('Error fetching live impact stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = [
    {
      icon: HeartHandshake,
      value: `₹${Number(stats.totalFundsRaised || 0).toLocaleString('en-IN')}`,
      label: 'Verified Funds Raised',
      desc: '100% verified payment transactions dedicated to relief causes'
    },
    {
      icon: Users,
      value: Number(stats.totalBeneficiaries || 0).toLocaleString('en-IN'),
      label: 'Beneficiaries Empowered',
      desc: 'Documented ground distribution drives verified with photo audits'
    },
    {
      icon: ShieldCheck,
      value: Number(stats.totalVerifiedNgos || 0).toLocaleString('en-IN'),
      label: 'Verified NGO Partners',
      desc: 'Officially vetted non-profit organizations with active requirements'
    },
    {
      icon: ShoppingCart,
      value: Number(stats.totalOrders || 0).toLocaleString('en-IN'),
      label: 'Artisan Orders Delivered',
      desc: 'Authentic purchases empowering indigenous and rural micro-enterprises'
    }
  ];

  return (
    <div className={`bg-brand-green-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-green-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-brand-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center mb-10">
        <span className="text-xs uppercase tracking-widest font-bold text-brand-orange-500 bg-brand-orange-500/10 border border-brand-orange-500/30 px-3.5 py-1 rounded-full">
          Real-Time Database Impact
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold mt-3 tracking-tight">
          Live Platform Impact Metrics
        </h2>
        <p className="text-gray-300 text-sm sm:text-base mt-2 max-w-2xl mx-auto">
          Every figure below is queried directly from verified database records. Zero hardcoded or fabricated statistics.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-orange-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {metrics.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xs hover:border-brand-orange-500/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-orange-500/20 text-brand-orange-500 flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {item.value}
                </div>
                <div className="text-sm font-semibold text-gray-200 mt-1">
                  {item.label}
                </div>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImpactCounter;
