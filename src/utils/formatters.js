/**
 * Format a number as currency (ARS / USD format)
 */
export const formatCurrency = (amount, currency = 'ARS') => {
  const numericAmount = Number(amount) || 0
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(numericAmount)
}

/**
 * Format date string (YYYY-MM-DD or ISO) into readable Spanish format
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options
  }).format(date)
}

/**
 * Get current month & year string (e.g., "Julio 2026")
 */
export const getCurrentMonthLabel = (date = new Date()) => {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric'
  }).format(date)
}

/**
 * Extract initials from full name
 */
export const getInitials = (name = '') => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}
