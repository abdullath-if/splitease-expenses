import React, { useState, useEffect } from 'react';
import {
  X,
  Receipt,
  Utensils,
  Car,
  Hotel,
  Ticket,
  Zap,
  ShoppingBag,
  Tag,
  Check,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';

const categories = [
  { id: 'Food', label: 'Food', icon: Utensils },
  { id: 'Transport', label: 'Transport', icon: Car },
  { id: 'Lodging', label: 'Lodging', icon: Hotel },
  { id: 'Entertainment', label: 'Entertainment', icon: Ticket },
  { id: 'Utilities', label: 'Utilities', icon: Zap },
  { id: 'Groceries', label: 'Groceries', icon: ShoppingBag },
  { id: 'Shopping', label: 'Shopping', icon: Tag },
  { id: 'Other', label: 'Other', icon: Receipt },
];

const ExpenseModal = ({
  isOpen,
  groupId,
  members = [],
  currentUserId,
  expenseToEdit = null,
  onClose,
  onExpenseSaved,
}) => {
  const { addToast } = useToast();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState('Food');
  const [splitType, setSplitType] = useState('equal');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Equal split: array of user IDs checked
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Exact split: { [userId]: number/string }
  const [exactShares, setExactShares] = useState({});

  // Percentage split: { [userId]: number/string }
  const [percentShares, setPercentShares] = useState({});

  const [loading, setLoading] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description || '');
      setAmount(String(expenseToEdit.amount || ''));
      setPaidBy(expenseToEdit.paidBy?._id || expenseToEdit.paidBy || currentUserId);
      setCategory(expenseToEdit.category || 'Food');
      setSplitType(expenseToEdit.splitType || 'equal');
      setDate(
        expenseToEdit.date
          ? new Date(expenseToEdit.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setNotes(expenseToEdit.notes || '');

      // Populate shares
      const userIds = [];
      const exactObj = {};
      const pctObj = {};

      if (Array.isArray(expenseToEdit.shares)) {
        expenseToEdit.shares.forEach((s) => {
          const uId = s.user?._id || s.user;
          userIds.push(uId);
          exactObj[uId] = s.amount;
          pctObj[uId] = s.percentage;
        });
      }
      setSelectedUserIds(userIds);
      setExactShares(exactObj);
      setPercentShares(pctObj);
    } else {
      // New expense defaults
      setDescription('');
      setAmount('');
      setPaidBy(currentUserId || (members[0]?._id || ''));
      setCategory('Food');
      setSplitType('equal');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');

      // All members selected by default for equal
      const allIds = members.map((m) => m._id);
      setSelectedUserIds(allIds);

      // Initialize exact & percent templates
      const exactObj = {};
      const pctObj = {};
      const evenPct = members.length > 0 ? (100 / members.length).toFixed(1) : 0;
      members.forEach((m) => {
        exactObj[m._id] = '';
        pctObj[m._id] = evenPct;
      });
      setExactShares(exactObj);
      setPercentShares(pctObj);
    }
  }, [expenseToEdit, members, currentUserId, isOpen]);

  if (!isOpen) return null;

  const numAmount = Number(amount || 0);

  // Calculations for Equal Split
  const equalCount = selectedUserIds.length;
  const equalSharePerPerson =
    equalCount > 0 && numAmount > 0
      ? (numAmount / equalCount).toFixed(2)
      : '0.00';

  // Calculations for Exact Split
  const exactSum = Object.values(exactShares).reduce(
    (sum, val) => sum + Number(val || 0),
    0
  );
  const exactDiff = Math.round((numAmount - exactSum) * 100) / 100;
  const isExactValid = Math.abs(exactDiff) < 0.02 && numAmount > 0;

  // Calculations for Percentage Split
  const percentSum = Object.values(percentShares).reduce(
    (sum, val) => sum + Number(val || 0),
    0
  );
  const percentDiff = Math.round((100 - percentSum) * 10) / 10;
  const isPercentValid = Math.abs(percentDiff) < 0.1 && numAmount > 0;

  const toggleUserEqual = (userId) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length === 1) {
        addToast('At least one member must be selected', 'info');
        return;
      }
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleExactChange = (userId, val) => {
    setExactShares((prev) => ({ ...prev, [userId]: val }));
  };

  const handlePercentChange = (userId, val) => {
    setPercentShares((prev) => ({ ...prev, [userId]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      addToast('Please enter an expense description', 'error');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      addToast('Please enter an expense amount greater than 0', 'error');
      return;
    }
    if (!paidBy) {
      addToast('Please select who paid for this expense', 'error');
      return;
    }

    // Build payload shares
    let shares = [];
    if (splitType === 'equal') {
      if (selectedUserIds.length === 0) {
        addToast('Please select at least one member to split with', 'error');
        return;
      }
      shares = selectedUserIds.map((userId) => ({ user: userId }));
    } else if (splitType === 'exact') {
      if (!isExactValid) {
        addToast(
          `Exact shares sum (₹${exactSum.toFixed(2)}) must equal total amount (₹${numAmount.toFixed(2)})`,
          'error'
        );
        return;
      }
      shares = members.map((m) => ({
        user: m._id,
        amount: Number(exactShares[m._id] || 0),
      }));
    } else if (splitType === 'percentage') {
      if (!isPercentValid) {
        addToast(`Percentages sum (${percentSum}%) must equal 100%`, 'error');
        return;
      }
      shares = members.map((m) => ({
        user: m._id,
        percentage: Number(percentShares[m._id] || 0),
      }));
    }

    setLoading(true);
    try {
      const payload = {
        description: description.trim(),
        amount: numAmount,
        paidBy,
        category,
        splitType,
        shares,
        date,
        notes: notes.trim(),
      };

      let res;
      if (expenseToEdit) {
        res = await api.put(`/expenses/${expenseToEdit._id}`, payload);
        addToast('Expense updated successfully!', 'success');
      } else {
        res = await api.post(`/groups/${groupId}/expenses`, payload);
        addToast('Expense created successfully!', 'success');
      }

      if (res.data.success) {
        onExpenseSaved(res.data.expense);
        onClose();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save expense', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {expenseToEdit ? 'Edit Expense' : 'Add an Expense'}
              </h3>
              <p className="text-xs text-slate-500">Record group expense with smart splits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Description *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Seafood Dinner, Villa Rental"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Paid By & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Paid By *
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} {m._id === currentUserId ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SPLIT TYPE TABS */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Split Type
              </label>
              <span className="text-xs text-slate-500">
                Choose how costs are divided
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setSplitType('equal')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  splitType === 'equal'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                = Equal
              </button>
              <button
                type="button"
                onClick={() => setSplitType('exact')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  splitType === 'exact'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ₹ Exact
              </button>
              <button
                type="button"
                onClick={() => setSplitType('percentage')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  splitType === 'percentage'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                % Percentage
              </button>
            </div>
          </div>

          {/* SPLIT TYPE DETAIL PANELS */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            {/* 1. EQUAL SPLIT */}
            {splitType === 'equal' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-medium text-slate-600">
                    Split equally among selected members:
                  </p>
                  <span className="text-xs font-bold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-100">
                    ₹{equalSharePerPerson} / person
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {members.map((m) => {
                    const isChecked = selectedUserIds.includes(m._id);
                    return (
                      <div
                        key={m._id}
                        onClick={() => toggleUserEqual(m._id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-white border-emerald-300 shadow-2xs'
                            : 'bg-slate-100/50 border-transparent opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                              isChecked
                                ? 'bg-emerald-600 text-white'
                                : 'border border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <img
                            src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                            alt={m.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-xs font-semibold text-slate-800">
                            {m.name} {m._id === currentUserId ? '(You)' : ''}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {isChecked ? `₹${equalSharePerPerson}` : '₹0.00'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. EXACT SPLIT */}
            {splitType === 'exact' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-medium text-slate-600">
                    Enter exact amounts for each member:
                  </p>
                  <div
                    className={`flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                      isExactValid
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    <span>
                      Total: ₹{exactSum.toFixed(2)} / ₹{numAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {!isExactValid && numAmount > 0 && (
                  <p className="text-[11px] text-rose-600 font-medium mb-2 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>
                      {exactDiff > 0
                        ? `₹${exactDiff.toFixed(2)} remaining to allocate`
                        : `₹${Math.abs(exactDiff).toFixed(2)} over allocated`}
                    </span>
                  </p>
                )}

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {members.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200"
                    >
                      <div className="flex items-center space-x-2">
                        <img
                          src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                          alt={m.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                          {m.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 w-32">
                        <span className="text-xs text-slate-400 font-semibold">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={exactShares[m._id] || ''}
                          onChange={(e) => handleExactChange(m._id, e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1 text-xs font-semibold text-right rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. PERCENTAGE SPLIT */}
            {splitType === 'percentage' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-medium text-slate-600">
                    Enter percentage share per member:
                  </p>
                  <div
                    className={`flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                      isPercentValid
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    <span>Total: {percentSum}% / 100%</span>
                  </div>
                </div>

                {!isPercentValid && (
                  <p className="text-[11px] text-rose-600 font-medium mb-2 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>
                      {percentDiff > 0
                        ? `${percentDiff.toFixed(1)}% remaining`
                        : `${Math.abs(percentDiff).toFixed(1)}% over 100%`}
                    </span>
                  </p>
                )}

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {members.map((m) => {
                    const pct = Number(percentShares[m._id] || 0);
                    const calcAmount = numAmount > 0 ? ((pct / 100) * numAmount).toFixed(2) : '0.00';
                    return (
                      <div
                        key={m._id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200"
                      >
                        <div className="flex items-center space-x-2">
                          <img
                            src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                            alt={m.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <div>
                            <span className="text-xs font-semibold text-slate-800 block truncate max-w-[130px]">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-medium">
                              ≈ ₹{calcAmount}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 w-24">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={percentShares[m._id] || ''}
                            onChange={(e) => handlePercentChange(m._id, e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1 text-xs font-semibold text-right rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="text-xs text-slate-400 font-semibold">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bill number, payment remarks..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                (splitType === 'exact' && !isExactValid) ||
                (splitType === 'percentage' && !isPercentValid)
              }
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Saving...' : expenseToEdit ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;