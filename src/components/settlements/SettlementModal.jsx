import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { HandCoins, DollarSign, Calendar, User, FileText } from 'lucide-react'

export const SettlementModal = ({
  isOpen,
  onClose,
  activeGroupId,
  members = [],
  currentUserId,
  suggestedAmount = 0,
  onSettlementCreated
}) => {
  const otherMembers = members.filter(m => m.id !== currentUserId)
  const defaultReceiverId = otherMembers[0]?.id || ''

  const [payerId, setPayerId] = useState(currentUserId || '')
  const [receiverId, setReceiverId] = useState(defaultReceiverId)
  const [amount, setAmount] = useState(suggestedAmount > 0 ? String(suggestedAmount) : '')
  const [notes, setNotes] = useState('Transferencia de saldo')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const numAmount = Number(amount)
    if (numAmount <= 0) {
      setError('Por favor ingresa un monto válido a liquidar.')
      return
    }

    if (payerId === receiverId) {
      setError('El pagador y receptor deben ser usuarios distintos.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const { error: err } = await supabase
        .from('settlements')
        .insert([
          {
            group_id: activeGroupId,
            payer_id: payerId,
            receiver_id: receiverId,
            amount: numAmount,
            notes: notes.trim(),
            date
          }
        ])

      if (err) throw err

      onSettlementCreated()
      onClose()
    } catch (err) {
      console.error('Error creating settlement:', err)
      setError(err.message || 'Error al registrar liquidación.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Liquidación / Saldo de Deuda">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Quién Transfiere (Pagador)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-semibold bg-slate-900"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} {m.id === currentUserId ? '(Tú)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Quién Recibe (Receptor)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <select
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-semibold bg-slate-900"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Monto Transferido
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25000"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-bold text-purple-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Fecha de Liquidación
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Nota / Comprobante
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Transferencia Mercado Pago #18239"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Registrando liquidación...' : 'Confirmar Liquidación'}
        </button>
      </form>
    </Modal>
  )
}
