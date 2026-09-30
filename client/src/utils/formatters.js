export const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateInput);
};

export const categoryMeta = {
  Food: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    color: '#f59e0b',
    icon: 'Utensils',
  },
  Transport: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    color: '#0284c7',
    icon: 'Car',
  },
  Lodging: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    color: '#9333ea',
    icon: 'Hotel',
  },
  Entertainment: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    color: '#ec4899',
    icon: 'Ticket',
  },
  Utilities: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    color: '#10b981',
    icon: 'Zap',
  },
  Groceries: {
    bg: 'bg-lime-50',
    text: 'text-lime-700',
    border: 'border-lime-200',
    color: '#84cc16',
    icon: 'ShoppingBag',
  },
  Shopping: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    color: '#6366f1',
    icon: 'Tag',
  },
  Other: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    color: '#64748b',
    icon: 'Receipt',
  },
};

export const groupTypeMeta = {
  Trip: { bg: 'bg-sky-100', text: 'text-sky-800', label: 'Trip 🏖️' },
  Home: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Home 🏠' },
  Couple: { bg: 'bg-pink-100', text: 'text-pink-800', label: 'Couple 💑' },
  Other: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Other 👥' },
};