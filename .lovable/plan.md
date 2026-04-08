
## Bloco 1 — PermissionGuard nas páginas restantes

Aplicar `<PermissionGuard>` em ações sensíveis:
- **Relatórios** (`Relatorios.tsx`): exportar → `relatorios.export`
- **Suporte** (`Suporte.tsx`): gerenciar tickets → `suporte.manage`
- **Clientes** (`Clientes.tsx`): criar, editar, excluir → `clientes.create/edit/delete`
- **Financeiro**: exportar → `financeiro.export`

Arquivos: ~4 páginas admin existentes

## Bloco 2 — Evolução /admin/permissoes

Melhorar a página existente com:
- Listar colaboradores vinculados a cada perfil (query employee_profiles + seller_profiles)
- Listar cargos vinculados (query job_positions.default_permission_profile_id)
- Botão "Clonar perfil" (já parcialmente implementado)
- Suporte a override por usuário (employee_profiles.permission_profile_id)
- Exibir contagem de usuários por perfil

Arquivo: `src/pages/admin/Permissoes.tsx`

## Bloco 3 — Painel comercial aprofundado

Evoluir VendasDashboard com:
- Barra de progresso meta vs realizado por vendedor
- Comissão estimada calculada (já existe no service)
- Ranking filtrável por modalidade (ECU/Peças/Misto)
- Coluna de desconto médio concedido vs max_discount_pct
- Alerta visual quando desconto > política
- Manter visão /admin scoped e /master consolidada

Arquivos: `VendasDashboard.tsx`, `salesRankingService.ts`
