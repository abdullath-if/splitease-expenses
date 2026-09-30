import React, { useState } from 'react';
import { X, Users, Compass, Home, Heart, MoreHorizontal, Plus } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const groupTypes = [
  { id: 'Trip', label: 'Trip', icon: Compass, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { id: 'Home', label: 'Home', icon: Home, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'Couple', label: 'Couple', icon: Heart, color: 'text-pink-600 bg-pink-50 border-pink-200' },
  { id: 'Other', label: 'Other', icon: MoreHorizontal, color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState('Trip');
  const [description, setDescription] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [memberEmails, setMemberEmails] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddEmail = (e) => {
    e?.preventDefault();
    const email = memberInput.trim().toLowerCase();
    if (!email) return;

    if (!email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
      addToast('Please enter a valid email address', 'error');
      return;
    }

    if (memberEmails.includes(email)) {
      addToast('Email already added', 'info');
      return;
    }

    setMemberEmails([...memberEmails, email]);
    setMemberInput('');
  };

  const handleRemoveEmail = (emailToRemove) => {
    setMemberEmails(memberEmails.filter((e) => e !== emailToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Please enter a group name', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/groups', {
        name: name.trim(),
        type,
        description: description.trim(),
        memberEmails,
      });

      if (res.data.success) {
        addToast('Group created successfully!', 'success');
        onGroupCreated(res.data.group);
        onClose();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create group', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Create New Group</h3>
              <p className="text-xs text-slate-500">Track and split expenses together</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Group Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goa Trip, Flatmates, Euro Tour"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Group Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {groupTypes.map((gt) => {
                const Icon = gt.icon;
                const isSelected = type === gt.id;
                return (
                  <button
                    key={gt.id}
                    type="button"
                    onClick={() => setType(gt.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-1 ${
                        isSelected ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? 'text-emerald-900 font-semibold' : 'text-slate-600'
                      }`}
                    >
                      {gt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief note about the group..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Add Members by Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Add Members by Email
            </label>
            <div className="flex space-x-2">
              <input
                type="email"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
                placeholder="friend@example.com"
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Added member badges */}
            {memberEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                {memberEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              You are automatically added as the group creator.
            </p>
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
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;