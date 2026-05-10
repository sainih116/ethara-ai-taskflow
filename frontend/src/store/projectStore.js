import { create } from 'zustand'
import { projectsAPI } from '../api/projects'

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  meta: null,

  fetchProjects: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await projectsAPI.getAll(params)
      set({ projects: data.data || [], meta: data.meta, isLoading: false })
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to fetch projects', isLoading: false })
    }
  },

  fetchProject: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await projectsAPI.getById(id)
      set({ currentProject: data.data, isLoading: false })
      return data.data
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to fetch project', isLoading: false })
      return null
    }
  },

  createProject: async (projectData) => {
    try {
      const { data } = await projectsAPI.create(projectData)
      set((state) => ({ projects: [data.data, ...state.projects] }))
      return { success: true, data: data.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to create project' }
    }
  },

  updateProject: async (id, projectData) => {
    try {
      const { data } = await projectsAPI.update(id, projectData)
      set((state) => ({
        projects: state.projects.map((p) => (p._id === id ? data.data : p)),
        currentProject: state.currentProject?._id === id ? data.data : state.currentProject,
      }))
      return { success: true, data: data.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update project' }
    }
  },

  deleteProject: async (id) => {
    try {
      await projectsAPI.delete(id)
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
        currentProject: state.currentProject?._id === id ? null : state.currentProject,
      }))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete project' }
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),
  clearError: () => set({ error: null }),
}))

export default useProjectStore
