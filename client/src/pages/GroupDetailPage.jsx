import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Receipt,
  Scale,
  Activity,
  Plus,
  CheckCircle2,
  UserPlus,
  Search,
  ArrowLeft,
} from 'lucide-react';
import {
  formatCurrency,
  categoryMeta,
  groupTypeMeta,
} from '../utils/formatters';
import ExpenseModal from '../components/ExpenseModal';
import SettleModal from '../components/SettleModal';
import AddMemberModal from '../components/AddMemberModal';
import ConfirmModal from '../components/ConfirmModal';
import ActivityFeed from '../components/ActivityFeed';
import ExpensesTab from '../components/ExpensesTab';
import BalancesTab from '../components/BalancesTab';
import MembersTab from '../components/MembersTab';

const GroupDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('expenses');
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balancesData, setBalancesData] = useState({
    totalGroupSpent: 0,
    memberBalances: [],
    simplifiedDebts: [],
    settlementHistory: [],
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for expenses tab
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [payerFilter, setPayerFilter] = useState('All');

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleInitialData, setSettleInitialData] = useState(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    expenseId: null,
    loading: false,
  });
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState({
    isOpen: false,
    member: null,
    loading: false,
  });

  const fetchAllGroupData = useCallback(async () => {
    try {
      setLoading(true);
      const [groupRes, expensesRes, balancesRes, activityRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/groups/${id}/expenses`),
        api.get(`/groups/${id}/balances`),
        api.get(`/groups/${id}/activity`),
      ]);

      if (groupRes.data.success) setGroup(groupRes.data.group);
      if (expensesRes.data.success) setExpenses(expensesRes.data.expenses);
      if (balancesRes.data.success) setBalancesData(balancesRes.data);
      if (activityRes.data.success) setActivities(activityRes.data.activity);
    } catch (err) {
      console.error('Error fetching group data:', err);
      addToast(err.response?.data?.message || 'Failed to load group details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchAllGroupData();
  }, [fetchAllGroupData]);

  const handleDeleteExpense = async () => {
    if (!deleteConfirm.expenseId) return;
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      const res = await api.delete(`/expenses/${deleteConfirm.expenseId}`);
      if (res.data.success) {
        addToast('Expense deleted successfully', 'success');
        setDeleteConfirm({ isOpen: false, expenseId: null, loading: false });
        fetchAllGroupData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete expense', 'error');
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberConfirm.member) return;
    setRemoveMemberConfirm((prev) => ({ ...prev, loading: true }));
    try {
      const res = await api.delete(
        `/groups/${id}/members/${removeMemberConfirm.member._id}`
      );
      if (res.data.success) {
        addToast(`${removeMemberConfirm.member.name} removed from group`, 'success');
        setRemoveMemberConfirm({ isOpen: false, member: null, loading: false });
        fetchAllGroupData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove member', 'error');
      setRemoveMemberConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.description
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || exp.category === categoryFilter;
    const matchesPayer =
      payerFilter === 'All' ||
      (exp.paidBy?._id || exp.paidBy) === payerFilter;
    return matchesSearch && matchesCat && matchesPayer;
  });

  const currentMemberNet =
    balancesData.memberBalances.find((mb) => mb.user?._id === user?._id)
      ?.netBalance || 0;

  const meta = groupTypeMeta[group?.type] || groupTypeMeta.Other;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link
          to="/groups"
          className="flex items-center space-x-1 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Groups</span>
        </Link>
      </div>

      {/* Main Group Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${meta.bg} ${meta.text}`}
              >
                {meta.label}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {group?.members?.length || 0} members
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {group?.name}
            </h1>

            {group?.description && (
              <p className="text-sm text-slate-600 max-w-2xl">
                {group.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setExpenseToEdit(null);
                setIsExpenseModalOpen(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>

            <button
              onClick={() => {
                setSettleInitialData(null);
                setIsSettleModalOpen(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settle Up</span>
            </button>

            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
              title="Add member by email"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Group Spend
            </span>
            <span className="text-lg font-black text-slate-900">
              {formatCurrency(balancesData.totalGroupSpent)}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Your Net Balance
            </span>
            <span
              className={`text-lg font-black ${
                currentMemberNet > 0.01
                  ? 'text-emerald-600'
                  : currentMemberNet < -0.01
                  ? 'text-rose-600'
                  : 'text-slate-600'
              }`}
            >
              {currentMemberNet > 0.01
                ? `+${formatCurrency(currentMemberNet)} (Owed)`
                : currentMemberNet < -0.01
                ? `-${formatCurrency(Math.abs(currentMemberNet))} (You owe)`
                : 'Settled up'}
            </span>
          </div>

          <div className="hidden sm:block">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Simplified Debts
            </span>
            <span className="text-lg font-black text-teal-700">
              {balancesData.simplifiedDebts.length} pending{' '}
              {balancesData.simplifiedDebts.length === 1
                ? 'transaction'
                : 'transactions'}
            </span>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4">
          {[
            { id: 'expenses', label: 'Expenses', icon: Receipt, count: expenses.length },
            {
              id: 'balances',
              label: 'Balances & Settlements',
              icon: Scale,
              badge: balancesData.simplifiedDebts.length > 0 ? `${balancesData.simplifiedDebts.length}` : null,
            },
            { id: 'members', label: 'Members', icon: Users, count: group?.members?.length },
            { id: 'activity', label: 'Activity Log', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 font-bold text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 text-[11px] px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB CONTENT PANELS */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex space-x-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="All">All Categories</option>
                {Object.keys(categoryMeta).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={payerFilter}
                onChange={(e) => setPayerFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="All">All Payers</option>
                {group?.members?.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ExpensesTab
            expenses={filteredExpenses}
            loading={loading}
            currentUserId={user?._id}
            onEditExpense={(exp) => {
              setExpenseToEdit(exp);
              setIsExpenseModalOpen(true);
            }}
            onDeleteExpense={(expId) =>
              setDeleteConfirm({ isOpen: true, expenseId: expId, loading: false })
            }
            onOpenAddExpense={() => {
              setExpenseToEdit(null);
              setIsExpenseModalOpen(true);
            }}
          />
        </div>
      )}

      {activeTab === 'balances' && (
        <BalancesTab
          simplifiedDebts={balancesData.simplifiedDebts}
          memberBalances={balancesData.memberBalances}
          settlementHistory={balancesData.settlementHistory}
          currentUserId={user?._id}
          onSettleDebt={(debtItem) => {
            setSettleInitialData({
              from: debtItem.from?._id,
              to: debtItem.to?._id,
              amount: debtItem.amount,
            });
            setIsSettleModalOpen(true);
          }}
        />
      )}

      {activeTab === 'members' && (
        <MembersTab
          members={group?.members || []}
          createdBy={group?.createdBy}
          memberBalances={balancesData.memberBalances}
          currentUserId={user?._id}
          onOpenAddMember={() => setIsAddMemberOpen(true)}
          onConfirmRemoveMember={(member) =>
            setRemoveMemberConfirm({ isOpen: true, member, loading: false })
          }
        />
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Group Activity Feed
          </h3>
          <ActivityFeed
            activities={activities}
            emptyMessage="No activity recorded in this group yet."
          />
        </div>
      )}

      {/* MODALS */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        groupId={id}
        members={group?.members || []}
        currentUserId={user?._id}
        expenseToEdit={expenseToEdit}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        onExpenseSaved={() => fetchAllGroupData()}
      />

      <SettleModal
        isOpen={isSettleModalOpen}
        groupId={id}
        members={group?.members || []}
        initialData={settleInitialData}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSettleInitialData(null);
        }}
        onSettled={() => fetchAllGroupData()}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        groupId={id}
        onClose={() => setIsAddMemberOpen(false)}
        onMemberAdded={() => fetchAllGroupData()}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Expense"
        message="Are you sure you want to remove this expense? Group balances will be automatically recalculated."
        confirmText="Delete"
        loading={deleteConfirm.loading}
        onConfirm={handleDeleteExpense}
        onCancel={() =>
          setDeleteConfirm({ isOpen: false, expenseId: null, loading: false })
        }
      />

      <ConfirmModal
        isOpen={removeMemberConfirm.isOpen}
        title="Remove Member"
        message={`Are you sure you want to remove ${removeMemberConfirm.member?.name}? Note that members with non-zero balances cannot be removed until settled.`}
        confirmText="Remove"
        loading={removeMemberConfirm.loading}
        onConfirm={handleRemoveMember}
        onCancel={() =>
          setRemoveMemberConfirm({ isOpen: false, member: null, loading: false })
        }
      />
    </div>
  );
};

export default GroupDetailPage;