export const TASK_STATUSES = {
  todo: { label: 'To Do', color: 'slate', icon: 'Circle' },
  'in-progress': { label: 'In Progress', color: 'blue', icon: 'Clock' },
  'in-review': { label: 'In Review', color: 'purple', icon: 'Eye' },
  done: { label: 'Done', color: 'green', icon: 'CheckCircle2' },
}

export const TASK_PRIORITIES = {
  low: { label: 'Low', color: 'green', icon: 'ArrowDown' },
  medium: { label: 'Medium', color: 'yellow', icon: 'ArrowRight' },
  high: { label: 'High', color: 'orange', icon: 'ArrowUp' },
  urgent: { label: 'Urgent', color: 'red', icon: 'AlertCircle' },
}

export const PROJECT_STATUSES = {
  active: { label: 'Active', color: 'green' },
  'on-hold': { label: 'On Hold', color: 'yellow' },
  completed: { label: 'Completed', color: 'blue' },
  archived: { label: 'Archived', color: 'slate' },
}

export const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#a855f7', '#d946ef',
]

export const KANBAN_COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'slate' },
  { id: 'in-progress', title: 'In Progress', color: 'blue' },
  { id: 'in-review', title: 'In Review', color: 'purple' },
  { id: 'done', title: 'Done', color: 'green' },
]
