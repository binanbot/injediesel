
# Playbook Comercial Estruturado

## Análise
- CRM já possui ACTIVITY_TYPES, OPPORTUNITY_STAGES, CHANNELS em crmService.ts
- crm_activities e crm_opportunities já têm campos de texto flexíveis (activity_type, stage, channel, summary)
- companies.settings.crm_config já suporta configuração por empresa
- Nenhuma migração necessária: os campos existentes (stage, activity_type, summary, notes, lost_reason) já cobrem os dados do playbook
- Enriquecimento via constantes tipadas + UI + configuração JSONB

## Plano por Blocos

### Bloco 1 — Novo service: crmPlaybookService.ts
Criar `src/services/crmPlaybookService.ts`:
- Constantes padronizadas: LOSS_REASONS, REACTIVATION_REASONS, CONTACT_RESULTS, OPPORTUNITY_TEMPERATURES, CONTACT_ORIGINS
- Etapas comerciais expandidas com metadata (SLA por etapa, transições permitidas)
- Helpers: getStageLabel, getTemperatureColor, isTransitionAllowed, getStageMetrics
- Integração com getCrmConfig para config por empresa (etapas habilitadas, motivos customizados)

### Bloco 2 — Expandir crmService.ts
- Adicionar CONTACT_RESULTS ao ACTIVITY_TYPES ou como campo separado
- Adicionar temperatura às oportunidades (via stage metadata, sem novo campo DB)

### Bloco 3 — UI: Enriquecer formulários do CRM
- ActivityDialog: adicionar campo "resultado do contato" e "origem"
- OpportunityDialog: adicionar campo "temperatura" e "motivo de perda" padronizado
- ReactivationTab: adicionar motivo de reativação/não interesse

### Bloco 4 — UI: Nova sub-aba "Playbook" na tab Inteligência
- Visualização das etapas comerciais como pipeline
- Tempo médio por etapa
- Oportunidades paradas por etapa
- Configuração visual das regras por empresa

### Bloco 5 — Segurança
- Sem nova tabela = sem nova superfície RLS
- Dados fluem pelos campos existentes com RLS já aplicado
- Verificar scan de segurança

## Implementação
1. crmPlaybookService.ts (constantes + helpers + config)
2. Atualizar crmService.ts (contact results)
3. Atualizar ActivityDialog e OpportunityDialog no Crm.tsx
4. Adicionar seção Playbook na tab Inteligência
5. Security check
