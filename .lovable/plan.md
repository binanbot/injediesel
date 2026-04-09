
# CRM: Automação Leve + Inteligência Operacional

## Análise
- Base CRM completa com 8 tabs, reativação, agenda, tarefas
- operationalAlertsService já gera alertas CRM/financeiro/comercial
- crmService já tem wallet health, productivity, reactivation
- companies.settings (JSONB) já suporta config por empresa
- Nenhuma migração necessária — evolução 100% em services + UI

## Plano por Blocos

### Bloco 1 — Sugestões automáticas de tarefa (novo service)
Criar `src/services/crmAutomationService.ts`:
- `generateTaskSuggestions(companyId, config)` → lista de sugestões
- Regras: cliente em risco sem contato 7d, inativo sem reativação, oportunidade parada 15d, follow-up vencido 3d, cliente sem vendedor
- Cada sugestão: { type, customerId, sellerId, reason, priority, suggestedAction }
- Usa dados já carregados (wallet, activities, opportunities)

### Bloco 2 — SLA Comercial (novo service)
Criar `src/services/crmSlaService.ts`:
- `calcCommercialSla(companyId)` → métricas SLA
- Tempo médio até primeiro contato (1ª atividade após criação do cliente)
- Tempo médio até retorno (atividades tipo retorno)
- Taxa de follow-up no prazo (% atividades concluídas antes do due_date)
- Atividades concluídas vs atrasadas por vendedor
- Retorna objeto com métricas globais + por vendedor

### Bloco 3 — Regras configuráveis por empresa
Usar `companies.settings.crm_config`:
- `days_at_risk`: 45 (default)
- `days_inactive`: 90 (default)
- `default_followup_days`: 7 (default)
- `stale_opportunity_days`: 15 (default)
- Helper `getCrmConfig(settings)` com defaults
- Integrar no walletHealth e alerts existentes

### Bloco 4 — Nova tab "Inteligência" no CRM
Adicionar tab no Crm.tsx com:
- Cards de sugestões automáticas com ação rápida "Criar tarefa"
- Painel SLA com métricas de tempo e taxa
- Seção de regras configuráveis (somente leitura ou edição inline)

### Bloco 5 — Segurança
- Manter company scope em todos os services
- Verificar scan de segurança
- Nenhuma nova tabela = sem nova superfície RLS

## Implementação
1. crmAutomationService.ts
2. crmSlaService.ts  
3. getCrmConfig helper
4. Tab "Inteligência" no Crm.tsx
5. Security check
