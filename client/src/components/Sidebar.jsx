import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  User,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, onOpenCreateGroup }) => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/groups', label: 'Groups', icon: Users },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-40 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Quick Create Group Button */}
          {onOpenCreateGroup && (
            <button
              onClick={() => {
                onClose();
                onOpenCreateGroup();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200/80 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Group</span>
            </button>
          )}

          {/* Navigation links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Algorithm Highlight Card */}
        <div className="p-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 border border-emerald-100/80">
            <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-xs mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Greedy Debt Simplifier</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Greedily balances largest creditors with largest debtors to minimize
              settlements to at most N-1 transactions.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;