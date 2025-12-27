'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { apiClient } from '@/lib/api-client'
import { wsClient } from '@/lib/websocket'
import { WorkflowNode, WorkflowEdge, EventType } from '@n9n/shared'
import NodeConfigModal from '@/components/NodeConfigModal'
import ExecutionHistory from '@/components/ExecutionHistory'
import NodeExecutionPanel from '@/components/NodeExecutionPanel'

const WorkflowCanvas = dynamic(() => import('@/components/WorkflowCanvas'), {
  ssr: false,
})

export default function WorkflowPage() {
  const params = useParams()
  const router = useRouter()
  const workflowId = params.id as string
  const tenantId = 'demo-tenant'

  const [workflow, setWorkflow] = useState<any>(null)
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null)
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'waiting' | 'completed' | 'failed'>('idle')
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null)
  const [inspectedNode, setInspectedNode] = useState<WorkflowNode | null>(null)

  useEffect(() => {
    loadWorkflow()
    wsClient.connect(tenantId)

    // Listen for execution events
    const handleExecutionStarted = (event: any) => {
      console.log('[DEBUG] Execution started event:', event)
      if (event.workflowId === workflowId) {
        console.log('[DEBUG] Setting execution ID:', event.executionId)
        setExecutionStatus('running')
        setCurrentNodeId(null)
        setCurrentExecutionId(event.executionId)
      }
    }

    const handleNodeExecuted = (event: any) => {
      if (event.workflowId === workflowId) {
        setCurrentNodeId(event.nodeId)
      }
    }

    const handleExecutionWaiting = (event: any) => {
      if (event.workflowId === workflowId) {
        setExecutionStatus('waiting')
        setCurrentNodeId(event.currentNodeId)
      }
    }

    const handleExecutionResumed = (event: any) => {
      if (event.workflowId === workflowId) {
        setExecutionStatus('running')
      }
    }

    const handleExecutionCompleted = (event: any) => {
      if (event.workflowId === workflowId) {
        setExecutionStatus('completed')
        // Keep the execution ID for a while so users can inspect nodes
        setTimeout(() => {
          setCurrentNodeId(null)
          setExecutionStatus('idle')
        }, 3000)
        // Clear execution ID after 30 seconds
        setTimeout(() => {
          setCurrentExecutionId(null)
        }, 30000)
      }
    }

    const handleExecutionError = (event: any) => {
      if (event.workflowId === workflowId) {
        setExecutionStatus('failed')
        setTimeout(() => {
          setCurrentNodeId(null)
          setExecutionStatus('idle')
        }, 5000)
      }
    }

    wsClient.on(EventType.EXECUTION_STARTED, handleExecutionStarted)
    wsClient.on(EventType.NODE_EXECUTED, handleNodeExecuted)
    wsClient.on(EventType.EXECUTION_WAITING, handleExecutionWaiting)
    wsClient.on(EventType.EXECUTION_RESUMED, handleExecutionResumed)
    wsClient.on(EventType.EXECUTION_COMPLETED, handleExecutionCompleted)
    wsClient.on(EventType.EXECUTION_ERROR, handleExecutionError)

    return () => {
      wsClient.off(EventType.EXECUTION_STARTED, handleExecutionStarted)
      wsClient.off(EventType.NODE_EXECUTED, handleNodeExecuted)
      wsClient.off(EventType.EXECUTION_WAITING, handleExecutionWaiting)
      wsClient.off(EventType.EXECUTION_RESUMED, handleExecutionResumed)
      wsClient.off(EventType.EXECUTION_COMPLETED, handleExecutionCompleted)
      wsClient.off(EventType.EXECUTION_ERROR, handleExecutionError)
    }
  }, [workflowId, tenantId])

  const loadWorkflow = async () => {
    try {
      const data = await apiClient.getWorkflow(tenantId, workflowId)
      setWorkflow(data)
    } catch (error) {
      console.error('Error loading workflow:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
    try {
      await apiClient.updateWorkflow(tenantId, workflowId, { nodes, edges })
    } catch (error) {
      console.error('Error saving workflow:', error)
    }
  }

  const handleNodeDoubleClick = (node: WorkflowNode) => {
    console.log('[DEBUG] Node double clicked:', node.id)
    console.log('[DEBUG] Current execution ID:', currentExecutionId)
    
    // If there's an active or recent execution, show execution panel
    if (currentExecutionId) {
      console.log('[DEBUG] Opening execution panel')
      setInspectedNode(node)
    } else {
      // Otherwise show config modal
      console.log('[DEBUG] Opening config modal')
      setSelectedNode(node)
    }
  }

  const handleNodeConfigSave = async (nodeId: string, config: any) => {
    try {
      const updatedNodes = workflow.nodes.map((node: WorkflowNode) =>
        node.id === nodeId ? { ...node, config } : node
      )
      await apiClient.updateWorkflow(tenantId, workflowId, { nodes: updatedNodes, edges: workflow.edges })
      setWorkflow({ ...workflow, nodes: updatedNodes })
    } catch (error) {
      console.error('Error updating node config:', error)
    }
  }

  const toggleActive = async () => {
    try {
      const updated = await apiClient.updateWorkflow(tenantId, workflowId, {
        isActive: !workflow.isActive,
      })
      setWorkflow(updated)
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Workflow not found</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-border p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-surface border border-border rounded hover:border-primary transition"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-sm text-gray-400">{workflow.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Execution Status Indicator */}
          {executionStatus !== 'idle' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded">
              <div className={`w-2 h-2 rounded-full ${
                executionStatus === 'running' ? 'bg-blue-500 animate-pulse' :
                executionStatus === 'waiting' ? 'bg-yellow-500 animate-pulse' :
                executionStatus === 'completed' ? 'bg-primary' :
                executionStatus === 'failed' ? 'bg-red-500' :
                'bg-gray-500'
              }`} />
              <span className="text-sm">
                {executionStatus === 'running' ? 'Running' :
                 executionStatus === 'waiting' ? 'Waiting for reply' :
                 executionStatus === 'completed' ? 'Completed' :
                 executionStatus === 'failed' ? 'Failed' :
                 'Idle'}
              </span>
            </div>
          )}

          {currentExecutionId && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500 rounded">
              <span className="text-sm text-blue-400">
                💡 Double-click nodes to inspect execution data
              </span>
            </div>
          )}

          <button
            onClick={() => setShowHistory(true)}
            className="px-4 py-2 bg-surface border border-border rounded hover:border-primary transition"
          >
            📊 History
          </button>

          <button
            onClick={toggleActive}
            className={`px-4 py-2 rounded transition ${
              workflow.isActive
                ? 'bg-primary text-black hover:bg-primary/80'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {workflow.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <WorkflowCanvas
          initialNodes={workflow.nodes}
          initialEdges={workflow.edges}
          onChange={handleSave}
          currentNodeId={currentNodeId}
          executionStatus={executionStatus}
          onNodeDoubleClick={handleNodeDoubleClick}
        />
      </div>

      {/* Modals & Panels */}
      {selectedNode && (
        <NodeConfigModal
          node={selectedNode}
          tenantId={tenantId}
          onClose={() => setSelectedNode(null)}
          onSave={handleNodeConfigSave}
        />
      )}

      {inspectedNode && (
        <NodeExecutionPanel
          node={inspectedNode}
          executionId={currentExecutionId}
          tenantId={tenantId}
          onClose={() => setInspectedNode(null)}
        />
      )}

      {showHistory && (
        <ExecutionHistory
          workflowId={workflowId}
          tenantId={tenantId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}

