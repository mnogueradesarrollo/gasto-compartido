import React, { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { Receipt, DollarSign, Calendar, Tag, User, Trash2 } from 'lucide-react'

export const EditExpenseModal = ({
  isOpen,
  onClose,
  expense,
  members = [],
  currentUserId,
  onExpenseUpdated,
  onExpenseDeleted
}) => {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Supermercado')
  const [date, setDate] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (expense) {
      setDescription(expense.description || '')
      setAmount(expense.amount ? String(expense.amount) : '')
      setCategory(expense.category || 'Supermercado')
      setDate(expense.date || new Date().toISOString().split('T')[0])
      setPaidBy(expense.paid_by || currentUserId)
    }
  }, [expense, currentUserId])

  if (!expense) return null

  const handleSave = async (e) => {
    e.preventDefault()
    const numAmount = Number(amount)
    if (!description.trim() || numAmount <= 0) {
      setError('Por favor completa una descripción y monto válido.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const { error: err } = await supabase
        .from('expenses')
        .update({
          description: description.trim(),
          amount: numAmount,
          category,
          date,
          paid_by: paidBy
        })
        .eq('id', expense.id)

      if (err) throw err

      onExpenseUpdated()
      onClose()
    } catch (err) {
      console.error('Error updating expense:', err)
      setError(err.message || 'Error al actualizar el gasto.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar el gasto "${expense.description}"?`)) {
      return
    }

    setDeleting(true)
    try {
      const { error: err } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id)

      if (err) throw err

      onExpenseDeleted(expense.id)
      onClose()
    } catch (err) {
      console.error('Error deleting expense:', err)
      setError(err.message || 'Error al eliminar el gasto.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Gasto Directo">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Concepto del Gasto
          </label>
          <div className="relative">
            <Receipt className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Supermercado, Luz / Gas"
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="110000"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Categoría
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-semibold bg-slate-900"
              >
                <option value="Supermercado">Supermercado</option>
                <option value="Servicios">Servicios (Luz/Gas/Agua)</option>
                <option value="Hogar">Hogar / Mantenimiento</option>
                <option value="Entretenimiento">Entretenimiento / Salidas</option>
                <option value="Mascotas">Mascotas</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Fecha
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

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Pagado Por (100%)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
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

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || deleting}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            {loading ? 'Guardando cambios...' : 'Guardar Cambios'}
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
