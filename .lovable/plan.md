
# CRM Operacional Acionável

## Análise
- Tabela `crm_activities` já suporta tarefas com prioridade, vencimento, status e vendedor
- `fetchWalletHealth` já classifica clientes (ativa/em_risco/inativa)
- `fetchCustomersWithoutRecentPurchase` e `fetchOverdueActivities` já existem
- Nenhuma migração necessária — evolução 100% em UI e services

## Plano por Blocos

### Bloco 1 — Tarefas Comerciais (nova tab)
- Filtro por vendedor, prioridade, status
- Tarefas atrasadas e próximas destacadas
- Contadores por status
- Reutiliza ActivityDialog existente

### Bloco 2 — Agenda/Follow-up (nova tab)
- Visão por vendedor com atividades agendadas
- Indicadores de atraso
- Atividades pendentes por carteira
- Produtividade (completadas vs total)

### Bloco 3 — Reativação de Clientes (evolução da tab Carteira)
- Filtro "Reativação" na carteira
- Ações rápidas: registrar contato, marcar retorno, sem interesse
- Lista de inativos/em risco por vendedor

### Bloco 4 — Listas Operacionais por Carteira (evolução tab Carteira)
- Filtro por vendedor na carteira
- Sub-filtros: sem vendedor, follow-up pendente, em risco, fora da carteira
- Ações rápidas inline

## Implementação
1. Expandir `crmService.ts` com queries de agenda e reativação
2. Refatorar `Crm.tsx` com novas tabs e filtros
3. Manter security scan e company scope
