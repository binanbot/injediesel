
## Acesso Comercial — Proposta Técnica

### Modelagem

Evoluir `seller_profiles` com 4 novas colunas (em vez de criar tabela separada, já que seller_profile É a camada comercial):

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| `sales_channel_mode` | text | `'both'` | `counter`, `phone`, `both` |
| `can_sell_services` | boolean | `true` | Pode vender serviços ECU/mapa |
| `commission_enabled` | boolean | `true` | Tem direito a comissão |
| `target_enabled` | boolean | `true` | Participa de metas |

Campos já existentes que cobrem o resto:
- `is_active` → equivale a `sales_access_enabled`
- `can_sell_ecu` / `can_sell_parts` → tipos de produto
- `seller_mode` → modalidade
- `commission_type` / `commission_value` → comissão
- `max_discount_pct` → desconto
- `can_bill` → pode faturar

### Novo módulo de permissão: `vendas`

Adicionar `"vendas"` ao `PermissionModule` type com ações: view, create, manage, export.

### Ajustes no formulário (ColaboradorFormDialog)

Seção "Acesso Comercial" reorganizada:
1. Toggle "Habilitar vendas" (cria/ativa seller_profile)
2. Canal de venda (balcão / telefone / ambos)
3. Pode vender serviços / Pode vender produtos (ECU/Peças)
4. Participa de metas / Tem comissão
5. Configuração de comissão (condicional)
6. Desconto máximo

### Integração com painéis

- Ranking: filtrar por `is_active AND target_enabled`
- Metas: filtrar por `target_enabled = true`
- Comissão: filtrar por `commission_enabled = true`
- Filtros: adicionar canal de venda como filtro

### Auditoria

Registrar mudanças nas novas flags com `logAuditEvent`.

### Checklist
- [ ] Migration: 4 colunas em seller_profiles
- [ ] types/permissions.ts: módulo "vendas"
- [ ] ColaboradorFormDialog: seção Acesso Comercial
- [ ] VendasDashboard: filtros por flags
- [ ] commissionService: respeitar commission_enabled
- [ ] teamPerformanceService: respeitar target_enabled
- [ ] Auditoria integrada
- [ ] TypeScript sem erros
