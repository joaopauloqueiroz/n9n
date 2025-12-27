'use client'

import { useCallback, useEffect, useState } from 'react'
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
} from 'reactflow'
import 'reactflow/dist/style.css'
import { WorkflowNode, WorkflowEdge, WorkflowNodeType } from '@n9n/shared'
import CustomNode from './nodes/CustomNode'

const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

interface WorkflowCanvasProps {
  initialNodes: WorkflowNode[]
  initialEdges: WorkflowEdge[]
  onChange?: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void
  readonly?: boolean
  currentNodeId?: string | null
  executionStatus?: 'idle' | 'running' | 'waiting' | 'completed' | 'failed'
  onNodeDoubleClick?: (node: WorkflowNode) => void
}

export default function WorkflowCanvas({
  initialNodes,
  initialEdges,
  onChange,
  readonly = false,
  currentNodeId,
  executionStatus = 'idle',
  onNodeDoubleClick,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

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
      },
    }))

    const flowEdges: Edge[] = initialEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: currentNodeId === edge.source,
      style: currentNodeId === edge.source ? { stroke: '#00FF88', strokeWidth: 2 } : undefined,
    }))

    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [initialNodes, initialEdges, currentNodeId, executionStatus])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (readonly) return

      const newEdge = {
        ...connection,
        id: `edge-${Date.now()}`,
      }
      setEdges((eds) => addEdge(newEdge, eds))

      if (onChange) {
        const workflowEdges: WorkflowEdge[] = [...edges, newEdge as any].map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
        }))
        onChange(initialNodes, workflowEdges)
      }
    },
    [readonly, edges, initialNodes, onChange]
  )

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes)

      if (onChange && !readonly) {
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
        onChange(updatedNodes, initialEdges)
      }
    },
    [nodes, initialEdges, onChange, readonly, onNodesChange]
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

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
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

