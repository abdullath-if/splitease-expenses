import React from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const MembersTab = ({
  members = [],
  createdBy,
  memberBalances = [],
  currentUserId,
  onOpenAddMember,
  onConfirmRemoveMember,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">
          Group Members ({members.length})
        </h3>
        <button
          onClick={onOpenAddMember}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {members.map((member) => {
          const createdById = createdBy?._id || createdBy;
          const isAdmin = member._id === createdById;
          const isMe = member._id === currentUserId;
          const mb = memberBalances.find((b) => b.user?._id === member._id);
          const net = mb ? mb.netBalance : 0;

          return (
            <div
              key={member._id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      member.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`
                    }
                    alt={member.name}
                    className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {member.name} {isMe ? '(You)' : ''}
                    </h4>
                    <p className="text-xs text-slate-400 truncate max-w-[160px]">
                      {member.email}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Balance:{' '}
                  <strong
                    className={
                      net > 0.01
                        ? 'text-emerald-600'
                        : net < -0.01
                        ? 'text-rose-600'
                        : 'text-slate-600'
                    }
                  >
                    {formatCurrency(net)}
                  </strong>
                </span>

                {!isAdmin && !isMe && (
                  <button
                    onClick={() => onConfirmRemoveMember(member)}
                    className="text-xs text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove member"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MembersTab;