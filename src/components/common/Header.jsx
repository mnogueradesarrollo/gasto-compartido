import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { 
  CreditCard, 
  Users, 
  Plus, 
  LogOut, 
  Copy, 
  Check, 
  ChevronDown, 
  Sparkles 
} from 'lucide-react'
import { getInitials } from '../../utils/formatters'

export const Header = ({ onOpenGroupModal }) => {
  const { user, profile, groups, activeGroup, switchActiveGroup, signOut } = useAuth()
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const copyInviteCode = () => {
    if (!activeGroup?.invite_code) return
    navigator.clipboard.writeText(activeGroup.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand logo & name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              GastoCompartido
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Cuotas
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">Control familiar & cuotas</p>
          </div>
        </div>

        {/* Center: Group Selector & Invite Code */}
        {user && (
          <div className="flex items-center gap-2">
            {activeGroup ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-xs font-semibold text-slate-200 hover:text-white border border-slate-700/60 hover:border-slate-600 transition-all"
                >
                  <Users className="w-4 h-4 text-brand-400" />
                  <span className="max-w-[120px] sm:max-w-[180px] truncate">{activeGroup.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div 
                    className="absolute top-full mt-2 left-0 w-56 glass-panel rounded-xl border border-slate-700/80 shadow-xl py-2 z-50 animate-scale-up"
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Tus Grupos
                    </div>
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => switchActiveGroup(g)}
                        className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center justify-between ${
                          g.id === activeGroup.id
                            ? 'bg-brand-500/20 text-brand-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="truncate">{g.name}</span>
                        {g.id === activeGroup.id && <Check className="w-3.5 h-3.5 text-brand-400" />}
                      </button>
                    ))}
                    <div className="border-t border-slate-800 my-1"></div>
                    <button
                      onClick={onOpenGroupModal}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-brand-400 hover:bg-brand-500/10 flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Crear o unirse a grupo
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenGroupModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Crear o Unirte a un Grupo
              </button>
            )}

            {/* Invite Code Badge (Responsive) */}
            {activeGroup?.invite_code && (
              <button
                onClick={copyInviteCode}
                title="Copiar código de invitación para compartir con tu pareja/familia"
                className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] sm:text-xs font-mono transition-all"
              >
                <span className="text-slate-500 text-[9px] sm:text-[10px] font-sans uppercase font-bold hidden xs:inline">CÓDIGO:</span>
                <span className="font-bold text-brand-300">{activeGroup.invite_code}</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Right: User Avatar & Logout */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center">
                {getInitials(profile?.full_name || user.email)}
              </div>
              <span className="text-xs font-medium text-slate-200 hidden md:inline">
                {profile?.full_name || user.email?.split('@')[0]}
              </span>
            </div>
            <button
              onClick={signOut}
              title="Cerrar sesión"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </header>
  )
}
