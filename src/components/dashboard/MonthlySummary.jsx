import React from 'react'
import { StatCard } from '../common/StatCard'
import { StatusBadge } from '../common/StatusBadge'
import { formatCurrency, getCurrentMonthLabel } from '../../utils/formatters'
import { Calendar, CreditCard, CheckCircle2, Clock, Receipt, HandCoins, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export const MonthlySummary = ({ summary = {}, userName }) => {
  const {
    totalInstallmentAmount = 0,
    paidInstallmentAmount = 0,
    pendingInstallmentAmount = 0,
    totalDirectExpenses = 0,
    paidByUserDirect = 0,
    userFairShareExpenses = 0,
    directExpenseNet = 0,
    settlementNet = 0,
    statusKey = 'up_to_date'
  } = summary

  const installmentProgress = totalInstallmentAmount > 0 
    ? Math.min(100, Math.round((paidInstallmentAmount / totalInstallmentAmount) * 100))
    : 100

  // Total balance combining direct expenses and past settlements
  const totalNetBalance = directExpenseNet + settlementNet

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden mb-8">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Calendar className="w-4 h-4 text-brand-400" />
            <span className="capitalize">{getCurrentMonthLabel()}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Resumen General de {userName}
          </h2>
        </div>
        <div>
          <StatusBadge statusKey={statusKey} />
        </div>
      </div>

      {/* Dues Progress Bar */}
      <div className="my-6">
        <div className="flex justify-between items-center text-xs font-semibold mb-2">
          <span className="text-slate-300 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-brand-400" />
            Progreso de Cuotas del Mes
          </span>
          <span className="text-brand-300 font-bold">{installmentProgress}% completado</span>
        </div>
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${installmentProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Metric Stat Cards Grid: Section 1 (Compras en Cuotas) & Section 2 (Gastos Directos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <StatCard
          title="Cuotas del Mes"
          value={formatCurrency(totalInstallmentAmount)}
          subtitle="Tus vencimientos de compras financiadas"
          icon={CreditCard}
          color="brand"
        />

        <StatCard
          title="Cuotas Pagadas"
          value={formatCurrency(paidInstallmentAmount)}
          subtitle={`Falta abonar ${formatCurrency(pendingInstallmentAmount)}`}
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Gastos Directos (Total)"
          value={formatCurrency(totalDirectExpenses)}
          subtitle={`Pagaste el 100%: ${formatCurrency(paidByUserDirect)}`}
          icon={Receipt}
          color="amber"
        />

        <StatCard
          title="Saldo a Cobrar / Pagar"
          value={totalNetBalance >= 0 ? `+ ${formatCurrency(totalNetBalance)}` : `- ${formatCurrency(Math.abs(totalNetBalance))}`}
          subtitle={totalNetBalance >= 0 ? 'Tu pareja debe transferirte esta parte' : 'Debes transferir a tu pareja'}
          icon={totalNetBalance >= 0 ? ArrowUpRight : ArrowDownRight}
          color={totalNetBalance >= 0 ? "emerald" : "rose"}
        />

      </div>
    </div>
  )
}
