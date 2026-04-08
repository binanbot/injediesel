
## Bloco 1 — PermissionGuard em páginas críticas

Aplicar `<PermissionGuard>` em botões/ações sensíveis nas páginas:
- **Produtos** (`/admin/produtos`): criar, editar, excluir → módulo `catalogo`
- **Pedidos** (`/admin/compras-franqueados`): aprovar, editar status → módulo `pedidos`
- **Relatórios** (`/admin/relatorios`): exportar → módulo `relatorios`
- **Suporte** (`/admin/suporte`): gerenciar tickets → módulo `suporte`

Arquivos a editar: ~4-5 páginas admin existentes.

## Bloco 2 — Página /admin/permissoes

Criar página de gestão de perfis de permissão:
- Listagem de perfis da empresa (cards ou tabela)
- Visualização da matriz módulo×ação (checkbox grid)
- Edição inline dos perfis
- Clonagem de perfil
- Indicação de quais cargos usam cada perfil
- Rota nova: `/admin/permissoes` (já existe no sidebar?)

Arquivos novos:
- `src/pages/admin/Permissoes.tsx`
- Reutilizar `permissionService.ts` existente

## Bloco 3 — Painel comercial (metas + ranking)

Criar dashboard de vendas com:
- Página `/admin/vendas` — ranking de vendedores, metas, comissão
- Página `/master/vendas` — visão consolidada cross-company
- Reutilizar `salesRankingService.ts` existente
- Componentes: tabela de ranking, barra de progresso de meta, filtros

Arquivos novos:
- `src/pages/admin/VendasDashboard.tsx` (pode já existir)
- `src/pages/master/VendasDashboard.tsx` ou similar

## Ordem de implementação
1. Bloco 1 (PermissionGuard) — menor risco, maior impacto de segurança
2. Bloco 2 (Permissões UI) — depende apenas do service existente
3. Bloco 3 (Painel comercial) — mais complexo, usa services existentes
