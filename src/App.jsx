import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabase'
import { Header } from './components/common/Header'
import { AuthForm } from './components/auth/AuthForm'
import { GroupModal } from './components/group/GroupModal'
import { MonthlySummary } from './components/dashboard/MonthlySummary'
import { BalanceOverview } from './components/dashboard/BalanceOverview'
import { ActiveInstallmentsList } from './components/dashboard/ActiveInstallmentsList'
import { DirectExpensesList } from './components/expenses/DirectExpensesList'
import { NewInstallmentModal } from './components/installments/NewInstallmentModal'
import { EditInstallmentModal } from './components/installments/EditInstallmentModal'
import { NewExpenseModal } from './components/expenses/NewExpenseModal'
import { EditExpenseModal } from './components/expenses/EditExpenseModal'
import { SettlementModal } from './components/settlements/SettlementModal'
import { SettlementHistory } from './components/settlements/SettlementHistory'
import { calculateMonthlySummary } from './utils/calculations'
import { Users, Plus, KeyRound, Loader2, Sparkles, ShieldCheck } from 'lucide-react'

export function App() {
  const { user, profile, activeGroup, groupMembers, loading: authLoading } = useAuth()

  // State
  const [plans, setPlans] = useState([])
  const [installments, setInstallments] = useState([])
  const [expenses, setExpenses] = useState([])
  const [settlements, setSettlements] = useState([])
  const [dataLoading, setDataLoading] = useState(false)

  // Modal States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [isNewInstallmentModalOpen, setIsNewInstallmentModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false)

  // Fetch all group financial data
  const fetchGroupData = useCallback(async () => {
    if (!activeGroup?.id) {
      setPlans([])
      setInstallments([])
      setExpenses([])
      setSettlements([])
      return
    }

    setDataLoading(true)
    try {
      // 1. Installment plans
      const { data: plansData, error: plansErr } = await supabase
        .from('installment_plans')
        .select('*')
        .eq('group_id', activeGroup.id)
        .order('created_at', { ascending: false })

      if (plansErr) throw plansErr
      setPlans(plansData || [])

      // 2. Installments
      const { data: instData, error: instErr } = await supabase
        .from('installments')
        .select('*')
        .eq('group_id', activeGroup.id)
        .order('due_date', { ascending: true })

      if (instErr) throw instErr
      setInstallments(instData || [])

      // 3. Direct Expenses
      const { data: expData, error: expErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('group_id', activeGroup.id)
        .order('date', { ascending: false })

      if (expErr) throw expErr
      setExpenses(expData || [])

      // 4. Settlements
      const { data: settlData, error: settlErr } = await supabase
        .from('settlements')
        .select('*')
        .eq('group_id', activeGroup.id)
        .order('date', { ascending: false })

      if (settlErr) throw settlErr
      setSettlements(settlData || [])

    } catch (err) {
      console.error('Error loading group data:', err)
    } finally {
      setDataLoading(false)
    }
  }, [activeGroup?.id])

  useEffect(() => {
    fetchGroupData()
  }, [fetchGroupData])

  // Realtime Subscriptions
  useEffect(() => {
    if (!activeGroup?.id) return

    const channel = supabase
      .channel(`group-${activeGroup.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'installments', filter: `group_id=eq.${activeGroup.id}` },
        () => fetchGroupData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${activeGroup.id}` },
        () => fetchGroupData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settlements', filter: `group_id=eq.${activeGroup.id}` },
        () => fetchGroupData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeGroup?.id, fetchGroupData])

  // Action: Toggle payment status of an installment
  const handleTogglePayment = async (installmentId, isPaid) => {
    try {
      const updatePayload = {
        is_paid: isPaid,
        paid_at: isPaid ? new Date().toISOString() : null
      }

      const { error } = await supabase
        .from('installments')
        .update(updatePayload)
        .eq('id', installmentId)

      if (error) throw error

      // Optimistic state update
      setInstallments(prev =>
        prev.map(i => i.id === installmentId ? { ...i, ...updatePayload } : i)
      )
    } catch (err) {
      console.error('Error toggling payment status:', err)
    }
  }

  // Action: Delete direct expense
  const handleDeleteExpense = async (expenseId) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)

      if (error) throw error

      setExpenses(prev => prev.filter(e => e.id !== expenseId))
    } catch (err) {
      console.error('Error deleting expense:', err)
    }
  }

  // Compute monthly user summary
  const summary = calculateMonthlySummary({
    currentUserId: user?.id,
    members: groupMembers,
    installments,
    expenses,
    settlements
  })

  // Render Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-400 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">Cargando GastoCompartido...</p>
        </div>
      </div>
    )
  }

  // Render Auth Screen if not logged in
  if (!user) {
    return (
      <div className="bg-slate-950 min-h-screen">
        <AuthForm />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <Header onOpenGroupModal={() => setIsGroupModalOpen(true)} />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!activeGroup ? (
          /* Empty Group Prompt */
          <div className="max-w-xl mx-auto my-12 glass-panel p-8 sm:p-12 rounded-3xl text-center border border-slate-800 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              ¡Bienvenido a GastoCompartido!
            </h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              Para empezar a gestionar tus compras en cuotas y gastos compartidos, crea un nuevo grupo para tu hogar o únete mediante el código de invitación de tu pareja.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setIsGroupModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                Crear o Unirme a un Grupo
              </button>
            </div>
          </div>
        ) : (
          /* Main Dashboard View */
          <div>
            {dataLoading && (
              <div className="mb-4 text-xs font-semibold text-brand-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sincronizando datos...
              </div>
            )}

            {/* Monthly Summary Header */}
            <MonthlySummary
              summary={summary}
              userName={profile?.full_name || 'Usuario'}
            />

            {/* Member Debt & Settlement Balance Overview */}
            <BalanceOverview
              currentUserId={user.id}
              members={groupMembers}
              summary={summary}
              onOpenSettlementModal={() => setIsSettlementModalOpen(true)}
            />

            {/* Installment Purchases Section (Core Feature) */}
            <ActiveInstallmentsList
              plans={plans}
              installments={installments}
              members={groupMembers}
              currentUserId={user.id}
              onOpenNewModal={() => setIsNewInstallmentModalOpen(true)}
              onTogglePayment={handleTogglePayment}
              onEditPlan={(plan) => setEditingPlan(plan)}
              onInstallmentUpdated={fetchGroupData}
            />

            {/* Direct One-Off Expenses Section */}
            <DirectExpensesList
              expenses={expenses}
              members={groupMembers}
              currentUserId={user.id}
              onOpenNewExpenseModal={() => setIsNewExpenseModalOpen(true)}
              onEditExpense={(expense) => setEditingExpense(expense)}
              onDeleteExpense={handleDeleteExpense}
            />

            {/* Settlement History */}
            <SettlementHistory
              settlements={settlements}
              members={groupMembers}
            />
          </div>
        )}

      </main>

      {/* Modals */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />

      {activeGroup && (
        <>
          <NewInstallmentModal
            isOpen={isNewInstallmentModalOpen}
            onClose={() => setIsNewInstallmentModalOpen(false)}
            activeGroupId={activeGroup.id}
            members={groupMembers}
            currentUserId={user.id}
            onPlanCreated={fetchGroupData}
          />

          <EditInstallmentModal
            isOpen={!!editingPlan}
            onClose={() => setEditingPlan(null)}
            plan={editingPlan}
            installments={installments}
            onPlanUpdated={fetchGroupData}
            onPlanDeleted={fetchGroupData}
          />

          <NewExpenseModal
            isOpen={isNewExpenseModalOpen}
            onClose={() => setIsNewExpenseModalOpen(false)}
            activeGroupId={activeGroup.id}
            members={groupMembers}
            currentUserId={user.id}
            onExpenseCreated={fetchGroupData}
          />

          <EditExpenseModal
            isOpen={!!editingExpense}
            onClose={() => setEditingExpense(null)}
            expense={editingExpense}
            members={groupMembers}
            currentUserId={user.id}
            onExpenseUpdated={fetchGroupData}
            onExpenseDeleted={fetchGroupData}
          />

          <SettlementModal
            isOpen={isSettlementModalOpen}
            onClose={() => setIsSettlementModalOpen(false)}
            activeGroupId={activeGroup.id}
            members={groupMembers}
            currentUserId={user.id}
            suggestedAmount={Math.max(0, -summary.directExpenseNet)}
            onSettlementCreated={fetchGroupData}
          />
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} GastoCompartido • Control de compras en cuotas en pareja y familia.</p>
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Protegido con Supabase RLS
          </span>
        </div>
      </footer>
    </div>
  )
}

export default App
