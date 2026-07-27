import React from 'react'
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters'
import { HandCoins, ArrowRight } from 'lucide-react'

export const SettlementHistory = ({ settlements = [], members = [] }) => {
  if (settlements.length === 0) return null

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 mb-8">
      <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2 mb-4">
        <HandCoins className="w-4 h-4 text-purple-400" />
        Historial de Liquidaciones & Transferencias
      </h3>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {settlements.map((s) => {
          const payer = members.find(m => m.id === s.payer_id) || { full_name: 'Pagador' }
          const receiver = members.find(m => m.id === s.receiver_id) || { full_name: 'Receptor' }

          return (
            <div
              key={s.id}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">{payer.full_name}</span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold text-slate-200">{receiver.full_name}</span>
                {s.notes && (
                  <span className="text-slate-500 italic ml-2 hidden sm:inline">
                    ({s.notes})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="font-extrabold text-purple-300">
                  {formatCurrency(s.amount)}
                </span>
                <span className="text-[11px] text-slate-500">{formatDate(s.date)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
