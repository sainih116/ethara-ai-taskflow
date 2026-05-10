import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns'

export const formatDate = (date) => {
  if (!date) return 'No date'
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'MMM d, yyyy')
  } catch {
    return 'Invalid date'
  }
}

export const formatDateTime = (date) => {
  if (!date) return 'No date'
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'MMM d, yyyy HH:mm')
  } catch {
    return 'Invalid date'
  }
}

export const formatRelative = (date) => {
  if (!date) return ''
  try {
    return formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true })
  } catch {
    return ''
  }
}

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false
  try {
    return isAfter(new Date(), typeof dueDate === 'string' ? parseISO(dueDate) : dueDate)
  } catch {
    return false
  }
}

export const truncate = (str, length = 50) => {
  if (!str) return ''
  return str.length > length ? str.substring(0, length) + '...' : str
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
