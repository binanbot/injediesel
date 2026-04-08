
# Evolução Financeira Operacional — Lançamentos + Categorias

## Proposta Técnica

A tabela `financial_entries` já existe com: `entry_type`, `category`, `scope`, `franchise_profile_id`, `order_id`, `amount`, `competency_date`, `description`. Porém faltam dimensões analíticas essenciais.

### Estratégia: Evoluir `financial_entries` (não criar tabela nova)

Adicionar colunas à tabela existente para suportar os novos requisitos sem quebrar o que já funciona.

### Migração — Novas colunas em `financial_entries`

| Coluna | Tipo | Propósito |
|--------|------|-----------|
| `company_id` | UUID FK → companies | Company scope direto (hoje depende de franchise_profile_id) |
| `unit_id` | UUID FK → units | Vínculo com unidade |
| `employee_profile_id` | UUID FK → employee_profiles | Despesa vinculada a colaborador |
| `seller_profile_id` | UUID FK → seller_profiles | Despesa vinculada a vendedor |
| `subcategory` | TEXT | Subcategoria (ex: "combustível", "uniforme") |
| `cost_center` | TEXT | Centro de custo livre |
| `is_recurring` | BOOLEAN | Fixo vs variável |
| `reference_month` | DATE | Mês de referência (complementa competency_date) |
| `created_by` | UUID | Quem lançou |

### Categorias padronizadas

**entry_type** (já existe): `receita`, `despesa`, `ajuste`

**category** (evoluir): `pessoal_fixo`, `pessoal_variavel`, `comercial`, `logistica`, `frota`, `infraestrutura`, `administrativo`, `marketing`, `suporte`, `financeiro`, `operacional`, `receita_manual`, `receita_pedido`, `receita_arquivo`

**subcategory** (novo): texto livre para detalhar (salário, VT, VA, combustível, etc.)

### RLS

- Manter policies existentes
- Adicionar policy para company scope via `company_id`

### Telas

1. **Nova página `/admin/financeiro`** — Listagem + filtros + resumo
2. **Dialog de lançamento** — Formulário completo com todas as dimensões
3. **Link na sidebar** — Item "Financeiro" no AdminSidebar

### Service

- `financialService.ts` — CRUD + agregações + filtros

### Plano de Execução

| Bloco | Entregável |
|-------|-----------|
| 1 | Migração: novas colunas + RLS atualizada |
| 2 | financialService.ts |
| 3 | Página /admin/financeiro + dialog de lançamento |
| 4 | Link na sidebar |
