import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

const BalancesTab = ({
  simplifiedDebts = [],
  memberBalances = [],
  settlementHistory = [],
  currentUserId,
  onSettleDebt,
}) => {
  return (
    <div className="space-y-6">
      {/* Greedy Algorithm Explainer Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Greedy Debt Simplification Engine</span>
            </div>
            <h3 className="text-lg font-bold">Minimal Settlement Graph Matching</h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Calculates each member's net balance (total paid minus total owed), then
              repeatedly pairs the largest debtor with the largest creditor. This guarantees
              resolving all group debts in at most{' '}
              <span className="text-emerald-300 font-bold">N - 1</span> transactions.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center flex-shrink-0">
            <span className="text-xs text-slate-300 block font-medium">
              Optimized Result
            </span>
            <span className="text-2xl font-black text-emerald-300">
              {simplifiedDebts.length}{' '}
              <span className="text-xs font-normal text-white">Transfers</span>
            </span>
          </div>
        </div>
      </div>

      {/* SIMPLIFIED SETTLEMENTS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Simplified Settlements
            </h3>
            <p className="text-xs text-slate-500">
              Follow these transfers to completely settle all debts in the group
            </p>
          </div>
        </div>

        {simplifiedDebts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">
              Everyone is all settled up!
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              There are no outstanding debts in this group.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {simplifiedDebts.map((item, idx) => {
              const isFromMe = item.from?._id === currentUserId;
              const isToMe = item.to?._id === currentUserId;

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    {/* Payer */}
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={
                          item.from?.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.from?.name}`
                        }
                        alt={item.from?.name}
                        className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block truncate max-w-[110px]">
                          {item.from?.name} {isFromMe ? '(You)' : ''}
                        </span>
                        <span className="text-[11px] text-rose-600 font-semibold">
                          Owes
                        </span>
                      </div>
                    </div>

                    {/* Middle Arrow & Amount */}
                    <div className="flex flex-col items-center px-3">
                      <ArrowRight className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-black text-slate-900 mt-0.5">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>

                    {/* Receiver */}
                    <div className="flex items-center space-x-2.5 text-right">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block truncate max-w-[110px]">
                          {item.to?.name} {isToMe ? '(You)' : ''}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold">
                          Receives
                        </span>
                      </div>
                      <img
                        src={
                          item.to?.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.to?.name}`
                        }
                        alt={item.to?.name}
                        className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {isFromMe
                        ? 'You need to pay'
                        : isToMe
                        ? 'You will receive'
                        : 'Group settlement'}
                    </span>
                    <button
                      onClick={() => onSettleDebt(item)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Settle Up</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* NET BALANCES BY MEMBER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Member Net Balances
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Net position calculated as (Total Paid − Total Owed + Net Settled)
        </p>

        <div className="divide-y divide-slate-100">
          {memberBalances.map((mb) => {
            const isPositive = mb.netBalance > 0.01;
            const isNegative = mb.netBalance < -0.01;

            return (
              <div
                key={mb.user?._id}
                className="py-3 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      mb.user?.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${mb.user?.name}`
                    }
                    alt={mb.user?.name}
                    className="w-8 h-8 rounded-full bg-slate-100"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800">
                      {mb.user?.name} {mb.user?._id === currentUserId ? '(You)' : ''}
                    </span>
                    <span className="text-xs text-slate-400 block">
                      {mb.user?.email}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-black px-2.5 py-1 rounded-xl ${
                      isPositive
                        ? 'bg-emerald-50 text-emerald-700'
                        : isNegative
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isPositive
                      ? `+${formatCurrency(mb.netBalance)}`
                      : isNegative
                      ? `-${formatCurrency(Math.abs(mb.netBalance))}`
                      : 'Settled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SETTLEMENT HISTORY */}
      {settlementHistory?.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Settlement History
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Completed payments recorded in this group
          </p>

          <div className="divide-y divide-slate-100">
            {settlementHistory.map((s) => (
              <div
                key={s._id}
                className="py-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">{s.from?.name}</span>
                  <span className="text-slate-400">paid</span>
                  <span className="font-semibold text-slate-800">{s.to?.name}</span>
                  {s.notes && (
                    <span className="text-slate-400 italic">({s.notes})</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 block">
                    {formatCurrency(s.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDate(s.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BalancesTab;