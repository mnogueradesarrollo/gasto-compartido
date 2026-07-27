/**
 * Generate monthly due dates starting from a start date
 * e.g., 2026-08-15 -> [2026-08-15, 2026-09-15, 2026-10-15, ...]
 */
export const generateInstallmentDates = (startDateStr, count) => {
  const dates = []
  // Parse YYYY-MM-DD safely without timezone shifts
  const parts = startDateStr.split('-')
  const startYear = parseInt(parts[0], 10)
  const startMonth = parseInt(parts[1], 10) - 1
  const startDay = parseInt(parts[2], 10)

  for (let i = 0; i < count; i++) {
    const d = new Date(startYear, startMonth + i, 1)
    const maxDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    d.setDate(Math.min(startDay, maxDays))
    
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dates.push(`${year}-${month}-${day}`)
  }

  return dates
}

/**
 * Filter items for a specific target month (YYYY-MM) safely without timezone shifts
 */
export const isSameMonthAndYear = (dateStr, targetDate = new Date()) => {
  if (!dateStr) return false
  
  const str = String(dateStr).trim()
  if (/^\d{4}-\d{2}/.test(str)) {
    const parts = str.split('T')[0].split('-')
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    return targetDate.getFullYear() === year && targetDate.getMonth() === month
  }

  const date = new Date(dateStr)
  return (
    date.getFullYear() === targetDate.getFullYear() &&
    date.getMonth() === targetDate.getMonth()
  )
}

/**
 * Compute detailed user financial summary for current month
 */
export const calculateMonthlySummary = ({
  currentUserId,
  members = [],
  installments = [],
  expenses = [],
  settlements = [],
  targetMonth = new Date()
}) => {
  // 1. Current month installments for user
  const monthlyInstallments = installments.filter(inst => 
    isSameMonthAndYear(inst.due_date, targetMonth)
  )

  const userInstallments = monthlyInstallments.filter(
    inst => inst.assigned_to === currentUserId
  )

  const totalInstallmentAmount = userInstallments.reduce(
    (sum, inst) => sum + (Number(inst.amount_per_member) || 0), 0
  )

  const paidInstallmentAmount = userInstallments
    .filter(inst => inst.is_paid)
    .reduce((sum, inst) => sum + (Number(inst.amount_per_member) || 0), 0)

  const pendingInstallmentAmount = totalInstallmentAmount - paidInstallmentAmount

  // 2. Direct Expenses calculation for current month
  const monthlyExpenses = expenses.filter(exp => 
    isSameMonthAndYear(exp.date || exp.created_at, targetMonth)
  )

  const memberCount = Math.max(members.length, 1)

  // Total direct expenses in group this month
  const totalDirectExpenses = monthlyExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)

  // Direct expenses paid 100% out of pocket by current user
  const paidByUserDirect = monthlyExpenses
    .filter(exp => exp.paid_by === currentUserId)
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)

  // Fair share of direct expenses per member (50% if 2 members)
  const userFairShareExpenses = totalDirectExpenses / memberCount

  // Net balance from direct expenses (positive = user spent more than share, partner owes user; negative = user owes partner)
  const directExpenseNet = paidByUserDirect - userFairShareExpenses

  // 3. Settlements calculation
  const totalSettlementsPaid = settlements
    .filter(s => s.payer_id === currentUserId)
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0)

  const totalSettlementsReceived = settlements
    .filter(s => s.receiver_id === currentUserId)
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0)

  // Net settlements balance
  const settlementNet = totalSettlementsPaid - totalSettlementsReceived

  // Grand totals
  const totalDueThisMonth = totalInstallmentAmount + Math.max(0, -directExpenseNet)
  const totalPaidThisMonth = paidInstallmentAmount + totalSettlementsPaid

  // Overall status
  let statusKey = 'up_to_date' // 'up_to_date' | 'pending' | 'credit'
  if (pendingInstallmentAmount > 0) {
    statusKey = 'pending'
  } else if (directExpenseNet + settlementNet > 0) {
    statusKey = 'credit'
  }

  return {
    totalInstallmentAmount,
    paidInstallmentAmount,
    pendingInstallmentAmount,
    totalDirectExpenses,
    paidByUserDirect,
    userFairShareExpenses,
    directExpenseNet,
    totalSettlementsPaid,
    totalSettlementsReceived,
    settlementNet,
    totalDueThisMonth,
    totalPaidThisMonth,
    statusKey
  }
}
