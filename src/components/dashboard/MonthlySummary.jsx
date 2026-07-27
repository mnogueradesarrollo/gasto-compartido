import React from 'react'
import { StatCard } from '../common/StatCard'
import { StatusBadge } from '../common/StatusBadge'
import { formatCurrency, getCurrentMonthLabel } from '../../utils/formatters'
import { Calendar, CreditCard, CheckCircle2, Clock, DollarSign, PieChart } from 'lucide-react'

export const MonthlySummary = ({ summary, userName }) => {
  const {
    totalInstallmentAmount = 0,
    paidInstallmentAmount = 0,
    pendingInstallmentAmount = 0,
    totalDueThisMonth = 0,
    totalPaidThisMonth = 0,
    statusKey = 'up_to_date'
  } = summary || {}

  const progressPercent = totalInstallmentAmount > 0 
    ? Math.min(100, Math.round((paidInstallmentAmount / totalInstallmentAmount) * 100))
    : 100

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
            Resumen Mensual de {userName}
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
            <PieChart className="w-3.5 h-3.5 text-brand-400" />
            Progreso de Cuotas del Mes
          </span>
          <span className="text-brand-300 font-bold">{progressPercent}% completado</span>
        </div>
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Metric Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Cuotas del Mes"
          value={formatCurrency(totalInstallmentAmount)}
          subtitle="Tus vencimientos de compras en cuotas"
          icon={CreditCard}
          color="brand"
        />

        <StatCard
          title="Ya Pagado / Confirmado"
          value={formatCurrency(paidInstallmentAmount)}
          subtitle="Cuotas confirmadas como abonadas"
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Pendiente de Pago"
          value={formatCurrency(pendingInstallmentAmount)}
          subtitle="Falta confirmar o transferir este mes"
          icon={Clock}
          color={pendingInstallmentAmount > 0 ? "amber" : "emerald"}
        />
      </div>
    </div>
  )
}
