import { io, Socket } from 'socket.io-client'
import { WorkflowEvent } from '@n9n/shared'

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

class WebSocketClient {
  private socket: Socket | null = null
  private listeners: Map<string, Set<(event: WorkflowEvent) => void>> = new Map()

  connect(tenantId: string) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected')
      return
    }

    console.log('Connecting to WebSocket:', WS_URL, 'with tenantId:', tenantId)

    this.socket = io(WS_URL, {
      query: { tenantId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully!')
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
    })

    this.socket.on('workflow:event', (event: WorkflowEvent) => {
      console.log('📨 Received event:', event.type, event)
      
      const handlers = this.listeners.get(event.type)
      if (handlers) {
        handlers.forEach((handler) => handler(event))
      }

      // Also trigger wildcard listeners
      const wildcardHandlers = this.listeners.get('*')
      if (wildcardHandlers) {
        wildcardHandlers.forEach((handler) => handler(event))
      }
    })

    // Listen to all events for debugging
    this.socket.onAny((eventName, ...args) => {
      console.log('🔔 Socket event:', eventName, args)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(eventType: string, handler: (event: WorkflowEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(handler)
  }

  off(eventType: string, handler: (event: WorkflowEvent) => void) {
    const handlers = this.listeners.get(eventType)
    if (handlers) {
      handlers.delete(handler)
    }
  }
}

export const wsClient = new WebSocketClient()

