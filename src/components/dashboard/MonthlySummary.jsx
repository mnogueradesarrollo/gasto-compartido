import React, { useState } from 'react'
import { StatCard } from '../common/StatCard'
import { StatusBadge } from '../common/StatusBadge'
import { formatCurrency, getCurrentMonthLabel } from '../../utils/formatters'
import { supabase } from '../../lib/supabase'
import { Calendar, CreditCard, CheckCircle2, Clock, Receipt, HandCoins, ArrowUpRight, ArrowDownRight, Sparkles, CheckCheck } from 'lucide-react'
import confetti from 'canvas-confetti'

export const MonthlySummary = ({
  summary = {},
  userName,
  currentUserId,
  activeGroupId,
  members = [],
  installments = [],
  onSummaryUpdated
}) => {
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

  const [loadingBulk, setLoadingBulk] = useState(false)

  const installmentProgress = totalInstallmentAmount > 0 
    ? Math.min(100, Math.round((paidInstallmentAmount / totalInstallmentAmount) * 100))
    : 100

  // Total net balance for direct expenses and settlements
  const totalNetBalance = directExpenseNet + settlementNet
  const directDebtOwedByUser = totalNetBalance < 0 ? Math.abs(totalNetBalance) : 0

  // Find all pending dues for current month across all plans for current user
  const today = new Date()
  const pendingCurrentMonthInstallments = installments.filter(inst => {
    const due = new Date(inst.due_date)
    return (
      !inst.is_paid &&
      inst.assigned_to === currentUserId &&
      due.getFullYear() === today.getFullYear() &&
      due.getMonth() === today.getMonth()
    )
  })

  const pendingInstallmentsAmount = pendingCurrentMonthInstallments.reduce(
    (sum, i) => sum + (Number(i.amount_per_member) || 0), 0
  )

  const totalMonthDue = pendingInstallmentsAmount + directDebtOwedByUser
  const hasPendingItems = pendingCurrentMonthInstallments.length > 0 || directDebtOwedByUser > 0

  // One-click bulk payoff for whole month (Cuotas + Gastos Directos)
  const handlePayAllCurrentMonthDues = async () => {
    if (!hasPendingItems) return

    const partner = members.find(m => m.id !== currentUserId)

    let confirmMsg = `¿Quieres saldar el TOTAL del mes (${formatCurrency(totalMonthDue)})?\n\n`
    if (pendingCurrentMonthInstallments.length > 0) {
      confirmMsg += `• ${pendingCurrentMonthInstallments.length} cuotas de compras pendientes (${formatCurrency(pendingInstallmentsAmount)})\n`
    }
    if (directDebtOwedByUser > 0 && partner) {
      confirmMsg += `• Saldo de gastos directos a transferir a ${partner.full_name} (${formatCurrency(directDebtOwedByUser)})\n`
    }

    if (!window.confirm(confirmMsg)) return

    setLoadingBulk(true)
    try {
      const now = new Date().toISOString()

      // 1. Pay all current month pending installments for user
      if (pendingCurrentMonthInstallments.length > 0) {
        const idsToUpdate = pendingCurrentMonthInstallments.map(i => i.id)
        const { error: instErr } = await supabase
          .from('installments')
          .update({ is_paid: true, paid_at: now })
          .in('id', idsToUpdate)

        if (instErr) throw instErr
      }

      // 2. Create settlement for direct expenses debt if applicable
      if (directDebtOwedByUser > 0 && partner && activeGroupId) {
        const { error: settlErr } = await supabase
          .from('settlements')
          .insert([
            {
              group_id: activeGroupId,
              payer_id: currentUserId,
              receiver_id: partner.id,
              amount: directDebtOwedByUser,
              notes: 'Liquidación total de gastos directos del mes',
              date: today.toISOString().split('T')[0]
            }
          ])

        if (settlErr) throw settlErr
      }

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      })

      if (onSummaryUpdated) onSummaryUpdated()
    } catch (err) {
      console.error('Error paying current month total:', err)
    } finally {
      setLoadingBulk(false)
    }
  }

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

        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge statusKey={statusKey} />

          {/* Prominent One-Click Month Settlement Button */}
          {hasPendingItems && (
            <button
              onClick={handlePayAllCurrentMonthDues}
              disabled={loadingBulk}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              title="Saldar todas las cuotas y gastos directos pendientes de este mes con 1 clic"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loadingBulk ? 'Saldando mes...' : `Saldar Total del Mes (${formatCurrency(totalMonthDue)})`}</span>
            </button>
          )}
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

      {/* Metric Stat Cards Grid */}
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
