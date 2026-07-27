import React, { useState } from 'react'
import { InstallmentCard } from '../installments/InstallmentCard'
import { CreditCard, Plus, ShoppingBag, Search } from 'lucide-react'

export const ActiveInstallmentsList = ({
  plans = [],
  installments = [],
  members = [],
  currentUserId,
  onOpenNewModal,
  onTogglePayment
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPlans = plans.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-400" />
            Compras en Cuotas Activas
          </h3>
          <p className="text-xs text-slate-400">Seguimiento de compras financiadas y división de vencimientos</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar compra..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs"
            />
          </div>

          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Compra en Cuotas</span>
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
