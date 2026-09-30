import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Plus,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, groupTypeMeta } from '../utils/formatters';
import { SkeletonCard } from '../components/SkeletonCard';
import CreateGroupModal from '../components/CreateGroupModal';

const GroupsPage = () => {
  const { addToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/groups');
      if (res.data.success) {
        setGroups(res.data.groups);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      addToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'All' || g.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Your Groups
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your shared expense spaces and track individual balances
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Group</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups by name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Trip', 'Home', 'Couple', 'Other'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedType === type
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <SkeletonCard count={3} />
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {search || selectedType !== 'All'
              ? 'No groups match your search'
              : 'No groups found'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {search || selectedType !== 'All'
              ? 'Try adjusting your filters or search keywords.'
              : 'Create your first group to start recording expenses and calculating settlements.'}
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-5 inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Group</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const meta = groupTypeMeta[group.type] || groupTypeMeta.Other;
            const isOwed = group.myBalance > 0.01;
            const owes = group.myBalance < -0.01;

            return (
              <Link
                key={group._id}
                to={`/groups/${group._id}`}
                className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Badge & Total Spend */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${meta.bg} ${meta.text}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {group.expenseCount || 0} expenses
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {group.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                    {group.description || 'No description provided.'}
                  </p>

                  {/* Members stack */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-2 overflow-hidden">
                      {group.members.slice(0, 4).map((m) => (
                        <img
                          key={m._id}
                          src={
                            m.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`
                          }
                          alt={m.name}
                          title={m.name}
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 object-cover"
                        />
                      ))}
                      {group.members.length > 4 && (
                        <span className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 text-[11px] font-bold text-slate-600">
                          +{group.members.length - 4}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      Total: {formatCurrency(group.totalExpenses || 0)}
                    </span>
                  </div>
                </div>

                {/* Bottom: Net Balance & Arrow */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Your balance
                    </span>
                    <span
                      className={`text-sm font-extrabold ${
                        isOwed
                          ? 'text-emerald-600'
                          : owes
                          ? 'text-rose-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {isOwed
                        ? `You are owed ${formatCurrency(group.myBalance)}`
                        : owes
                        ? `You owe ${formatCurrency(Math.abs(group.myBalance))}`
                        : 'All settled up'}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onGroupCreated={() => fetchGroups()}
      />
    </div>
  );
};

export default GroupsPage;