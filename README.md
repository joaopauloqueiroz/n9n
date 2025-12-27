# N9N - Conversation Workflow Engine

> A multi-tenant SaaS platform for creating and managing conversational workflows via WhatsApp Web.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.3-red)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

## 🎯 What is N9N?

N9N is a **Conversation Workflow Engine as a Service** - think of it as "n8n for WhatsApp conversations". Create intelligent, stateful chatbot experiences with a visual workflow builder.

### Key Features

✅ **Visual Workflow Builder** - Drag-and-drop canvas like n8n  
✅ **Stateful Execution** - Pause and resume conversations  
✅ **Multi-tenant** - Complete data isolation  
✅ **Real-time Monitoring** - Watch executions live  
✅ **Anti-Deadlock** - 4 layers of protection  
✅ **WhatsApp Integration** - Native WhatsApp Web support  

## 🏗️ Architecture

- **Backend**: NestJS + TypeScript + PostgreSQL + Redis
- **Frontend**: Next.js + React Flow + Socket.IO
- **WhatsApp**: whatsapp-web.js + Puppeteer

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Redis 6+

### Installation

```bash
# Clone and install
git clone <repo-url>
cd n9n
pnpm install

# Start databases
docker-compose up -d

# Setup backend
cd apps/backend
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Setup frontend
cd ../frontend
cp .env.example .env

# Start everything
cd ../..
pnpm dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📚 Documentation

- **[Getting Started Guide](./GETTING_STARTED.md)** - Step-by-step tutorial
- **[Architecture Documentation](./ARCHITECTURE.md)** - System design deep dive
- **[Example Workflows](./EXAMPLE_WORKFLOWS.md)** - Ready-to-use examples
- **[Quick Reference](./QUICK_REFERENCE.md)** - Cheat sheet
- **[Diagrams](./DIAGRAMS.md)** - Visual system diagrams
- **[Project Summary](./PROJECT_SUMMARY.md)** - Complete overview

## 🎨 Example Workflow

```
TRIGGER_MESSAGE (pattern: "hello")
    ↓
SEND_MESSAGE ("Hello! What's your name?")
    ↓
WAIT_REPLY (saveAs: "userName", timeout: 300s)
    ↓
SEND_MESSAGE ("Nice to meet you, {{variables.userName}}!")
    ↓
END
```

## 🔧 Core Concepts

### State Machine Architecture

Every execution is a persistent state machine:

```typescript
while (status === RUNNING && currentNodeId) {
  executeNode()
  if (shouldWait) pause()
  else moveToNext()
}
```

### Anti-Deadlock Mechanisms

1. **Global TTL**: Every execution expires after 24h
2. **Node TTL**: WAIT_REPLY nodes have timeouts
3. **Interaction Limit**: Max 20 interactions per execution
4. **Mandatory END**: All workflows must terminate

### Context System

Data flows between nodes via execution context:

```typescript
{
  globals: {},      // Global workflow data
  variables: {},    // Persistent variables
  input: {},        // Node input
  output: {}        // Node output
}
```

## 📦 Project Structure

```
n9n/
├── apps/
│   ├── backend/          # NestJS API
│   │   ├── src/
│   │   │   ├── execution/      # Execution engine
│   │   │   ├── whatsapp/       # WhatsApp integration
│   │   │   ├── event-bus/      # Event system
│   │   │   ├── worker/         # Background workers
│   │   │   └── workflow/       # REST API
│   │   └── prisma/             # Database schema
│   └── frontend/         # Next.js UI
│       └── src/
│           ├── app/           # Pages
│           ├── components/    # React components
│           └── lib/           # API client
└── packages/
    └── shared/           # Shared TypeScript types
```

## 🎯 Node Types

| Node | Purpose | Behavior |
|------|---------|----------|
| 📨 TRIGGER_MESSAGE | Start workflow on message | Matches pattern |
| 💬 SEND_MESSAGE | Send WhatsApp message | Continues immediately |
| ⏳ WAIT_REPLY | Wait for user response | Pauses execution |
| 🔀 CONDITION | Branch based on expression | Routes to next node |
| 🏁 END | Terminate workflow | Completes execution |

## 🔌 API Usage

### Create Workflow

```bash
curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "demo-tenant",
    "name": "My Workflow"
  }'
```

### WebSocket Events

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001', {
  query: { tenantId: 'demo-tenant' }
})

socket.on('workflow:event', (event) => {
  console.log(event.type, event)
})
```

## 🧪 Testing

```bash
cd apps/backend
pnpm test
```

## 🚀 Production Deployment

See [Getting Started Guide](./GETTING_STARTED.md#production-deployment) for production setup.

## 🤝 Contributing

Contributions are welcome! Please read the documentation first.

## 📝 License

MIT - See [LICENSE](./LICENSE) file for details.

## 🎓 Learn More

- [Architecture Documentation](./ARCHITECTURE.md) - Understand the system
- [Example Workflows](./EXAMPLE_WORKFLOWS.md) - Learn by example
- [Quick Reference](./QUICK_REFERENCE.md) - Quick lookup

---

**Built with ❤️ for conversational workflows**

