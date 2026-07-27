import React, { useState } from 'react'
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters'
import { supabase } from '../../lib/supabase'
import { CreditCard, Check, Clock, Calendar, User, ChevronDown, ChevronUp, Edit2, Sparkles, CheckCheck } from 'lucide-react'
import confetti from 'canvas-confetti'

export const InstallmentCard = ({
  plan,
  installments = [],
  members = [],
  currentUserId,
  onTogglePayment,
  onEditPlan,
  onInstallmentUpdated
}) => {
  const [expanded, setExpanded] = useState(false)
  const [loadingInstId, setLoadingInstId] = useState(null)
  const [editingInstId, setEditingInstId] = useState(null)
  const [tempDueDate, setTempDueDate] = useState('')

  // Plan info
  const { title, total_amount, total_installments, start_date, buyer_id } = plan
  const buyer = members.find(m => m.id === buyer_id) || { full_name: 'Comprador' }

  // Filter installments belonging to this plan
  const planInstallments = installments.filter(inst => inst.plan_id === plan.id)
  const pendingPlanInstallments = planInstallments.filter(inst => !inst.is_paid)

  // Current month's dues for this plan
  const today = new Date()
  const currentMonthDues = planInstallments.filter(inst => {
    const due = new Date(inst.due_date)
    return due.getFullYear() === today.getFullYear() && due.getMonth() === today.getMonth()
  })

  // Calculate overall paid progress
  const totalDuesCount = planInstallments.length || (total_installments * Math.max(members.length, 1))
  const paidDuesCount = planInstallments.filter(inst => inst.is_paid).length
  const progressPercent = totalDuesCount > 0 ? Math.round((paidDuesCount / totalDuesCount) * 100) : 0

  // Calculate current installment number display
  const latestDue = currentMonthDues[0] || planInstallments[0]
  const currentNumber = latestDue ? latestDue.installment_number : 1

  const handleCheckPayment = async (installment) => {
    setLoadingInstId(installment.id)
    try {
      const newStatus = !installment.is_paid
      await onTogglePayment(installment.id, newStatus)
      if (newStatus) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        })
      }
    } catch (err) {
      console.error('Error updating payment:', err)
    } finally {
      setLoadingInstId(null)
    }
  }

  // Pay off ALL remaining installments for this plan ahead of time
  const handlePayOffWholePlan = async () => {
    if (pendingPlanInstallments.length === 0) return

    if (!window.confirm(`¿Quieres marcar TODAS las ${pendingPlanInstallments.length} cuotas restantes de "${title}" como pagadas y saldar la deuda por completo?`)) {
      return
    }

    setLoadingInstId('ALL')
    try {
      const now = new Date().toISOString()
      const idsToUpdate = pendingPlanInstallments.map(i => i.id)

      const { error } = await supabase
        .from('installments')
        .update({ is_paid: true, paid_at: now })
        .in('id', idsToUpdate)

      if (error) throw error

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      })

      if (onInstallmentUpdated) onInstallmentUpdated()
    } catch (err) {
      console.error('Error paying off plan:', err)
    } finally {
      setLoadingInstId(null)
    }
  }

  const handleSaveIndividualDueDate = async (installmentId) => {
    if (!tempDueDate) return
    try {
      const { error } = await supabase
        .from('installments')
        .update({ due_date: tempDueDate })
        .eq('id', installmentId)

      if (error) throw error

      setEditingInstId(null)
      if (onInstallmentUpdated) onInstallmentUpdated()
    } catch (err) {
      console.error('Error updating installment due date:', err)
    }
  }

  return (
    <div className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-800 hover:border-slate-700/80 transition-all duration-200">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 mt-0.5">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-white tracking-tight">{title}</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {total_installments} cuotas
              </span>
              <button
                onClick={() => onEditPlan(plan)}
                className="p-1 text-slate-400 hover:text-brand-300 hover:bg-slate-800 rounded-lg transition-colors ml-1"
                title="Editar plan o fechas de vencimiento"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Comprador: <span className="text-slate-300 font-semibold">{buyer.full_name}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
          <div className="sm:text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Monto Total</span>
            <span className="text-lg sm:text-xl font-extrabold text-slate-100">
              {formatCurrency(total_amount)}
            </span>
          </div>

          {/* Quick Action: Pay Off Entire Plan */}
          {pendingPlanInstallments.length > 0 ? (
            <button
              onClick={handlePayOffWholePlan}
              disabled={loadingInstId === 'ALL'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all"
              title="Liquidar todas las cuotas restantes de este plan por adelantado"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{loadingInstId === 'ALL' ? 'Saldando...' : 'Liquidar Plan Completo'}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold">
              <CheckCheck className="w-4 h-4" />
              Plan 100% Saldado
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar & Current Status */}
      <div className="my-4">
        <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
          <span className="text-slate-300">
            Cuota {currentNumber} de {total_installments}
          </span>
          <span className="text-brand-300">{progressPercent}% abonado</span>
        </div>
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Current Month Dues Confirmation Actions */}
      <div className="mt-4 pt-4 border-t border-slate-800/60">
        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Vencimiento Mes Actual ({currentMonthDues.length} asignaciones)
        </h5>

        {currentMonthDues.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No hay cuotas programadas para este mes en este plan.</p>
        ) : (
          <div className="space-y-2">
            {currentMonthDues.map((inst) => {
              const assignedUser = members.find(m => m.id === inst.assigned_to) || { full_name: 'Miembro' }
              const isCurrentUser = inst.assigned_to === currentUserId

              return (
                <div
                  key={inst.id}
                  className={`p-3 rounded-2xl border flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 transition-all ${
                    inst.is_paid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 font-bold text-xs flex items-center justify-center text-slate-300 shrink-0">
                      {getInitials(assignedUser.full_name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{assignedUser.full_name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Tú</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        Parte: <span className="font-semibold text-slate-200">{formatCurrency(inst.amount_per_member)}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheckPayment(inst)}
                    disabled={loadingInstId === inst.id || loadingInstId === 'ALL'}
                    className={`flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all w-full xs:w-auto ${
                      inst.is_paid
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {loadingInstId === inst.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : inst.is_paid ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Pagado</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Marcar como Pagado</span>
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Expand/Collapse All Dues History */}
      <div className="mt-4 pt-3 text-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
        >
          <span>{expanded ? 'Ocultar historial completo de cuotas' : 'Ver todas las cuotas y editar fechas'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Dues History with date editing */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 animate-fade-in">
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {planInstallments.map((inst) => {
              const user = members.find(m => m.id === inst.assigned_to) || { full_name: 'Miembro' }
              const isEditingThis = editingInstId === inst.id

              return (
                <div
                  key={inst.id}
                  className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between text-xs gap-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-300">Cuota {inst.installment_number}/{inst.total_installments}</span>
                    <span className="text-slate-500">•</span>
                    
                    {isEditingThis ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="date"
                          value={tempDueDate}
                          onChange={(e) => setTempDueDate(e.target.value)}
                          className="px-2 py-0.5 rounded bg-slate-900 text-slate-100 text-xs border border-slate-700"
                        />
                        <button
                          onClick={() => handleSaveIndividualDueDate(inst.id)}
                          className="px-2 py-0.5 rounded bg-brand-600 text-white font-bold text-[10px]"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setEditingInstId(null)}
                          className="px-1.5 py-0.5 text-slate-400 text-[10px]"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {formatDate(inst.due_date)}
                        <button
                          onClick={() => {
                            setEditingInstId(inst.id)
                            setTempDueDate(inst.due_date)
                          }}
                          className="p-0.5 text-slate-500 hover:text-slate-200 rounded"
                          title="Modificar fecha de vencimiento de esta cuota"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300 font-medium">{user.full_name}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-slate-200">{formatCurrency(inst.amount_per_member)}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inst.is_paid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {inst.is_paid ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
