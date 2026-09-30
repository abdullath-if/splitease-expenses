import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Calendar, Sparkles, Check } from 'lucide-react';
import { formatDate } from '../utils/formatters';

const avatarPresets = [
  'AlexRivera',
  'PriyaSharma',
  'AmanVerma',
  'SarahChen',
  'CarlosGomez',
  'Felix',
  'Luna',
  'Leo',
  'Zoe',
  'Milo',
];

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(
    user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=SplitEase'
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Name cannot be empty', 'error');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ name: name.trim(), avatar: selectedAvatar });
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      addToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Your Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details and custom avatar
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Avatar preview */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-slate-100">
            <div className="relative group">
              <img
                src={selectedAvatar}
                alt={name}
                className="w-24 h-24 rounded-full bg-slate-50 border-2 border-emerald-500 shadow-md object-cover"
              />
              <span className="absolute bottom-0 right-0 p-1 bg-emerald-500 text-white rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">{name || 'Your Name'}</h3>
              <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email}</span>
              </p>
              <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Member since {formatDate(user?.createdAt || Date.now())}</span>
              </p>
            </div>
          </div>

          {/* Avatar Presets Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
              Choose an Avatar Preset
            </label>
            <div className="grid grid-cols-5 gap-3">
              {avatarPresets.map((seed) => {
                const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                const isSelected = selectedAvatar === url;
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`relative p-1.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 scale-105 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <img
                      src={url}
                      alt={seed}
                      className="w-full h-auto rounded-full bg-slate-100"
                    />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 p-0.5 bg-emerald-600 text-white rounded-full">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address (Fixed)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;