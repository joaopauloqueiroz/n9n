'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  EdgeTypes,
  useReactFlow,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { WorkflowNode, WorkflowEdge, WorkflowNodeType } from '@n9n/shared'
import CustomNode from './nodes/CustomNode'
import CustomEdge from './edges/CustomEdge'
import { Trash2 } from 'lucide-react'

const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
}

interface WorkflowCanvasProps {
  initialNodes: WorkflowNode[]
  initialEdges: WorkflowEdge[]
  onChange?: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void
  readonly?: boolean
  currentNodeId?: string | null
  executionStatus?: 'idle' | 'running' | 'waiting' | 'completed' | 'failed'
  onNodeDoubleClick?: (node: WorkflowNode) => void
  onAddNode?: (type: WorkflowNodeType, position?: { x: number; y: number }) => void
  onManualTrigger?: (nodeId: string) => void
  executedNodes?: Set<string>
  failedNodes?: Set<string>
  executedEdges?: Set<string>
  failedEdges?: Set<string>
}

export default function WorkflowCanvas({
  initialNodes,
  initialEdges,
  onChange,
  readonly = false,
  currentNodeId,
  executionStatus = 'idle',
  onNodeDoubleClick,
  onAddNode,
  onManualTrigger,
  executedNodes = new Set(),
  failedNodes = new Set(),
  executedEdges = new Set(),
  failedEdges = new Set(),
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [selectedEdges, setSelectedEdges] = useState<string[]>([])
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Convert to React Flow format
  useEffect(() => {
    const flowNodes: Node[] = initialNodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: node.position || { x: 0, y: 0 },
      data: {
        type: node.type,
        config: node.config,
        isActive: currentNodeId === node.id,
        executionStatus,
        hasExecuted: executedNodes.has(node.id),
        executionSuccess: executedNodes.has(node.id) && !failedNodes.has(node.id),
        onManualTrigger,
      },
    }))

    const flowEdges: Edge[] = initialEdges.map((edge) => {
      // Use edge.id if available, otherwise create from source-target
      const edgeId = edge.id || `${edge.source}-${edge.target}`
      const edgeKey = `${edge.source}-${edge.target}` // Key for tracking
      const isExecuted = executedEdges.has(edgeKey) || executedEdges.has(edgeId)
      const isFailed = failedEdges.has(edgeKey) || failedEdges.has(edgeId)
      const isCurrentlyActive = currentNodeId === edge.source
      
      // Determine edge color and style based on execution status
      let edgeStyle: any = {}
      
      if (isFailed) {
        // Red for failed edges - thicker and more visible
        edgeStyle.stroke = '#ef4444'
        edgeStyle.strokeWidth = 3
      } else if (isExecuted) {
        // Green for successfully executed edges - thicker and more visible
        edgeStyle.stroke = '#22c55e'
        edgeStyle.strokeWidth = 3
      } else if (isCurrentlyActive) {
        // Cyan for currently active edge - animated
        edgeStyle.stroke = '#00FF88'
        edgeStyle.strokeWidth = 2.5
      } else if (edge.condition === 'true') {
        // Green tint for True condition edges
        edgeStyle.stroke = '#4ade80'
        edgeStyle.strokeWidth = 2
      } else if (edge.condition === 'false') {
        // Red tint for False condition edges
        edgeStyle.stroke = '#f87171'
        edgeStyle.strokeWidth = 2
      } else {
        // Default gray for non-executed edges
        edgeStyle.stroke = '#3a3a3a'
        edgeStyle.strokeWidth = 2
      }
      
      return {
        id: edge.id,
        type: 'custom',
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.condition || undefined, // Use condition as sourceHandle for CONDITION nodes
        label: edge.label || (edge.condition === 'true' ? 'True' : edge.condition === 'false' ? 'False' : undefined),
        animated: isCurrentlyActive,
        style: edgeStyle,
      }
    })

    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [initialNodes, initialEdges, currentNodeId, executionStatus, executedNodes, failedNodes, executedEdges, failedEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (readonly) return

      const newEdge = {
        ...connection,
        id: `edge-${Date.now()}`,
      }
      
      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds)
        
        if (onChange) {
          // Convert current nodes to WorkflowNode format
          const workflowNodes: WorkflowNode[] = nodes.map((node) => ({
            id: node.id,
            type: node.data.type,
            config: node.data.config,
            position: node.position,
          }))
          
          // Convert updated edges to WorkflowEdge format
          const workflowEdges: WorkflowEdge[] = updatedEdges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: typeof e.label === 'string' ? e.label : undefined,
            condition: e.sourceHandle || undefined, // Save sourceHandle as condition (for CONDITION nodes)
          }))
          
          onChange(workflowNodes, workflowEdges)
        }
        
        return updatedEdges
      })
    },
    [readonly, nodes, onChange]
  )

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes)

      if (onChange && !readonly) {
        // Only save on position changes (when user stops dragging)
        const hasPositionChange = changes.some((c: any) => c.type === 'position' && c.dragging === false)
        
        if (hasPositionChange) {
          // Update positions
          const updatedNodes: WorkflowNode[] = nodes.map((node) => {
            const change = changes.find((c: any) => c.id === node.id && c.type === 'position')
            if (change && change.position) {
              return {
                id: node.id,
                type: node.data.type,
                config: node.data.config,
                position: change.position,
              }
            }
            return {
              id: node.id,
              type: node.data.type,
              config: node.data.config,
              position: node.position,
            }
          })
          
          // Convert current edges to WorkflowEdge format
          const workflowEdges: WorkflowEdge[] = edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: typeof e.label === 'string' ? e.label : undefined,
            condition: e.sourceHandle || undefined, // Save sourceHandle as condition (for CONDITION nodes)
          }))
          
          onChange(updatedNodes, workflowEdges)
        }
      }
    },
    [nodes, edges, onChange, readonly, onNodesChange]
  )

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes)

      if (onChange && !readonly) {
        // Check if there's a remove change
        const hasRemove = changes.some((c: any) => c.type === 'remove')
        
        if (hasRemove) {
          // Wait for state to update, then save
          setTimeout(() => {
            setEdges((currentEdges) => {
              const workflowNodes: WorkflowNode[] = nodes.map((node) => ({
                id: node.id,
                type: node.data.type,
                config: node.data.config,
                position: node.position,
              }))
              
              const workflowEdges: WorkflowEdge[] = currentEdges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                label: typeof e.label === 'string' ? e.label : undefined,
                condition: e.sourceHandle || undefined,
              }))
              
              onChange(workflowNodes, workflowEdges)
              return currentEdges
            })
          }, 0)
        }
      }
    },
    [nodes, onChange, readonly, onEdgesChange]
  )

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeDoubleClick) {
        // Find the original workflow node
        const workflowNode = initialNodes.find((n) => n.id === node.id)
        if (workflowNode) {
          onNodeDoubleClick(workflowNode)
        }
      }
    },
    [onNodeDoubleClick, initialNodes]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow') as WorkflowNodeType
      
      if (typeof type === 'undefined' || !type || !reactFlowWrapper.current) {
        return
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }

      if (onAddNode) {
        onAddNode(type, position)
      }
    },
    [onAddNode]
  )

  const onSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[], edges: Edge[] }) => {
    setSelectedNodes(selectedNodes.map(n => n.id))
    setSelectedEdges(selectedEdges.map(e => e.id))
  }, [])

  const handleDelete = useCallback(() => {
    if (readonly) return

    // Delete selected nodes
    if (selectedNodes.length > 0) {
      const updatedNodes = nodes.filter(n => !selectedNodes.includes(n.id))
      const updatedEdges = edges.filter(e => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target))
      
      setNodes(updatedNodes)
      setEdges(updatedEdges)

      if (onChange) {
        const workflowNodes: WorkflowNode[] = updatedNodes.map((node) => ({
          id: node.id,
          type: node.data.type,
          config: node.data.config,
          position: node.position,
        }))
        
        const workflowEdges: WorkflowEdge[] = updatedEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: typeof e.label === 'string' ? e.label : undefined,
          condition: e.sourceHandle || undefined,
        }))
        
        onChange(workflowNodes, workflowEdges)
      }
      
      setSelectedNodes([])
    }

    // Delete selected edges
    if (selectedEdges.length > 0) {
      const updatedEdges = edges.filter(e => !selectedEdges.includes(e.id))
      
      setEdges(updatedEdges)

      if (onChange) {
        const workflowNodes: WorkflowNode[] = nodes.map((node) => ({
          id: node.id,
          type: node.data.type,
          config: node.data.config,
          position: node.position,
        }))
        
        const workflowEdges: WorkflowEdge[] = updatedEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: typeof e.label === 'string' ? e.label : undefined,
          condition: e.sourceHandle || undefined,
        }))
        
        onChange(workflowNodes, workflowEdges)
      }
      
      setSelectedEdges([])
    }
  }, [readonly, selectedNodes, selectedEdges, nodes, edges, onChange])

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && !readonly) {
        // Check if we're not in an input field
        const target = event.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault()
          handleDelete()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDelete, readonly])

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={handleNodeDoubleClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        defaultEdgeOptions={{
          type: 'custom',
          animated: true,
        }}
      >
        <Controls />
        <Background />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.isActive) return '#00FF88'
            return '#333'
          }}
        />
        
      </ReactFlow>
    </div>
  )
}

