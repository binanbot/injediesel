
## Bloco 1 — Fechamento comercial e comissão

### Modelagem
Nova tabela `commission_closings` para registrar fechamentos mensais:
- `id`, `seller_profile_id`, `company_id`
- `period_start`, `period_end`
- `orders_revenue`, `files_revenue`, `total_revenue`
- `commission_type`, `commission_value`, `estimated_commission`, `realized_commission`
- `status`: `apurada` → `aprovada` → `paga`
- `approved_by`, `approved_at`, `paid_at`
- `notes`
- RLS: company admins da própria empresa + master global
- Audit trail integrado para mudanças de status

### Service
- `commissionService.ts`:
  - `generateClosing(sellerId, period)` — calcula e insere fechamento
  - `getClosings(filters)` — lista com filtros
  - `updateClosingStatus(id, newStatus)` — com audit log
  - `getClosingHistory(sellerId)` — histórico

### UI
- Nova aba "Comissões" no `VendasDashboard`
- Tabela com vendedor, período, prevista vs realizada, status, ações
- Botões de aprovação/pagamento com confirmação
- Badges de status coloridos

## Bloco 2 — Painel gerencial por equipe

### Service
- `teamPerformanceService.ts`:
  - Agrupa sellers por empresa
  - Calcula concentração (% do top seller no total)
  - Top performers e vendedores em risco
  - Evolução mensal da equipe

### UI
- Nova aba "Equipe" no `VendasDashboard`
- Cards: total equipe, concentração, em risco, top performer
- Mini-ranking por modalidade
- No `/master/vendas`: comparativo entre empresas
- Sem alteração no `/ceo`

## Checklist
- [ ] Migration commission_closings
- [ ] commissionService.ts
- [ ] teamPerformanceService.ts
- [ ] Aba Comissões no VendasDashboard
- [ ] Aba Equipe no VendasDashboard
- [ ] Audit integrado em aprovação/pagamento
- [ ] Filtros por empresa/vendedor/período
- [ ] TypeScript sem erros
- [ ] Funcional nas duas empresas
