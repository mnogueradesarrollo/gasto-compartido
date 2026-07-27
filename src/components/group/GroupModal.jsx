import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { useAuth } from '../../context/AuthContext'
import { Users, Plus, KeyRound, Check } from 'lucide-react'

export const GroupModal = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState('create') // 'create' | 'join'
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { createGroup, joinGroupWithCode } = useAuth()

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!groupName.trim()) return
    setError('')
    setLoading(true)
    try {
      await createGroup(groupName.trim())
      setGroupName('')
      onClose()
    } catch (err) {
      setError(err.message || 'Error al crear el grupo')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setError('')
    setLoading(true)
    try {
      await joinGroupWithCode(inviteCode.trim())
      setInviteCode('')
      onClose()
    } catch (err) {
      setError(err.message || 'Error al unirse al grupo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Grupo Familiar">
      {/* Tabs */}
      <div className="flex p-1 bg-slate-900/80 rounded-xl mb-6 border border-slate-800">
        <button
          onClick={() => { setTab('create'); setError('') }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tab === 'create'
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Crear Nuevo Grupo
        </button>
        <button
          onClick={() => { setTab('join'); setError('') }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tab === 'join'
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Unirme con Código
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      {tab === 'create' ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Nombre del Grupo / Hogar
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ej. Casa & Pareja, Familia Pérez"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Se generará un código de invitación único para sumar a tu pareja o familiares.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Creando grupo...' : 'Crear Grupo'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Código de Invitación (6 Caracteres)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                maxLength={6}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Ej. A8F3X1"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono tracking-widest uppercase"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Pídele el código de 6 dígitos a la persona que creó el grupo.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Uniéndose...' : 'Unirme al Grupo'}
          </button>
        </form>
      )}
    </Modal>
  )
}
