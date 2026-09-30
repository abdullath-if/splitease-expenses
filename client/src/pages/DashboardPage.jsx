import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  CreditCard,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, groupTypeMeta } from '../utils/formatters';
import CategoryChart from '../components/CategoryChart';
import SpendTrendChart from '../components/SpendTrendChart';
import ActivityFeed from '../components/ActivityFeed';
import { SkeletonCard } from '../components/SkeletonCard';
import CreateGroupModal from '../components/CreateGroupModal';

const DashboardPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    metrics: {
      totalOwedToYou: 0,
      totalYouOwe: 0,
      netBalance: 0,
      totalUserSpending: 0,
      totalGroups: 0,
    },
    groupBalances: [],
    categoryData: [],
    monthlyTrend: [],
    recentActivity: [],
  });

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      addToast('Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResetSeed = async () => {
    setSeeding(true);
    try {
      const res = await api.post('/seed');
      if (res.data.success) {
        addToast('Sample demo data reset successfully!', 'success');
        fetchDashboardData();
      }
    } catch (err) {
      addToast('Failed to reset demo data', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const { metrics, groupBalances, categoryData, monthlyTrend, recentActivity } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hello, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here is your financial summary across all active groups.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleResetSeed}
            disabled={seeding}
            title="Reset database with realistic demo data"
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{seeding ? 'Resetting...' : 'Reset Demo Data'}</span>
          </button>

          <button
            onClick={fetchDashboardData}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* You are owed */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex-shrink-0">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              You are owed
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 truncate mt-0.5">
              {formatCurrency(metrics.totalOwedToYou)}
            </p>
          </div>
        </div>

        {/* You owe */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex-shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              You owe
            </p>
            <p className="text-xl sm:text-2xl font-black text-rose-600 truncate mt-0.5">
              {formatCurrency(metrics.totalYouOwe)}
            </p>
          </div>
        </div>

        {/* Total Spending */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Your Share of Spend
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 truncate mt-0.5">
              {formatCurrency(metrics.totalUserSpending)}
            </p>
          </div>
        </div>

        {/* Total Groups */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Groups
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 truncate mt-0.5">
              {metrics.totalGroups}
            </p>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Spending by Category</h2>
              <p className="text-xs text-slate-400">Distribution of your expense shares</p>
            </div>
          </div>
          <CategoryChart data={categoryData} />
        </div>

        {/* Monthly Trend */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Monthly Spending Trend</h2>
              <p className="text-xs text-slate-400">Your expense history over the last 6 months</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <SpendTrendChart data={monthlyTrend} />
        </div>
      </div>

      {/* GROUPS SUMMARY & ACTIVITY FEED ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group Balances List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Groups & Balances</h2>
              <p className="text-xs text-slate-400">Quick snapshot of each group</p>
            </div>
            <Link
              to="/groups"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View all groups &rarr;
            </Link>
          </div>

          {loading ? (
            <SkeletonCard count={2} />
          ) : groupBalances.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No groups yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Create a group or ask a friend to invite you.
              </p>
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 cursor-pointer"
              >
                Create Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {groupBalances.map((gb) => {
                const meta = groupTypeMeta[gb.groupType] || groupTypeMeta.Other;
                const isOwed = gb.myBalance > 0.01;
                const owes = gb.myBalance < -0.01;

                return (
                  <Link
                    key={gb.groupId}
                    to={`/groups/${gb.groupId}`}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all bg-white group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {gb.memberCount} members
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                        {gb.groupName}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">
                        Your balance
                      </span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-md ${
                          isOwed
                            ? 'text-emerald-700 bg-emerald-50'
                            : owes
                            ? 'text-rose-700 bg-rose-50'
                            : 'text-slate-600 bg-slate-100'
                        }`}
                      >
                        {isOwed
                          ? `+${formatCurrency(gb.myBalance)}`
                          : owes
                          ? `-${formatCurrency(Math.abs(gb.myBalance))}`
                          : 'Settled'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
              <p className="text-xs text-slate-400">Events across all your groups</p>
            </div>
          </div>
          <ActivityFeed activities={recentActivity} />
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={() => fetchDashboardData()}
      />
    </div>
  );
};

export default DashboardPage;