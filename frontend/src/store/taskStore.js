import { create } from 'zustand'
import { tasksAPI } from '../api/tasks'

const useTaskStore = create((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  meta: null,
  filters: {
    projectId: '',
    status: '',
    priority: '',
    search: '',
    assignedTo: '',
  },

  fetchTasks: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await tasksAPI.getAll({ ...get().filters, ...params })
      set({ tasks: data.data || [], meta: data.meta, isLoading: false })
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to fetch tasks', isLoading: false })
    }
  },

  fetchTask: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await tasksAPI.getById(id)
      set({ currentTask: data.data, isLoading: false })
      return data.data
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to fetch task', isLoading: false })
      return null
    }
  },

  createTask: async (taskData) => {
    try {
      const { data } = await tasksAPI.create(taskData)
      set((state) => ({ tasks: [data.data, ...state.tasks] }))
      return { success: true, data: data.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to create task' }
    }
  },

  updateTask: async (id, taskData) => {
    try {
      const { data } = await tasksAPI.update(id, taskData)
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === id ? data.data : t)),
        currentTask: state.currentTask?._id === id ? data.data : state.currentTask,
      }))
      return { success: true, data: data.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update task' }
    }
  },

  // Optimistic update for Kanban drag-and-drop
  updateTaskStatusOptimistic: (id, newStatus) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === id ? { ...t, status: newStatus } : t)),
    }))
  },

  deleteTask: async (id) => {
    try {
      await tasksAPI.delete(id)
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== id),
        currentTask: state.currentTask?._id === id ? null : state.currentTask,
      }))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete task' }
    }
  },

  addComment: async (taskId, content) => {
    try {
      const { data } = await tasksAPI.addComment(taskId, { content })
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === taskId ? data.data : t)),
        currentTask: state.currentTask?._id === taskId ? data.data : state.currentTask,
      }))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to add comment' }
    }
  },

  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: { projectId: '', status: '', priority: '', search: '', assignedTo: '' } }),
  setCurrentTask: (task) => set({ currentTask: task }),
  clearError: () => set({ error: null }),
}))

export default useTaskStore
