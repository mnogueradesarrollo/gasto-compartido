import React, { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { generateInstallmentDates } from '../../utils/calculations'
import { supabase } from '../../lib/supabase'
import { CreditCard, DollarSign, Calendar, Trash2 } from 'lucide-react'

export const EditInstallmentModal = ({
  isOpen,
  onClose,
  plan,
  installments = [],
  onPlanUpdated,
  onPlanDeleted
}) => {
  const [title, setTitle] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (plan) {
      setTitle(plan.title || '')
      setTotalAmount(plan.total_amount ? String(plan.total_amount) : '')
      setStartDate(plan.start_date || new Date().toISOString().split('T')[0])
    }
  }, [plan])

  if (!plan) return null

  const handleSave = async (e) => {
    e.preventDefault()
    const numAmount = Number(totalAmount)
    if (!title.trim() || numAmount <= 0) {
      setError('Por favor ingresa un título y monto válido.')
      return
    }

    setError('')
    setLoading(true)

    try {
      // 1. Update Installment Plan record
      const { error: planErr } = await supabase
        .from('installment_plans')
        .update({
          title: title.trim(),
          total_amount: numAmount,
          start_date: startDate
        })
        .eq('id', plan.id)

      if (planErr) throw planErr

      // 2. Recalculate monthly due dates for all installments under this plan
      const newDueDates = generateInstallmentDates(startDate, plan.total_installments)
      const planInstallments = installments.filter(inst => inst.plan_id === plan.id)

      // Group installments by number (1 to N)
      for (let i = 0; i < plan.total_installments; i++) {
        const number = i + 1
        const newDueDate = newDueDates[i]
        const duesForNumber = planInstallments.filter(inst => inst.installment_number === number)

        for (const inst of duesForNumber) {
          const { error: instErr } = await supabase
            .from('installments')
            .update({ due_date: newDueDate })
            .eq('id', inst.id)

          if (instErr) throw instErr
        }
      }

      onPlanUpdated()
      onClose()
    } catch (err) {
      console.error('Error updating plan:', err)
      setError(err.message || 'Error al actualizar la compra en cuotas.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar el plan "${plan.title}" y todas sus cuotas?`)) {
      return
    }

    setDeleting(true)
    try {
      const { error: deleteErr } = await supabase
        .from('installment_plans')
        .delete()
        .eq('id', plan.id)

      if (deleteErr) throw deleteErr

      onPlanDeleted(plan.id)
      onClose()
    } catch (err) {
      console.error('Error deleting plan:', err)
      setError(err.message || 'Error al eliminar la compra.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Compra y Fechas de Vencimiento">
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Título de la Compra
          </label>
          <div className="relative">
            <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Monto Total
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Nueva Fecha de Inicio (Vencimiento 1)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Al cambiar la fecha de inicio, se recalcularán automáticamente los vencimientos mensuales de todas las cuotas.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || deleting}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
          >
            {loading ? 'Guardando cambios...' : 'Guardar Cambios y Recalcular'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || deleting}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
