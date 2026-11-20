import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Clock,
  HelpCircle,
  Gift
} from 'lucide-react';
import api from '../api/axiosInstance';
import Loader from '../components/common/Loader';

const RewardWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoading(true);
        const res = await api.get('/coins/my-wallet');
        if (res.data.success) {
          setWallet(res.data);
        }
      } catch (err) {
        console.error('Error loading coin wallet:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  if (loading) {
    return <Loader fullScreen text="Loading your Shahyog Reward Wallet..." />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Wallet Balance Card */}
      <div className="bg-gradient-to-r from-brand-green-950 via-brand-green-900 to-brand-green-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-brand-green-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange-500/20 text-brand-orange-300 text-xs font-bold border border-brand-orange-400/30">
            <Coins className="w-3.5 h-3.5 text-brand-orange-400" />
            Social Giving Rewards • 1 Coin = ₹1
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              {wallet?.availableCoins || 0}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-brand-orange-400">
              Shahyog Coins
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 max-w-lg">
            Worth <strong>₹{wallet?.rupeeValue || 0}</strong> in shopping discounts! Awarded exclusively when our grassroots NGO partners verify your physical doorstep donations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <Link
            to="/shop"
            className="px-6 py-3.5 rounded-2xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-black text-xs sm:text-sm text-center shadow-lg shadow-brand-orange-500/25 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Redeem in Shop
          </Link>
          <Link
            to="/donate/items"
            className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm text-center border border-white/20 transition flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4 text-brand-orange-400 fill-brand-orange-400" />
            Donate to Earn
          </Link>
        </div>
      </div>

      {/* Stats Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-gray-900">{wallet?.totalEarnedCoins || 0}</div>
          <p className="text-xs font-semibold text-gray-500">Lifetime Coins Earned</p>
          <p className="text-[11px] text-gray-400">From verified books, clothes, blankets & relief goods</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-brand-orange-100 text-brand-orange-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-gray-900">{wallet?.totalRedeemedCoins || 0}</div>
          <p className="text-xs font-semibold text-gray-500">Total Coins Redeemed</p>
          <p className="text-[11px] text-gray-400">Equivalent to ₹{wallet?.totalRedeemedCoins || 0} in cart checkout savings</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-gray-900">₹1.00</div>
          <p className="text-xs font-semibold text-gray-500">Standard Conversion Rate</p>
          <p className="text-[11px] text-gray-400">1 Shahyog Coin = ₹1 INR guaranteed on all artisan products</p>
        </div>
      </div>

      {/* Reward Policy Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Gift className="w-5 h-5 text-brand-orange-500" />
              Configurable Reward Earning Policy
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Coins are automatically credited once an NGO partner inspects and verifies your items.
            </p>
          </div>
          <span className="text-[11px] font-bold text-brand-green-900 bg-brand-green-50 px-3 py-1 rounded-full border border-brand-green-200">
            Active Guidelines
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {wallet?.activeRules?.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between space-y-2"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Category
                </span>
                <p className="font-black text-gray-900 text-sm">{rule.category}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{rule.description}</p>
              </div>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-semibold">Reward Rate</span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  +{rule.coins_per_unit} Coins / unit
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Coin Transaction Ledger</h3>
            <p className="text-xs text-gray-500">Transparent audit record of every earned and redeemed coin.</p>
          </div>
          <span className="text-xs font-mono font-bold text-gray-400">
            {wallet?.transactions?.length || 0} Entries
          </span>
        </div>

        {(!wallet?.transactions || wallet.transactions.length === 0) ? (
          <div className="p-12 text-center text-xs text-gray-400 space-y-2">
            <Coins className="w-8 h-8 text-gray-300 mx-auto" />
            <p>No coin transactions recorded yet.</p>
            <p className="text-[11px] text-gray-400">
              Donate usable goods or shop to see your reward points in action!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-100">
                <tr>
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Coins</th>
                  <th className="p-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wallet.transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono font-bold text-gray-900">{txn.transaction_code}</td>
                    <td className="p-4">
                      {txn.type === 'earned' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <ArrowDownLeft className="w-3 h-3" /> Earned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-orange-100 text-brand-orange-800 text-[10px] font-bold">
                          <ArrowUpRight className="w-3 h-3" /> Redeemed
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-700 max-w-xs">{txn.description}</td>
                    <td className="p-4 text-gray-500">
                      {new Date(txn.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className={`p-4 text-right font-black ${
                      txn.type === 'earned' ? 'text-emerald-600' : 'text-brand-orange-600'
                    }`}>
                      {txn.type === 'earned' ? `+${txn.coins}` : `-${txn.coins}`}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-gray-900">
                      {txn.balance_after}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardWallet;
