import React from 'react';
import {
  PlusCircle,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  CheckCircle2,
  FolderPlus,
  Clock,
} from 'lucide-react';
import { formatTimeAgo } from '../utils/formatters';

const actionIcons = {
  EXPENSE_CREATED: { icon: PlusCircle, bg: 'bg-emerald-50 text-emerald-600' },
  EXPENSE_UPDATED: { icon: Edit, bg: 'bg-amber-50 text-amber-600' },
  EXPENSE_DELETED: { icon: Trash2, bg: 'bg-rose-50 text-rose-600' },
  MEMBER_ADDED: { icon: UserPlus, bg: 'bg-sky-50 text-sky-600' },
  MEMBER_REMOVED: { icon: UserMinus, bg: 'bg-slate-100 text-slate-600' },
  SETTLEMENT_RECORDED: { icon: CheckCircle2, bg: 'bg-teal-50 text-teal-600' },
  GROUP_CREATED: { icon: FolderPlus, bg: 'bg-purple-50 text-purple-600' },
  GROUP_UPDATED: { icon: Edit, bg: 'bg-indigo-50 text-indigo-600' },
};

const ActivityFeed = ({ activities = [], emptyMessage = 'No recent activity.' }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs">
        <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-6">
        {activities.map((act, actIdx) => {
          const config = actionIcons[act.action] || {
            icon: Clock,
            bg: 'bg-slate-100 text-slate-600',
          };
          const Icon = config.icon;
          const isLast = actIdx === activities.length - 1;

          return (
            <li key={act._id || actIdx} className="relative pb-6">
              {!isLast && (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                <div
                  className={`relative p-2 rounded-xl flex items-center justify-center ring-4 ring-white shadow-2xs ${config.bg}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">
                      {act.user?.name || 'A member'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatTimeAgo(act.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {act.description}
                  </p>
                  {act.group?.name && (
                    <span className="inline-block mt-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {act.group.name}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ActivityFeed;