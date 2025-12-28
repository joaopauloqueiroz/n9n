'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

interface ExecutionHistoryProps {
  workflowId: string
  tenantId: string
  onClose: () => void
  onSelectExecution?: (executionId: string, logs: any[]) => void
}

export default function ExecutionHistory({
  workflowId,
  tenantId,
  onClose,
  onSelectExecution,
}: ExecutionHistoryProps) {
  const [executions, setExecutions] = useState<any[]>([])
  const [selectedExecution, setSelectedExecution] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExecutions()
  }, [workflowId])

  const loadExecutions = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getWorkflowExecutions(tenantId, workflowId)
      setExecutions(data)
    } catch (error) {
      console.error('Error loading executions:', error)
      setExecutions([])
    } finally {
      setLoading(false)
    }
  }

  const loadExecutionLogs = async (executionId: string) => {
    try {
      const data = await apiClient.getExecutionLogs(tenantId, executionId)
      setLogs(data)
      return data
    } catch (error) {
      console.error('Error loading logs:', error)
      setLogs([])
      return []
    }
  }

  const handleSelectExecution = async (execution: any) => {
    setSelectedExecution(execution)
    const executionLogs = await loadExecutionLogs(execution.id)
    
    // Notify parent component to visualize in the workflow
    if (onSelectExecution && executionLogs) {
      onSelectExecution(execution.id, executionLogs)
      onClose() // Close the history modal
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-primary'
      case 'RUNNING':
        return 'text-blue-500'
      case 'WAITING':
        return 'text-yellow-500'
      case 'FAILED':
        return 'text-red-500'
      case 'EXPIRED':
        return 'text-orange-500'
      default:
        return 'text-gray-400'
    }
  }

  const getEventIcon = (eventType?: string) => {
    if (!eventType) return '•'
    if (eventType.includes('started')) return '▶️'
    if (eventType.includes('completed')) return '✅'
    if (eventType.includes('waiting')) return '⏳'
    if (eventType.includes('resumed')) return '🔄'
    if (eventType.includes('node.executed')) return '✓'
    if (eventType.includes('error')) return '❌'
    return '•'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-lg w-full max-w-6xl h-[80vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold">Execution History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Executions List */}
          <div className="w-1/3 border-r border-border overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">Loading...</div>
            ) : executions.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No executions yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {executions.map((execution) => (
                  <button
                    key={execution.id}
                    onClick={() => handleSelectExecution(execution)}
                    className={`w-full p-4 text-left hover:bg-background transition ${
                      selectedExecution?.id === execution.id ? 'bg-background' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-semibold ${getStatusColor(execution.status)}`}>
                        {execution.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(execution.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Contact: {execution.contactId.split('@')[0]}
                    </div>
                    <div className="text-xs text-gray-400">
                      Session: {execution.sessionId.substring(0, 8)}...
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Execution Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedExecution ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select an execution to view details
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Execution Details</h3>
                  <div className="bg-background border border-border rounded p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">ID:</span>
                      <span className="font-mono">{selectedExecution.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={getStatusColor(selectedExecution.status)}>
                        {selectedExecution.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Contact:</span>
                      <span>{selectedExecution.contactId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Started:</span>
                      <span>{new Date(selectedExecution.createdAt).toLocaleString()}</span>
                    </div>
                    {selectedExecution.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Completed:</span>
                        <span>{new Date(selectedExecution.completedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Execution Log</h3>
                  {logs.length === 0 ? (
                    <div className="text-gray-400 text-sm">No logs available</div>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log, index) => (
                        <div
                          key={index}
                          className="bg-background border border-border rounded p-3 text-sm"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg">{getEventIcon(log.type)}</span>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold">
                                  {log.type ? log.type.replace(/\./g, ' ').toUpperCase() : 'UNKNOWN'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              {log.nodeId && (
                                <div className="text-xs text-gray-400">
                                  Node: {log.nodeType} ({log.nodeId})
                                </div>
                              )}
                              {log.duration && (
                                <div className="text-xs text-gray-400">
                                  Duration: {log.duration}ms
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedExecution.context && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Context Variables</h3>
                    <div className="bg-background border border-border rounded p-4">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedExecution.context.variables, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

