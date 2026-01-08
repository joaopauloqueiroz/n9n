import axios from 'axios'

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.n9n.archcode.space').replace(/\/$/, '')

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('n9n_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle 401 errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('n9n_token')
      localStorage.removeItem('n9n_user')
      localStorage.removeItem('n9n_tenant')
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const apiClient = {
  setToken: (token: string | null) => {
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete client.defaults.headers.common['Authorization']
    }
  },

  // Auth
  login: async (email: string, password: string) => {
    const { data } = await client.post('/api/auth/login', { email, password })
    return data
  },

  register: async (email: string, password: string, name?: string, tenantName: string = '') => {
    const { data } = await client.post('/api/auth/register', {
      email,
      password,
      name,
      tenantName,
    })
    return data
  },

  // Workflows
  getWorkflows: async () => {
    const { data } = await client.get('/api/workflows')
    return data
  },

  getWorkflow: async (workflowId: string) => {
    const { data } = await client.get(`/api/workflows/${workflowId}`)
    return data
  },

  createWorkflow: async (name: string, description?: string) => {
    const { data } = await client.post('/api/workflows', { name, description })
    return data
  },

  updateWorkflow: async (workflowId: string, updates: any) => {
    const { data } = await client.put(`/api/workflows/${workflowId}`, updates)
    return data
  },

  deleteWorkflow: async (workflowId: string) => {
    await client.delete(`/api/workflows/${workflowId}`)
  },

  // WhatsApp Sessions
  getWhatsappSessions: async () => {
    const { data } = await client.get('/api/whatsapp/sessions')
    return data
  },

  getWhatsappSession: async (sessionId: string) => {
    const { data } = await client.get(`/api/whatsapp/sessions/${sessionId}`)
    return data
  },

  createWhatsappSession: async (name: string) => {
    const { data } = await client.post('/api/whatsapp/sessions', { name })
    return data
  },

  deleteWhatsappSession: async (sessionId: string) => {
    await client.delete(`/api/whatsapp/sessions/${sessionId}`)
  },

  reconnectWhatsappSession: async (sessionId: string) => {
    const { data } = await client.post(`/api/whatsapp/sessions/${sessionId}/reconnect`)
    return data
  },

  getSessionLabels: async (sessionId: string) => {
    const { data } = await client.get(`/api/whatsapp/sessions/${sessionId}/labels`)
    return data
  },

  sendWhatsappMessage: async (sessionId: string, contactId: string, message: string) => {
    const { data } = await client.post(`/api/whatsapp/sessions/${sessionId}/send`, {
      contactId,
      message,
    })
    return data
  },

  // Executions
  getExecution: async (executionId: string) => {
    const { data } = await client.get(`/api/executions/${executionId}`)
    return data
  },

  getExecutionLogs: async (executionId: string) => {
    const { data } = await client.get(`/api/executions/${executionId}/logs`)
    return data
  },

  getWorkflowExecutions: async (workflowId: string) => {
    const { data } = await client.get(`/api/workflows/${workflowId}/executions`)
    return data
  },

  // Manual Trigger
  async triggerManualExecution(workflowId: string, nodeId: string) {
    const { data } = await client.post(`/api/workflows/${workflowId}/trigger-manual`, {
      nodeId,
    })
    return data
  },

  async testNode(workflowId: string, nodeId: string, executionId?: string) {
    const { data } = await client.post(`/api/workflows/${workflowId}/test-node`, {
      nodeId,
      executionId,
    })
    return data
  },

  // Tags
  getTags: async () => {
    const { data } = await client.get('/api/tags')
    return data
  },

  getTag: async (tagId: string) => {
    const { data } = await client.get(`/api/tags/${tagId}`)
    return data
  },

  createTag: async (name: string, color?: string, description?: string) => {
    const { data } = await client.post('/api/tags', { name, color, description })
    return data
  },

  updateTag: async (tagId: string, updates: { name?: string; color?: string; description?: string }) => {
    const { data } = await client.put(`/api/tags/${tagId}`, updates)
    return data
  },

  deleteTag: async (tagId: string) => {
    await client.delete(`/api/tags/${tagId}`)
  },
}
