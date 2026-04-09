
# Rentabilidade Operacional — Visão por Colaborador, Equipe e Empresa

## Modelo de Cálculo

### Por Colaborador (seller/employee)
| Métrica | Fonte | Fórmula |
|---------|-------|---------|
| Faturamento | orders.total_amount + received_files.valor_brl | Σ onde seller_profile_id = X |
| Comissão | commission_closings.realized_commission | Σ onde seller_profile_id = X |
| Custo Fixo | employee_costs (is_recurring=true) | Σ amount_brl |
| Custo Variável | employee_costs (is_recurring=false) | Σ amount_brl |
| Custo Total | Fixo + Variável + Comissão | — |
| Margem | Faturamento - Custo Total | — |
| ROI | (Faturamento / Custo Total) × 100 | — |

### Por Equipe (department)
Agregação dos colaboradores do departamento.

### Por Empresa
| Métrica | Fonte |
|---------|-------|
| Faturamento | orders + received_files (via unit_id → company_id) |
| Custo Pessoal | Σ employee_costs por company_id |
| Custo Operacional | Σ operational_costs por company_id |
| Despesas | financial_entries (entry_type=despesa) por company_id |
| Receitas Extra | financial_entries (entry_type=receita) por company_id |
| Margem Operacional | Faturamento + Receitas Extra - Custo Pessoal - Custo Op - Despesas |

---

## Implementação

### 1. Service: `profitabilityService.ts`
- `fetchSellerProfitability(companyId, period)` — por vendedor
- `fetchDepartmentProfitability(companyId, period)` — por departamento
- `fetchCompanyProfitability(period)` — comparativo entre empresas
- Todas as queries usam dados existentes (sem migração)

### 2. Página `/master/rentabilidade`
- Ranking de rentabilidade por colaborador
- Ranking de custo por equipe/departamento
- Comparativo entre empresas (cards lado a lado)
- Alertas: alto custo + baixa geração

### 3. Página `/ceo/rentabilidade`
- KPIs executivos: Custo Pessoal, Custo Operacional, Margem Operacional
- Comparativo Injediesel vs PROMAX (cards)
- Eficiência Comercial (faturamento por R$ de custo)
- Alertas executivos (margem < 20%, custo crescendo > receita)

### 4. Sidebar + Rotas
- MasterSidebar: "Rentabilidade" 
- CeoSidebar: "Rentabilidade"
- ChannelRouter: rotas lazy

---

## Sem Migração
Todos os dados já existem nas tabelas atuais. O service faz agregação client-side.
