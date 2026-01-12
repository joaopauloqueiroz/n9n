'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Edit2, Building2, Users, Workflow, MessageSquare, UserCog } from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { SuperAdminGuardWrapper } from '@/components/SuperAdminGuard'
import AppHeader from '@/components/AppHeader'

interface Workspace {
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    users: number
    workflows: number
    whatsappSessions: number
  }
}

function WorkspacesPageContent() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    isActive: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getTenants()
      setWorkspaces(data)
    } catch (error: any) {
      console.error('Error loading workspaces:', error)
      setError(error.response?.data?.message || 'Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required')
      return
    }

    try {
      setError(null)
      await apiClient.createTenant(formData.name, formData.email)
      setSuccess('Workspace created successfully')
      await loadWorkspaces()
      setShowModal(false)
      setFormData({ name: '', email: '', isActive: true })
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create workspace')
    }
  }

  const handleUpdate = async () => {
    if (!editingWorkspace) return
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required')
      return
    }

    try {
      setError(null)
      await apiClient.updateTenant(editingWorkspace.id, {
        name: formData.name,
        email: formData.email,
        isActive: formData.isActive,
      })
      setSuccess('Workspace updated successfully')
      await loadWorkspaces()
      setShowModal(false)
      setEditingWorkspace(null)
      setFormData({ name: '', email: '', isActive: true })
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update workspace')
    }
  }

  const handleDelete = async () => {
    if (!deletingWorkspace) return

    try {
      setError(null)
      await apiClient.deleteTenant(deletingWorkspace.id)
      setSuccess('Workspace deleted successfully')
      await loadWorkspaces()
      setShowDeleteModal(false)
      setDeletingWorkspace(null)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete workspace')
    }
  }

  const openCreateModal = () => {
    setEditingWorkspace(null)
    setFormData({ name: '', email: '', isActive: true })
    setError(null)
    setShowModal(true)
  }

  const openEditModal = (workspace: Workspace) => {
    setEditingWorkspace(workspace)
    setFormData({
      name: workspace.name,
      email: workspace.email,
      isActive: workspace.isActive,
    })
    setError(null)
    setShowModal(true)
  }

  const openDeleteModal = (workspace: Workspace) => {
    setDeletingWorkspace(workspace)
    setError(null)
    setShowDeleteModal(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <AppHeader />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">🏢 Manage Workspaces</h1>
            <p className="text-gray-400">
              Create and manage workspaces (tenants) in the system
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/80 transition font-semibold"
          >
            <Plus size={20} />
            New Workspace
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Workspaces Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Building2 size={64} className="mb-4 opacity-20" />
            <p className="text-lg mb-2">No workspaces created yet</p>
            <p className="text-sm">Create your first workspace to get started</p>
          </div>
        ) : (
          <div className="bg-[#151515] border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Stats</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Created</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((workspace) => (
                  <tr
                    key={workspace.id}
                    className="border-b border-gray-800 hover:bg-[#1a1a1a] transition"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/workspaces/${workspace.id}`}
                        className="flex items-center gap-3 hover:text-primary transition"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Building2 size={20} className="text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{workspace.name}</div>
                          <div className="text-xs text-gray-500">ID: {workspace.id.slice(0, 8)}...</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{workspace.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          workspace.isActive
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-700/50 text-gray-400 border border-gray-700'
                        }`}
                      >
                        {workspace.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Users size={14} />
                          <span>{workspace._count?.users || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Workflow size={14} />
                          <span>{workspace._count?.workflows || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <MessageSquare size={14} />
                          <span>{workspace._count?.whatsappSessions || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(workspace.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/workspaces/${workspace.id}/users`}
                          className="p-2 hover:bg-gray-800 rounded transition"
                          title="Manage users"
                        >
                          <UserCog size={16} className="text-gray-400" />
                        </Link>
                        <button
                          onClick={() => openEditModal(workspace)}
                          className="p-2 hover:bg-gray-800 rounded transition"
                          title="Edit workspace"
                        >
                          <Edit2 size={16} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(workspace)}
                          className="p-2 hover:bg-red-500/20 rounded transition"
                          title="Delete workspace"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingWorkspace ? 'Edit Workspace' : 'New Workspace'}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Workspace Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Acme Corporation"
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded focus:outline-none focus:border-primary text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@example.com"
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded focus:outline-none focus:border-primary text-white"
                  />
                </div>

                {editingWorkspace && (
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-700 bg-[#0a0a0a] text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingWorkspace(null)
                    setFormData({ name: '', email: '', isActive: true })
                    setError(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={editingWorkspace ? handleUpdate : handleCreate}
                  disabled={!formData.name.trim() || !formData.email.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-black rounded hover:bg-primary/80 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingWorkspace ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingWorkspace && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-red-400">Delete Workspace</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
                  {error}
                </div>
              )}

              <p className="text-gray-300 mb-4">
                Are you sure you want to delete the workspace <strong>{deletingWorkspace.name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone. All associated data (users, workflows, sessions) will be deleted.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletingWorkspace(null)
                    setError(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-400 transition font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default function WorkspacesPage() {
  return (
    <SuperAdminGuardWrapper>
      <WorkspacesPageContent />
    </SuperAdminGuardWrapper>
  )
}

