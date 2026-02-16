# Scripts de Exportação

## Exportar Workflows

Este script exporta todos os workflows do banco de dados para um arquivo JSON.

### Uso

#### Exportar todos os workflows:
```bash
pnpm export:workflows
```

#### Exportar workflows de um tenant específico:
```bash
pnpm export:workflows -- --tenant=<tenant-id>
```

#### Especificar caminho de saída:
```bash
pnpm export:workflows -- --output=/caminho/para/arquivo.json
```

#### Combinar opções:
```bash
pnpm export:workflows -- --tenant=<tenant-id> --output=/caminho/para/arquivo.json
```

### Formato de Saída

O arquivo JSON gerado contém:
- `exportedAt`: Data/hora da exportação
- `totalWorkflows`: Número total de workflows exportados
- `workflows`: Array com os dados completos de cada workflow, incluindo:
  - Informações do workflow (id, name, description, etc.)
  - Informações do tenant
  - Nodes e edges (estrutura completa do workflow)
  - Status (ativo/inativo)
  - Datas de criação e atualização

### Localização dos Arquivos

Por padrão, os arquivos são salvos em `apps/backend/exports/` com o nome:
- `workflows-all-<timestamp>.json` (todos os workflows)
- `workflows-tenant-<tenant-id>-<timestamp>.json` (workflows de um tenant)
