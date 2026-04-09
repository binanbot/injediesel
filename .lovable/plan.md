
# Maturidade Operacional: Financeiro + CRM

## Bloco 1 — Endurecimento Financeiro

### Migração
- Adicionar colunas em `financial_entries`:
  - `status` (rascunho, lancado, aprovado, pago, cancelado) — default 'lancado'
  - `approved_by` uuid nullable
  - `approved_at` timestamptz nullable
  - `attachment_url` text nullable (preparação futura)
  - `closing_month_locked` boolean default false
- Criar tabela `financial_closing_periods` para travas de fechamento mensal:
  - `company_id`, `reference_month`, `status` (aberto, fechado), `closed_by`, `closed_at`
  - RLS: company admins gerenciam próprios, master gerencia todos

### Service/UI
- Atualizar `financialService.ts` com lógica de status e validação de mês fechado
- Adicionar workflow de aprovação no `/admin/financeiro`
- Adicionar indicador visual de mês fechado/aberto
- Subcategorias já existem no schema — melhorar UI com agrupamento

## Bloco 2 — CRM Operacional

### Migração
- Adicionar colunas em `crm_activities`:
  - `priority` text (baixa, media, alta, urgente) default 'media'
  - `due_date` timestamptz nullable
  - `reminder_at` timestamptz nullable
- Adicionar coluna em `customers`:
  - `wallet_status` text (ativa, inativa, em_risco) default 'ativa'

### Service/UI
- Expandir `crmService.ts`:
  - `fetchWalletHealth(companyId)` — classifica clientes por última compra
  - `fetchSellerProductivity(companyId)` — atividades vs receita por vendedor
  - `fetchReactivationCandidates(companyId, days)` — clientes inativos com potencial
- Melhorar `/admin/crm`:
  - Tab Carteira: status visual (ativa/inativa/risco), filtros por vendedor
  - Tab Atividades: prioridade, data de vencimento, lembretes atrasados
  - Alertas operacionais inline

## Bloco 3 — Integração CRM + Financeiro + Comercial

### Service
- Criar `walletProfitabilityService.ts`:
  - Receita por carteira do vendedor
  - Custo do vendedor vs receita da carteira
  - ROI por carteira
- Adicionar cards resumo no `/admin/crm` tab Carteira

## Bloco 4 — Governança
- Auditoria para aprovação/rejeição de lançamentos financeiros
- Auditoria para fechamento de mês
- Auditoria para mudança de status de carteira
- Tudo com company scope e RLS existente

## Ordem de implementação
1. Migração (Bloco 1 + 2 juntos)
2. Services financeiros (Bloco 1)
3. UI financeiro (Bloco 1)
4. Services CRM (Bloco 2)
5. UI CRM (Bloco 2)
6. Integração carteira+rentabilidade (Bloco 3)
7. Auditoria (Bloco 4)

## Checklist de validação
- [ ] Lançamento financeiro com status funciona
- [ ] Mês fechado impede novos lançamentos
- [ ] Aprovação de despesa registra auditoria
- [ ] Atividades CRM com prioridade e vencimento
- [ ] Carteira com classificação ativa/inativa/risco
- [ ] Produtividade por carteira calculada
- [ ] Tudo respeita company scope
- [ ] TypeScript sem erros
- [ ] Injediesel e PROMAX intactos
