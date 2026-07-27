import React from 'react'

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'brand' }) => {
  const colorStyles = {
    brand: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${colorStyles[color] || colorStyles.brand}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
