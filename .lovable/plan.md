
# CRM + Custos + Rentabilidade — Fase 1: Base de Custos

## Proposta Técnica

### Modelagem Sugerida

**Tabela `employee_costs`** — custos recorrentes por colaborador/mês:
- `employee_profile_id` (FK → employee_profiles)
- `company_id` (FK → companies, company scope)
- `cost_type`: enum — `salario_base`, `comissao_estimada`, `vale_transporte`, `vale_alimentacao`, `ajuda_custo`, `bonus`, `encargos`, `outro`
- `cost_category`: enum — `pessoal_fixo`, `pessoal_variavel`
- `label`: texto livre para "outro"
- `amount_brl`: valor mensal
- `is_recurring`: boolean (fixo vs pontual)
- `effective_from` / `effective_until`: vigência
- `notes`

**Tabela `operational_costs`** — custos operacionais/infraestrutura por empresa:
- `company_id` (FK → companies)
- `cost_category`: `comercial`, `logistica`, `frota`, `infraestrutura`, `administrativo`, `marketing`, `suporte`, `financeiro`
- `description`: texto livre
- `amount_brl`
- `is_recurring`
- `competency_month`: date (mês de competência)
- `notes`

### Relação com `financial_entries`

- **Não duplicar**: `financial_entries` continua sendo o registro financeiro oficial (receitas + despesas contábeis)
- `employee_costs` e `operational_costs` são tabelas **gerenciais/analíticas** para calcular rentabilidade
- Futuramente, um service pode cruzar: `financial_entries` (receita) × `employee_costs + operational_costs` (custo) = margem
- Ambas respeitam `company_id` para isolamento multi-tenant

### Plano Incremental

| Bloco | Escopo | Entregável |
|-------|--------|------------|
| 1 | Migração: criar `employee_costs` + `operational_costs` com RLS | Tabelas + políticas |
| 2 | Service: `costService.ts` — CRUD de custos | Leitura/escrita |
| 3 | UI Admin: aba "Custos" no detalhe do colaborador | Formulário + listagem |
| 4 | UI Admin: página "Custos Operacionais" | Gestão de despesas por empresa |
| 5 | Service: `profitabilityService.ts` — cruzamento custo × receita | Resultado por colaborador |
| 6 | Dashboard: cards de rentabilidade em /admin, /master, /ceo | Visualização |

### Fase 1 (esta implementação)

Blocos 1 + 2 + 3: migração + service + UI base de custos por colaborador

### RLS

- `employee_costs`: company admins da mesma empresa + master/ceo
- `operational_costs`: company admins da mesma empresa + master/ceo
- Sellers podem ver seus próprios custos (somente leitura)

### Categorias de Custo

**Por colaborador (`cost_type`):**
- salario_base, comissao_estimada, vale_transporte, vale_alimentacao, ajuda_custo, bonus, encargos, outro

**Operacionais (`cost_category`):**
- comercial, logistica, frota, infraestrutura, administrativo, marketing, suporte, financeiro

### Checklist de Validação

- [ ] Tabelas criadas com company_id e RLS
- [ ] costService.ts com CRUD funcional
- [ ] UI de custos no colaborador
- [ ] Company scope respeitado
- [ ] Compatível com financial_entries
- [ ] TypeScript sem erros
- [ ] Funciona em Injediesel e PROMAX
