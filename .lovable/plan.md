
# CRM Gerencial/Comercial — Estrutura Incremental

## Proposta Técnica

Construir sobre a base comercial existente (customers, seller_profiles, orders, received_files) sem duplicar dados, adicionando apenas as dimensões que faltam: atividades comerciais e funil de oportunidades.

---

## Modelagem Incremental

### Tabela 1: `crm_activities` — Registro de atividades comerciais

| Coluna | Tipo | Propósito |
|--------|------|-----------|
| `company_id` | UUID FK → companies | Isolamento multi-tenant |
| `customer_id` | UUID FK → customers | Cliente alvo |
| `seller_profile_id` | UUID FK → seller_profiles | Vendedor responsável |
| `activity_type` | TEXT | contato, followup, retorno, observacao, reativacao, negociacao, perda |
| `channel` | TEXT | whatsapp, telefone, balcao, email |
| `summary` | TEXT | Resumo da atividade |
| `scheduled_at` | TIMESTAMPTZ | Data agendada (follow-ups) |
| `completed_at` | TIMESTAMPTZ | Quando foi realizada |
| `status` | TEXT | pendente, realizada, atrasada, cancelada |
| `created_by` | UUID | Quem registrou |
| `opportunity_id` | UUID FK → crm_opportunities | Vínculo opcional com oportunidade |

### Tabela 2: `crm_opportunities` — Funil comercial simplificado

| Coluna | Tipo | Propósito |
|--------|------|-----------|
| `company_id` | UUID FK → companies | Isolamento multi-tenant |
| `customer_id` | UUID FK → customers | Cliente da oportunidade |
| `seller_profile_id` | UUID FK → seller_profiles | Vendedor responsável |
| `title` | TEXT | Descrição curta da oportunidade |
| `stage` | TEXT | lead, em_contato, proposta, negociacao, fechado_ganho, fechado_perdido |
| `estimated_value` | NUMERIC | Valor estimado da oportunidade |
| `sale_channel` | TEXT | Canal de origem |
| `order_id` | UUID FK → orders | Pedido vinculado (quando fechado) |
| `file_id` | UUID FK → received_files | Arquivo vinculado (quando fechado) |
| `lost_reason` | TEXT | Motivo da perda |
| `notes` | TEXT | Observações |
| `closed_at` | TIMESTAMPTZ | Data de fechamento |
| `created_by` | UUID | Quem criou |

---

## RLS

- Company admins: CRUD na própria empresa
- Master/CEO: acesso global
- Vendedores: CRUD apenas nos próprios registros (via seller_profile_id)

---

## Código

### Services
- `crmService.ts` — CRUD de atividades e oportunidades + queries analíticas (carteira inteligente, follow-ups atrasados, clientes sem recompra)

### Páginas
- `/admin/crm` — Painel CRM com abas: Carteira | Atividades | Funil | Desempenho
- Dialog de nova atividade
- Dialog de nova oportunidade

### Sidebar
- Item "CRM" no AdminSidebar

---

## Plano de Execução

| Bloco | Entregável |
|-------|-----------|
| 1 | Migração: crm_activities + crm_opportunities + RLS + índices |
| 2 | crmService.ts |
| 3 | Página /admin/crm (Carteira + Atividades + Funil) |
| 4 | Link na sidebar |
