import React from 'react'
import { formatCurrency, getInitials } from '../../utils/formatters'
import { Scale, HandCoins, CheckCircle, ArrowUpRight, ArrowDownRight, Receipt } from 'lucide-react'

export const BalanceOverview = ({
  currentUserId,
  members = [],
  summary = {},
  onOpenSettlementModal
}) => {
  const {
    totalDirectExpenses = 0,
    paidByUserDirect = 0,
    userFairShareExpenses = 0,
    directExpenseNet = 0,
    settlementNet = 0
  } = summary

  // Net balance combining direct shared expenses and past settlements
  const netBalance = directExpenseNet + settlementNet

  // Partner or other member info
  const otherMembers = members.filter(m => m.id !== currentUserId)
  const partner = otherMembers[0] || { full_name: 'Tu Pareja / Familiar' }

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Liquidación de Gastos Directos con {partner.full_name}
            </h3>
            <p className="text-xs text-slate-400">Balance de compras de 1 pago (supermercado, servicios) y transferencias de saldo</p>
          </div>
        </div>

        <button
          onClick={onOpenSettlementModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all shrink-0"
        >
          <HandCoins className="w-4 h-4" />
          <span>Registrar Transferencia / Saldo</span>
        </button>
      </div>

      {/* Detailed Math Breakdown Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-slate-400 block mb-1">Pagado 100% de tu bolsillo</span>
          <span className="text-lg font-extrabold text-white">{formatCurrency(paidByUserDirect)}</span>
          <p className="text-[11px] text-slate-500 mt-1">Gastos directos que abonaste tú este mes</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-slate-400 block mb-1">Tu cuota justa (50%)</span>
          <span className="text-lg font-extrabold text-brand-300">{formatCurrency(userFairShareExpenses)}</span>
          <p className="text-[11px] text-slate-500 mt-1">Tu mitad sobre el total de ${formatCurrency(totalDirectExpenses)}</p>
        </div>

        <div className={`p-4 rounded-2xl border text-xs ${
          netBalance > 0
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : netBalance < 0
            ? 'bg-rose-500/10 border-rose-500/30'
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <span className="text-slate-400 block mb-1">
            {netBalance > 0 ? 'Saldo a favor (Te deben)' : netBalance < 0 ? 'Saldo en contra (Debes)' : 'Estado del saldo'}
          </span>
          <span className={`text-lg font-extrabold ${
            netBalance > 0 ? 'text-emerald-400' : netBalance < 0 ? 'text-rose-400' : 'text-slate-200'
          }`}>
            {netBalance > 0 ? `+ ${formatCurrency(netBalance)}` : netBalance < 0 ? `- ${formatCurrency(Math.abs(netBalance))}` : '$0 (Al día)'}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">
            {netBalance > 0 ? `${partner.full_name} debe transferirte este monto` : netBalance < 0 ? `Debes transferir este monto a ${partner.full_name}` : 'No hay deudas pendientes'}
          </p>
        </div>
      </div>
    </div>
  )
}
