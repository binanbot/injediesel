
## Bloco 1 — Auditoria e Compliance

### Modelagem
- Tabela `audit_logs` com: `id`, `company_id`, `user_id`, `action` (enum text), `module`, `target_type`, `target_id`, `details` (jsonb), `created_at`
- RLS: company admins veem da própria empresa, master/ceo veem tudo
- Sem UPDATE/DELETE (append-only)

### Ações rastreadas
- `permission_profile.updated` / `permission_profile.cloned`
- `employee.created` / `employee.updated` / `employee.deactivated`
- `seller.activated` / `seller.deactivated` / `seller.commission_changed` / `seller.mode_changed`
- `permission_override.set` / `permission_override.removed`
- `ticket.status_changed`
- `discount_policy.violated`

### Frontend
- Service `auditService.ts` com `logAuditEvent()` e `getAuditLogs()`
- Página `/admin/auditoria` com tabela filtrada por período, módulo, usuário e ação
- Rota também em `/master/auditoria` com visão consolidada

## Bloco 2 — Metas comerciais formais

### Modelagem
- Tabela `sales_targets` já existe com `seller_profile_id`, `company_id`, `sale_type`, `metric_key`, `target_value`, `period_start`, `period_end`, `is_active`
- Já é suficiente para metas por vendedor e por modalidade — não precisa de nova tabela

### Frontend
- Evoluir `salesRankingService.ts` para cruzar targets com realizado por modalidade
- Aba "Metas" no VendasDashboard já existe — evoluir com:
  - Progresso por modalidade (ECU/Peças/Total)
  - Status: Atingida (≥100%), Saudável (≥70%), Em risco (≥40%), Crítica (<40%)
  - Comissão prevista (meta) vs comissão realizada
  - Alertas para vendedor abaixo da meta
- Formulário de criação/edição de meta por vendedor no painel

## Plano incremental
1. Migration: criar `audit_logs`
2. Service + inserções de auditoria nos pontos críticos
3. Página de auditoria admin/master
4. Evolução das metas no VendasDashboard
5. Formulário de gestão de metas

## Checklist
- [ ] audit_logs criada com RLS
- [ ] logAuditEvent() chamado em permissões, colaboradores, vendedores
- [ ] Página /admin/auditoria funcional
- [ ] Metas por modalidade no VendasDashboard
- [ ] Formulário de meta por vendedor
- [ ] TypeScript sem erros
- [ ] Funciona em Injediesel e PROMAX
