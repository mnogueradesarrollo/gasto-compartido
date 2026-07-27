import React from 'react'
import { formatCurrency, getInitials } from '../../utils/formatters'
import { Scale, ArrowRightLeft, HandCoins, CheckCircle, AlertCircle } from 'lucide-react'

export const BalanceOverview = ({
  currentUserId,
  members = [],
  summary = {},
  onOpenSettlementModal
}) => {
  const { directExpenseNet = 0, settlementNet = 0 } = summary

  // Net balance combining direct shared expenses and past settlements
  const netBalance = directExpenseNet + settlementNet

  // Partner or other member info
  const otherMembers = members.filter(m => m.id !== currentUserId)
  const partner = otherMembers[0] || { full_name: 'Tu Pareja / Familiar' }

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Estado de Cuenta entre Miembros
            </h3>
            <p className="text-xs text-slate-400">Balance de gastos directos y transferencias de compensación</p>
          </div>
        </div>

        <button
          onClick={onOpenSettlementModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
        >
          <HandCoins className="w-4 h-4" />
          <span>Registrar Liquidación</span>
        </button>
      </div>

      {/* Balance Summary Box */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center">
            {getInitials(partner.full_name)}
          </div>
          <div>
            <span className="text-xs text-slate-400">Con respecto a</span>
            <h4 className="text-sm font-bold text-slate-100">{partner.full_name}</h4>
          </div>
        </div>

        <div className="text-center sm:text-right">
          {Math.abs(netBalance) < 1 ? (
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>Cuentas al día (Saldo $0)</span>
            </div>
          ) : netBalance > 0 ? (
            <div>
              <span className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider">
                Te deben a ti
              </span>
              <p className="text-xl font-extrabold text-emerald-400">
                + {formatCurrency(netBalance)}
              </p>
            </div>
          ) : (
            <div>
              <span className="text-[11px] text-rose-400 uppercase font-bold tracking-wider">
                Tú debes abonar
              </span>
              <p className="text-xl font-extrabold text-rose-400">
                - {formatCurrency(Math.abs(netBalance))}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
