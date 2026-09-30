import React from 'react';
import { Receipt, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, categoryMeta } from '../utils/formatters';
import { SkeletonList } from './SkeletonCard';

const ExpensesTab = ({
  expenses = [],
  loading = false,
  currentUserId,
  onEditExpense,
  onDeleteExpense,
  onOpenAddExpense,
}) => {
  if (loading) {
    return <SkeletonList count={4} />;
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
        <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No expenses found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Start adding expenses to automatically track who owes whom.
        </p>
        <button
          onClick={onOpenAddExpense}
          className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 cursor-pointer"
        >
          Add First Expense
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((exp) => {
        const cat = categoryMeta[exp.category] || categoryMeta.Other;
        const isPaidByMe = (exp.paidBy?._id || exp.paidBy) === currentUserId;
        const myShareObj = exp.shares?.find(
          (s) => (s.user?._id || s.user) === currentUserId
        );
        const myShareAmount = myShareObj ? myShareObj.amount : 0;
        const lentAmount = isPaidByMe ? exp.amount - myShareAmount : 0;

        return (
          <div
            key={exp._id}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start space-x-3.5">
              <div
                className={`p-3 rounded-2xl flex-shrink-0 ${cat.bg} ${cat.text} border ${cat.border}`}
              >
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {exp.description}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}
                  >
                    {exp.category}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
                    {exp.splitType}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700">
                    {exp.paidBy?.name || 'Someone'}
                  </span>{' '}
                  paid{' '}
                  <span className="font-bold text-slate-900">
                    {formatCurrency(exp.amount)}
                  </span>{' '}
                  &bull; {formatDate(exp.date)}
                </p>
                {exp.notes && (
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    "{exp.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="text-right">
                {isPaidByMe ? (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      You lent
                    </span>
                    <span className="text-sm font-black text-emerald-600">
                      +{formatCurrency(lentAmount)}
                    </span>
                  </div>
                ) : myShareObj ? (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      You borrowed
                    </span>
                    <span className="text-sm font-black text-rose-600">
                      -{formatCurrency(myShareAmount)}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-slate-400">
                      Not involved
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onEditExpense(exp)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Edit expense"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteExpense(exp._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExpensesTab;