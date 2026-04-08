
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
- Aba de Descontos com análise vs política comercial (`max_discount_pct`)
- Filtro por modalidade (ECU/Peças/Misto)
- Filtro por tipo de venda (consolidado/ECU/peças)
- Alertas visuais para desconto acima da política (com tooltip mostrando limite)
- Funcional em /admin/vendas e /master/vendas

## ✅ Bloco 4 — Auditoria e Compliance (concluído)

- Tabela `audit_logs` (append-only, sem UPDATE/DELETE)
- RLS: company admins veem própria empresa, master/ceo veem tudo
- Service `auditService.ts` com `logAuditEvent()` e `getAuditLogs()`
- Audit integrado em:
  - Criação/edição/clonagem de perfil de permissão
  - Criação de metas de vendas
- Página `/admin/auditoria` com filtros por módulo e busca
- Página `/master/auditoria` com visão consolidada
- Paginação e labels humanizados
- Sidebar atualizada em Admin e Master

## ✅ Bloco 5 — Metas comerciais formais (concluído)

- Formulário de criação de meta por vendedor no painel comercial
- Seleção de vendedor, tipo de venda e valor
- Período automático baseado no filtro ativo
- Comissão prevista (meta) vs comissão realizada
- Status: atingida / saudável / em risco / crítica
- Integrado com audit trail

## Próximos passos sugeridos
1. Integrar audit em mais pontos (colaboradores, vendedores, tickets)
2. Painel do vendedor individual (visão própria de desempenho)
3. Edição/exclusão de metas existentes
4. Relatório de auditoria exportável
