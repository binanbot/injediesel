
## ✅ Bloco 1 — PermissionGuard em páginas críticas (concluído)

Aplicado `<PermissionGuard>` em:
- **Produtos** (`catalogo.export`, `catalogo.create`)
- **Pedidos** (`pedidos.export`)
- **Colaboradores** (`usuarios.create`, `usuarios.edit`, `usuarios.manage`)
- **Clientes** (`clientes.export`, `clientes.create`)
- **Suporte** (`suporte.manage` para alterar status)

## ✅ Bloco 2 — Página /admin/permissoes (concluído)

- Listagem de perfis com contagem de permissões
- Cargos vinculados exibidos
- Colaboradores vinculados exibidos (via posição + overrides)
- Badge de override com tooltip
- Clonagem de perfil
- Matriz módulo×ação expandível com checkboxes
- Toggle "Todos" por módulo

## ✅ Bloco 3 — Painel comercial (concluído)

- KPIs: faturamento, pedidos, arquivos ECU, vendedores, ticket médio, comissão
- Ranking por faturamento, volume, ticket médio
- Aba de Metas com progresso (atingida/saudável/em risco/crítica)
- Aba de Descontos com análise vs política comercial
- Filtro por modalidade (ECU/Peças/Misto)
- Filtro por tipo de venda (consolidado/ECU/peças)
- Alertas visuais para desconto acima da política
- Funcional em /admin/vendas e /master/vendas

## Próximos passos sugeridos
1. Aplicar PermissionGuard em Relatórios (exportações)
2. Audit trail para alterações de perfis de permissão
3. Painel do vendedor individual (visão própria de desempenho)
