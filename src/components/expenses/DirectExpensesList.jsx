import React from 'react'
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters'
import { Receipt, Plus, Trash2, ShoppingCart, Tag, User, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export const DirectExpensesList = ({
  expenses = [],
  members = [],
  currentUserId,
  onOpenNewExpenseModal,
  onDeleteExpense
}) => {
  const memberCount = Math.max(members.length, 1)

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            Historial de Gastos Directos (Único Pago)
          </h3>
          <p className="text-xs text-slate-400">Compras de 1 pago (supermercado, servicios) divididas automáticamente entre miembros</p>
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
          <p className="text-sm font-semibold text-slate-300">No hay gastos directos registrados</p>
          <p className="text-xs text-slate-500 mt-0.5 max-w-md mx-auto">
            Registra tus compras fijas o supermercado. Si tú pagas el 100%, el sistema calculará automáticamente la mitad que tu pareja te debe transferir.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => {
            const payer = members.find(m => m.id === expense.paid_by) || { full_name: 'Miembro' }
            const isPayerCurrentUser = expense.paid_by === currentUserId
            const amount = Number(expense.amount) || 0
            const sharePerMember = amount / memberCount

            return (
              <div
                key={expense.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Expense Title & Category */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {getInitials(payer.full_name)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{expense.description}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                        <span className="text-slate-300 font-semibold flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          Pagó 100%: <span className="text-emerald-400">{payer.full_name}</span>
                        </span>
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

                  {/* Amounts & Delete button */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Monto Total</span>
                      <span className="text-base font-extrabold text-white">
                        {formatCurrency(amount)}
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteExpense(expense.id)}
                      title="Eliminar gasto"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 50/50 Split Breakdown Footer */}
                <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400">Tu parte ({Math.round(100/memberCount)}%):</span>
                    <span className="font-bold text-slate-200">{formatCurrency(sharePerMember)}</span>
                  </div>

                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400">
                      {isPayerCurrentUser ? 'Te deben transferir (50%):' : 'Debes transferir (50%):'}
                    </span>
                    <span className={`font-bold flex items-center gap-1 ${
                      isPayerCurrentUser ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isPayerCurrentUser ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {formatCurrency(sharePerMember)}
                    </span>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
