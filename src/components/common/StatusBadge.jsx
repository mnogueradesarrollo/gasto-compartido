import React from 'react'
import { CheckCircle2, Clock, ArrowUpRight } from 'lucide-react'

export const StatusBadge = ({ statusKey }) => {
  const badgeConfigs = {
    up_to_date: {
      label: 'Al día este mes',
      icon: CheckCircle2,
      style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    pending: {
      label: 'Pendiente de pago este mes',
      icon: Clock,
      style: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    },
    credit: {
      label: 'A favor / Crédito',
      icon: ArrowUpRight,
      style: 'bg-brand-500/10 text-brand-400 border-brand-500/30'
    }
  }

  const config = badgeConfigs[statusKey] || badgeConfigs.up_to_date
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.style}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  )
}
