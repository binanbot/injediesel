## Proposta Técnica

### Problema
O campo `sales_channel_mode` (text: counter/phone/both) não suporta os canais reais (whatsapp, telefone, balcão) e não diferencia canal permitido do colaborador vs canal real da venda.

### Solução

**BLOCO 1 — Migração de canais**
- Adicionar `allowed_sales_channels text[] DEFAULT '{whatsapp,telefone,balcao}'` em `seller_profiles`
- Adicionar `sale_channel text` em `orders` e `received_files` (canal real da venda)
- Manter `sales_channel_mode` temporariamente para compatibilidade, migrar dados existentes

**BLOCO 2 — Serviços e regras operacionais**
- `employeeService.ts`: filtrar por `allowed_sales_channels` no `fetchActiveSellers`
- `salesRankingService.ts`: suportar filtro por canal real (`sale_channel`)
- `commissionService.ts`: já respeita `commission_enabled` — sem mudança
- `teamPerformanceService.ts`: já respeita `target_enabled` — sem mudança
- `orderService.ts`: receber e gravar `sale_channel`

**BLOCO 3 — Formulário e UI**
- `ColaboradorFormDialog`: trocar select único por checkboxes de canais permitidos
- `VendasDashboard`: adicionar filtro por canal real (whatsapp/telefone/balcão)
- Seletores de vendedor: filtrar por canais permitidos
- Checkout/pedido: campo de canal real da venda

**BLOCO 4 — Auditoria**
- Registrar mudanças em `allowed_sales_channels` no evento `seller.commercial_access_changed`

### Regras de negócio
1. Colaborador sem `is_active` no seller_profile → não aparece em seletores
2. `can_sell_services = false` → excluído de vendas ECU
3. `commission_enabled = false` → excluído de fechamentos
4. `target_enabled = false` → excluído de rankings de atingimento
5. `allowed_sales_channels` → filtra quais vendedores podem atuar em cada canal
6. `sale_channel` → registra canal real por venda para relatórios

### Checklist
- [ ] Migration: allowed_sales_channels + sale_channel
- [ ] employeeService: filtro por canal
- [ ] salesRankingService: filtro por sale_channel
- [ ] orderService: gravar sale_channel
- [ ] ColaboradorFormDialog: checkboxes de canais
- [ ] VendasDashboard: filtros por canal real
- [ ] Auditoria integrada
- [ ] TypeScript sem erros
