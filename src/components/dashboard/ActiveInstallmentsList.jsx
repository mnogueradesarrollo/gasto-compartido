import React, { useState } from 'react'
import { InstallmentCard } from '../installments/InstallmentCard'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../utils/formatters'
import { CreditCard, Plus, ShoppingBag, Search, CheckCheck, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

export const ActiveInstallmentsList = ({
  plans = [],
  installments = [],
  members = [],
  currentUserId,
  activeGroupId,
  summary = {},
  onOpenNewModal,
  onTogglePayment,
  onEditPlan,
  onInstallmentUpdated
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingBulk, setLoadingBulk] = useState(false)

  const filteredPlans = plans.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Find all pending dues for current month across all plans
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

  // Calculate totals for current month
  const pendingInstallmentsAmount = pendingCurrentMonthInstallments.reduce(
    (sum, i) => sum + (Number(i.amount_per_member) || 0), 0
  )

  // Direct expense debt for user (if negative, user owes partner)
  const { directExpenseNet = 0, settlementNet = 0 } = summary
  const netDirectDebt = directExpenseNet + settlementNet
  const directDebtOwedByuser = netDirectDebt < 0 ? Math.abs(netDirectDebt) : 0

  const totalMonthDue = pendingInstallmentsAmount + directDebtOwedByuser
  const hasPendingItems = pendingCurrentMonthInstallments.length > 0 || directDebtOwedByuser > 0

  // Bulk pay all current month dues (Installments + Direct Expenses)
  const handlePayAllCurrentMonthDues = async () => {
    if (!hasPendingItems) return

    const partner = members.find(m => m.id !== currentUserId)

    let confirmMsg = `¿Quieres saldar el TOTAL del mes (${formatCurrency(totalMonthDue)})?\n\n`
    if (pendingCurrentMonthInstallments.length > 0) {
      confirmMsg += `• ${pendingCurrentMonthInstallments.length} cuotas de compras pendientes (${formatCurrency(pendingInstallmentsAmount)})\n`
    }
    if (directDebtOwedByuser > 0 && partner) {
      confirmMsg += `• Saldo de gastos directos a transferir a ${partner.full_name} (${formatCurrency(directDebtOwedByuser)})\n`
    }

    if (!window.confirm(confirmMsg)) {
      return
    }

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

      // 2. If user owes direct expense debt to partner, create settlement record automatically
      if (directDebtOwedByuser > 0 && partner && activeGroupId) {
        const { error: settlErr } = await supabase
          .from('settlements')
          .insert([
            {
              group_id: activeGroupId,
              payer_id: currentUserId,
              receiver_id: partner.id,
              amount: directDebtOwedByuser,
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

      if (onInstallmentUpdated) onInstallmentUpdated()
    } catch (err) {
      console.error('Error paying current month total:', err)
    } finally {
      setLoadingBulk(false)
    }
  }

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-400" />
            Compras en Cuotas Activas
          </h3>
          <p className="text-xs text-slate-400">Seguimiento de compras financiadas y división de vencimientos</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Pay all current month total button (Cuotas + Gastos Directos) */}
          {hasPendingItems && (
            <button
              onClick={handlePayAllCurrentMonthDues}
              disabled={loadingBulk}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0"
              title="Saldar todas las cuotas y gastos directos del mes con 1 solo clic"
            >
              <CheckCheck className="w-4 h-4 text-emerald-200" />
              <span>{loadingBulk ? 'Saldando...' : `Saldar Total del Mes (${formatCurrency(totalMonthDue)})`}</span>
            </button>
          )}

          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Compra</span>
          </button>
        </div>
      </div>

      {/* Cards List */}
      {filteredPlans.length === 0 ? (
        <div className="glass-panel p-8 sm:p-12 rounded-3xl text-center border border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-200">No hay compras en cuotas registradas</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Registra compras en 3, 6, 12 o más cuotas sin interés para dividir el pago mensual automáticamente con tu pareja o grupo.
          </p>
          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Registrar Primera Compra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredPlans.map((plan) => (
            <InstallmentCard
              key={plan.id}
              plan={plan}
              installments={installments}
              members={members}
              currentUserId={currentUserId}
              onTogglePayment={onTogglePayment}
              onEditPlan={onEditPlan}
              onInstallmentUpdated={onInstallmentUpdated}
            />
          ))}
        </div>
      )}
    </div>
  )
}
