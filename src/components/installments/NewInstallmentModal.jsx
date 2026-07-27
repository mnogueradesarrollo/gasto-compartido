import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { formatCurrency, getInitials } from '../../utils/formatters'
import { generateInstallmentDates } from '../../utils/calculations'
import { supabase } from '../../lib/supabase'
import { CreditCard, DollarSign, Calendar, User, Percent, Sparkles, Hash } from 'lucide-react'

export const NewInstallmentModal = ({
  isOpen,
  onClose,
  activeGroupId,
  members = [],
  currentUserId,
  onPlanCreated
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [totalInstallments, setTotalInstallments] = useState(12)
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [buyerId, setBuyerId] = useState(currentUserId || members[0]?.id || '')
  const [buyerSplitRatio, setBuyerSplitRatio] = useState(50) // 50%
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const numericTotal = Number(totalAmount) || 0
  const monthlyTotal = totalInstallments > 0 ? numericTotal / totalInstallments : 0
  const buyerMonthlyShare = (monthlyTotal * buyerSplitRatio) / 100
  const otherMonthlyShare = members.length > 1 ? (monthlyTotal * (100 - buyerSplitRatio)) / (members.length - 1) : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || numericTotal <= 0) {
      setError('Por favor completa el título y monto total válido.')
      return
    }

    if (!activeGroupId) {
      setError('Debes seleccionar o crear un grupo primero.')
      return
    }

    setError('')
    setLoading(true)

    try {
      // 1. Insert Purchase
      const { data: purchase, error: purchaseErr } = await supabase
        .from('purchases')
        .insert([
          {
            group_id: activeGroupId,
            created_by: currentUserId,
            title: title.trim(),
            description: description.trim(),
            total_amount: numericTotal,
            category: 'Cuotas'
          }
        ])
        .select()
        .single()

      if (purchaseErr) throw purchaseErr

      // 2. Insert Installment Plan
      const { data: plan, error: planErr } = await supabase
        .from('installment_plans')
        .insert([
          {
            purchase_id: purchase.id,
            group_id: activeGroupId,
            buyer_id: buyerId,
            title: title.trim(),
            description: description.trim(),
            total_amount: numericTotal,
            total_installments: totalInstallments,
            start_date: startDate,
            split_ratio_buyer: buyerSplitRatio
          }
        ])
        .select()
        .single()

      if (planErr) throw planErr

      // 3. Generate N monthly installment records for each member
      const dueDates = generateInstallmentDates(startDate, totalInstallments)
      const installmentRows = []

      for (let i = 0; i < totalInstallments; i++) {
        const dueDate = dueDates[i]
        const number = i + 1

        members.forEach(member => {
          const isBuyer = member.id === buyerId
          const amountPerMember = isBuyer ? buyerMonthlyShare : otherMonthlyShare

          installmentRows.push({
            plan_id: plan.id,
            group_id: activeGroupId,
            assigned_to: member.id,
            installment_number: number,
            total_installments: totalInstallments,
            due_date: dueDate,
            amount_per_member: Math.round(amountPerMember * 100) / 100,
            is_paid: false
          })
        })
      }

      const { error: instErr } = await supabase
        .from('installments')
        .insert(installmentRows)

      if (instErr) throw instErr

      // Reset form
      setTitle('')
      setDescription('')
      setTotalAmount('')
      setTotalInstallments(12)
      onPlanCreated()
      onClose()
    } catch (err) {
      console.error('Error creating installment plan:', err)
      setError(err.message || 'Error al guardar la compra en cuotas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Compra en Cuotas" maxWidth="max-w-xl">
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Descripción de la Compra
          </label>
          <div className="relative">
            <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Heladera Samsung, Zapatillas, Vuelos"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>
        </div>

        {/* Total Amount & Number of Installments */}
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
                placeholder="120000"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Cantidad de Cuotas
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <select
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-bold appearance-none bg-slate-900"
              >
                <option value={2}>2 cuotas</option>
                <option value={3}>3 cuotas sin interés</option>
                <option value={6}>6 cuotas sin interés</option>
                <option value={9}>9 cuotas</option>
                <option value={12}>12 cuotas sin interés</option>
                <option value={18}>18 cuotas</option>
                <option value={24}>24 cuotas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Start Date & Buyer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Fecha Primer Vencimiento
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Comprador Original
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <select
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-semibold appearance-none bg-slate-900"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} {m.id === currentUserId ? '(Tú)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Division Split Slider */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-brand-400" />
              División de la Cuota Mensual
            </span>
            <span className="text-brand-300 font-extrabold">{buyerSplitRatio}% / {100 - buyerSplitRatio}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={buyerSplitRatio}
            onChange={(e) => setBuyerSplitRatio(Number(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer"
          />

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Comprador paga/mes:</span>
              <span className="font-extrabold text-brand-300">{formatCurrency(buyerMonthlyShare)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Otro miembro paga/mes:</span>
              <span className="font-extrabold text-emerald-400">{formatCurrency(otherMonthlyShare)}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Generando plan de cuotas...' : 'Generar Plan de Cuotas'}
        </button>
      </form>
    </Modal>
  )
}
