## Venda Manual Assistida — Proposta Técnica

### Modelagem (Migration)

**Tabela `orders`** — 2 novas colunas:
- `customer_id uuid` (nullable, FK → customers)
- `operator_user_id uuid` (nullable) — quem lançou

Campos já existentes reutilizados:
- `seller_profile_id` → vendedor atribuído (comissão/meta/ranking)
- `sale_channel` → canal real (whatsapp/telefone/balcao) — já criado na migração anterior

**Permissão**: adicionar ação `assign_seller` ao módulo `vendas` no PermissionModule type.

### Página Nova
`/admin/vendas/nova` — Venda Manual Assistida

### Componentes
1. `ManualSaleForm.tsx` — formulário completo com blocos:
   - Cliente (busca + cadastro inline via NovoClienteDrawer existente)
   - Atribuição comercial (vendedor, canal, operador automático)
   - Itens (produtos do catálogo, qtd, preço, desconto)
   - Resumo comercial

### Services
- `manualSaleService.ts` — `createManualSale()` encapsula criação do pedido manual com operator_user_id, customer_id, sale_channel, auditoria
- Reutiliza `fetchActiveSellers` para filtrar vendedores elegíveis

### Regras de Negócio
1. `operator_user_id` = auth.uid() automático
2. `seller_profile_id` = vendedor selecionado (padrão: próprio)
3. Sem permissão `vendas.assign_seller` → só pode selecionar a si mesmo
4. Desconto limitado ao `max_discount_pct` do vendedor atribuído
5. Comissão, meta e ranking contam para `seller_profile_id`
6. Canal obrigatório
7. Auditoria registra operator + seller + canal

### Checklist
- [ ] Migration: customer_id e operator_user_id em orders
- [ ] PermissionAction: assign_seller
- [ ] manualSaleService.ts
- [ ] ManualSaleForm.tsx
- [ ] Rota /admin/vendas/nova
- [ ] Sidebar link
- [ ] Auditoria integrada
- [ ] TypeScript sem erros
