import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { WorkflowNodeType } from '@n9n/shared'

const nodeConfig = {
  [WorkflowNodeType.TRIGGER_MESSAGE]: {
    label: 'Message Trigger',
    icon: '📨',
    color: 'bg-blue-600',
  },
  [WorkflowNodeType.TRIGGER_SCHEDULE]: {
    label: 'Schedule Trigger',
    icon: '⏰',
    color: 'bg-purple-600',
  },
  [WorkflowNodeType.SEND_MESSAGE]: {
    label: 'Send Message',
    icon: '💬',
    color: 'bg-green-600',
  },
  [WorkflowNodeType.CONDITION]: {
    label: 'Condition',
    icon: '🔀',
    color: 'bg-yellow-600',
  },
  [WorkflowNodeType.WAIT_REPLY]: {
    label: 'Wait Reply',
    icon: '⏳',
    color: 'bg-orange-600',
  },
  [WorkflowNodeType.END]: {
    label: 'End',
    icon: '🏁',
    color: 'bg-red-600',
  },
}

interface CustomNodeProps {
  data: {
    type: WorkflowNodeType
    config: any
    isActive?: boolean
    executionStatus?: 'idle' | 'running' | 'waiting' | 'completed' | 'failed'
  }
}

function CustomNode({ data }: CustomNodeProps) {
  const config = nodeConfig[data.type] || {
    label: data.type,
    icon: '❓',
    color: 'bg-gray-600',
  }

  const isTrigger =
    data.type === WorkflowNodeType.TRIGGER_MESSAGE ||
    data.type === WorkflowNodeType.TRIGGER_SCHEDULE

  const isEnd = data.type === WorkflowNodeType.END

  // Determine border style based on execution state
  const getBorderClass = () => {
    if (!data.isActive) return 'border-border'
    
    if (data.executionStatus === 'completed' && isEnd) {
      return 'border-primary shadow-lg shadow-primary/50'
    }
    
    if (data.executionStatus === 'waiting') {
      return 'border-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50'
    }
    
    if (data.executionStatus === 'failed') {
      return 'border-red-500 shadow-lg shadow-red-500/50'
    }
    
    return 'border-primary animate-pulse shadow-lg shadow-primary/50'
  }

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] transition-all ${getBorderClass()}`}
    >
      {!isTrigger && <Handle type="target" position={Position.Top} />}

      <div className="flex items-center gap-2">
        <span className="text-2xl">{config.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-sm">{config.label}</div>
            {data.isActive && (
              <div className={`w-2 h-2 rounded-full ${
                data.executionStatus === 'waiting' ? 'bg-yellow-500 animate-pulse' :
                data.executionStatus === 'completed' ? 'bg-primary' :
                data.executionStatus === 'failed' ? 'bg-red-500' :
                'bg-blue-500 animate-pulse'
              }`} />
            )}
          </div>
          {data.config.message && (
            <div className="text-xs text-gray-400 mt-1 truncate max-w-[120px]">
              {data.config.message}
            </div>
          )}
          {data.config.pattern && (
            <div className="text-xs text-gray-400 mt-1 truncate max-w-[120px]">
              Pattern: {data.config.pattern}
            </div>
          )}
        </div>
      </div>

      {!isEnd && <Handle type="source" position={Position.Bottom} />}
    </div>
  )
}

export default memo(CustomNode)

