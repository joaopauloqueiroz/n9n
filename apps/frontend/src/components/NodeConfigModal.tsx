'use client'

import { useState, useEffect } from 'react'
import { WorkflowNode, WorkflowNodeType } from '@n9n/shared'
import { apiClient } from '@/lib/api-client'

interface NodeConfigModalProps {
  node: WorkflowNode | null
  tenantId: string
  onClose: () => void
  onSave: (nodeId: string, config: any) => void
}

export default function NodeConfigModal({
  node,
  tenantId,
  onClose,
  onSave,
}: NodeConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'parameters' | 'settings'>('parameters')
  const [config, setConfig] = useState<any>({})
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (node) {
      setConfig(node.config || {})
      
      // Load sessions if it's a trigger node
      if (node.type === WorkflowNodeType.TRIGGER_MESSAGE) {
        loadSessions()
      }
    }
  }, [node])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getWhatsappSessions(tenantId)
      setSessions(data.filter((s: any) => s.status === 'CONNECTED'))
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (node) {
      onSave(node.id, config)
      onClose()
    }
  }

  if (!node) return null

  const renderConfigFields = () => {
    switch (node.type) {
      case WorkflowNodeType.TRIGGER_MESSAGE:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                WhatsApp Session
              </label>
              <select
                value={config.sessionId || ''}
                onChange={(e) => setConfig({ ...config, sessionId: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#151515] border border-gray-700 rounded focus:outline-none focus:border-primary text-white"
                disabled={loading}
              >
                <option value="">All Sessions</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} ({session.phoneNumber})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1.5">
                Leave empty to listen on all sessions
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                Message Pattern
              </label>
              <input
                type="text"
                value={config.pattern || ''}
                onChange={(e) => setConfig({ ...config, pattern: e.target.value })}
                placeholder="e.g., hello, start, menu"
                className="w-full px-4 py-2.5 bg-[#151515] border border-gray-700 rounded focus:outline-none focus:border-primary text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                The message that triggers this workflow
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                Match Type
              </label>
              <select
                value={config.matchType || 'exact'}
                onChange={(e) => setConfig({ ...config, matchType: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#151515] border border-gray-700 rounded focus:outline-none focus:border-primary text-white"
              >
                <option value="exact">Exact Match</option>
                <option value="contains">Contains</option>
                <option value="startsWith">Starts With</option>
                <option value="regex">Regex</option>
              </select>
            </div>
          </div>
        )

      case WorkflowNodeType.SEND_MESSAGE:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                Message
              </label>
              <textarea
                value={config.message || ''}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                placeholder="Type your message here..."
                rows={8}
                className="w-full px-4 py-3 bg-[#151515] border border-gray-700 rounded focus:outline-none focus:border-primary resize-none text-white placeholder-gray-500 font-mono text-sm"
              />
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-gray-500">
                  Use <code className="px-1.5 py-0.5 bg-gray-800 rounded text-primary">{`{{variables.name}}`}</code> to insert variables
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                Delay (ms)
              </label>
              <input
                type="number"
                value={config.delay || 0}
                onChange={(e) => setConfig({ ...config, delay: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                className="w-full px-4 py-2.5 bg-[#151515] border border-gray-700 rounded focus:outline-none focus:border-primary text-white"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Optional delay before sending (in milliseconds)
              </p>
            </div>
          </div>
        )

      case WorkflowNodeType.WAIT_REPLY:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                Save Reply As
              </label>
              <input
                type="text"
                value={config.saveAs || ''}
                onChange={(e) => setConfig({ ...config, saveAs: e.target.value })}
                placeholder="e.g., userName, email, choice"
                className="w-full px-4 py-2.5 bg-[#151515] border border-gray-700 rounded focus:outline-none focus:border-primary text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Variable name to store the user's reply
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                Timeout (seconds)
              </label>
              <input
                type="number"
                value={config.timeoutSeconds || 300}
                onChange={(e) => setConfig({ ...config, timeoutSeconds: parseInt(e.target.value) || 300 })}
                placeholder="300"
                min="10"
                className="w-full px-4 py-2.5 bg-[#151515] border border-gray-700 rounded focus:outline-none focus:border-primary text-white"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                How long to wait for a reply (default: 300s)
              </p>
            </div>
          </div>
        )

      case WorkflowNodeType.CONDITION:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                Condition Expression
              </label>
              <textarea
                value={config.expression || ''}
                onChange={(e) => setConfig({ ...config, expression: e.target.value })}
                placeholder="e.g., variables.age > 18"
                rows={4}
                className="w-full px-4 py-3 bg-[#151515] border border-gray-700 rounded focus:outline-none focus:border-primary resize-none font-mono text-sm text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                JavaScript expression that returns true or false
              </p>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">
              No configuration available for this node type.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-green-400 rounded-lg flex items-center justify-center text-xl">
              {node.type === WorkflowNodeType.TRIGGER_MESSAGE ? '📨' :
               node.type === WorkflowNodeType.SEND_MESSAGE ? '💬' :
               node.type === WorkflowNodeType.WAIT_REPLY ? '⏳' :
               node.type === WorkflowNodeType.CONDITION ? '🔀' : '⚙️'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {node.type.replace(/_/g, ' ')}
              </h2>
              <p className="text-xs text-gray-400">Node ID: {node.id.substring(0, 8)}...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-[#151515]">
          <button
            onClick={() => setActiveTab('parameters')}
            className={`px-6 py-3 text-sm font-medium transition relative ${
              activeTab === 'parameters'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Parameters
            {activeTab === 'parameters' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 text-sm font-medium transition relative ${
              activeTab === 'settings'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Settings
            {activeTab === 'settings' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'parameters' ? renderConfigFields() : (
            <div className="space-y-4">
              <div className="text-sm text-gray-400">
                <p>Additional settings for this node.</p>
              </div>
              <div className="bg-[#151515] border border-gray-700 rounded p-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium">Always Output Data</span>
                  <input type="checkbox" className="w-4 h-4" />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-[#151515]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2 bg-primary text-black rounded font-semibold hover:bg-primary/90 transition shadow-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

