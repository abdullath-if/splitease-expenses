import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';

const SettleModal = ({
  isOpen,
  groupId,
  members = [],
  initialData = null, // { fromId, toId, amount }
  onClose,
  onSettled,
}) => {
  const { addToast } = useToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFrom(initialData.from?._id || initialData.from || '');
      setTo(initialData.to?._id || initialData.to || '');
      setAmount(initialData.amount ? String(initialData.amount) : '');
    } else if (members.length >= 2) {
      setFrom(members[0]._id);
      setTo(members[1]._id);
      setAmount('');
    }
  }, [initialData, members]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      addToast('Please enter a valid settlement amount', 'error');
      return;
    }
    if (from === to) {
      addToast('Payer and recipient cannot be the same member', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/groups/${groupId}/settle`, {
        from,
        to,
        amount: numAmount,
        notes: notes.trim(),
        date,
      });

      if (res.data.success) {
        addToast('Settlement recorded successfully!', 'success');
        onSettled(res.data.settlement);
        onClose();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to record settlement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fromMember = members.find((m) => m._id === from);
  const toMember = members.find((m) => m._id === to);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Record Settlement</h3>
              <p className="text-xs text-slate-500">Mark a debt as paid</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Transaction Indicator */}
        <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={fromMember?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Payer'}
              alt={fromMember?.name}
              className="w-9 h-9 rounded-full bg-white border border-slate-200"
            />
            <div>
              <p className="text-xs text-slate-400 font-medium">Payer</p>
              <p className="text-xs font-bold text-slate-800 truncate max-w-[90px]">
                {fromMember?.name || 'Select'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center px-2">
            <ArrowRight className="w-5 h-5 text-emerald-600 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-700">
              {amount ? formatCurrency(amount) : '₹0.00'}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-right">
            <div>
              <p className="text-xs text-slate-400 font-medium">Recipient</p>
              <p className="text-xs font-bold text-slate-800 truncate max-w-[90px]">
                {toMember?.name || 'Select'}
              </p>
            </div>
            <img
              src={toMember?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Receiver'}
              alt={toMember?.name}
              className="w-9 h-9 rounded-full bg-white border border-slate-200"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Paid By *
              </label>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Paid To *
              </label>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Settlement Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                Payment Method / Note
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="UPI, Cash, Bank Transfer..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

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
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettleModal;