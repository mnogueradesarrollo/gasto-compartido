import React from 'react'
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters'
import { Receipt, Plus, Trash2, ShoppingCart, Tag } from 'lucide-react'

export const DirectExpensesList = ({
  expenses = [],
  members = [],
  currentUserId,
  onOpenNewExpenseModal,
  onDeleteExpense
}) => {
  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            Gastos Directos (Único Pago)
          </h3>
          <p className="text-xs text-slate-400">Supermercado, servicios y compras divididas al instante</p>
        </div>

        <button
          onClick={onOpenNewExpenseModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Gasto Directo</span>
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No hay gastos directos este mes</p>
          <p className="text-xs text-slate-500 mt-0.5">Registra compras de supermercado o servicios para calcular el saldo compartido.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => {
            const payer = members.find(m => m.id === expense.paid_by) || { full_name: 'Miembro' }
            const isCurrentUser = expense.paid_by === currentUserId

            return (
              <div
                key={expense.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 font-bold text-xs flex items-center justify-center text-slate-200">
                    {getInitials(payer.full_name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{expense.description}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="text-emerald-400 font-semibold">{payer.full_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {expense.category || 'General'}
                      </span>
                      <span>•</span>
                      <span>{formatDate(expense.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-base font-extrabold text-white">
                    {formatCurrency(expense.amount)}
                  </span>
                  <button
                    onClick={() => onDeleteExpense(expense.id)}
                    title="Eliminar gasto"
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
