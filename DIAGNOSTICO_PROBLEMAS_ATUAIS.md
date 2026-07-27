# Diagnostico de Problemas Atuais - CotaRush

Data da auditoria: 2026-07-27  
Branch auditada: `fix/separacao-publico-participante-admin`  
Escopo: separacao entre publico, participante e administrador; rotas; autenticacao; pagamentos; numeros; rankings; banco; responsividade; build; testes; git.

## Resumo executivo

- Total de problemas registrados: 22.
- Criticos: 4.
- Altos: 8.
- Medios: 7.
- Baixos: 3.
- Corrigidos nesta fase: 5.
- Pendentes: 17.

O projeto ja tem separacao fisica real por route groups e layouts: publico em `src/app/(public)`, participante em `src/app/(account)` e admin em `src/app/admin`. A validacao visual em navegador nao encontrou menu administrativo, link `/admin`, texto "modo administrador", overflow horizontal ou imagens quebradas nas rotas publicas testadas em 360, 390, 768, 1024, 1366 e 1920 px.

Ainda existem lacunas importantes de seguranca e operacao: modo demo com papel por cookie, webhook aceitando falta de segredo, fluxo Pix sem transacao unica, ausencia de idempotencia no POST de pedido, paineis administrativos usando dados demo e varias telas admin com botoes que ainda nao persistem dados.

## Rotas existentes e classificacao

Publicas:

- `/`
- `/campanhas`
- `/campanhas/[slug]`
- `/ganhadores`
- `/login`
- `/cadastro`
- `/recuperar-senha`
- `/termos`
- `/privacidade`
- `/regulamento/[slug]`

Participante:

- `/conta`
- `/conta/compras`
- `/conta/numeros`
- `/conta/perfil`
- `/conta/premiacoes`
- `/pagamento/[orderId]`

Administrativas:

- `/admin`
- `/admin/login`
- `/admin/auditoria`
- `/admin/campanhas`
- `/admin/campanhas/[id]`
- `/admin/campanhas/nova`
- `/admin/configuracoes`
- `/admin/ganhadores`
- `/admin/numeros`
- `/admin/numeros-premiados`
- `/admin/pagamentos`
- `/admin/participantes`
- `/admin/pedidos`
- `/admin/premiacoes`
- `/admin/rankings`

API:

- `/api/admin/campaigns`
- `/api/admin/numbers`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/pending-purchase`
- `/api/orders`
- `/api/orders/[orderId]`
- `/api/webhooks/mercadopago`

Invalidas ou duplicadas:

- Nenhuma rota duplicada foi encontrada pelo build do Next.
- `/admin/rankings` concentra tres itens de menu diferentes ("Menor e maior do dia", "Ranking diario" e "Top 10") no mesmo destino. Nao e duplicidade tecnica, mas e uma inconsistencia de navegacao administrativa.

## Evidencias de execucao

- `npm.cmd install`: executado; instalacao concluiu, mas o npm reportou 9 vulnerabilidades altas em dependencias de desenvolvimento.
- `npm.cmd audit --omit=dev`: `found 0 vulnerabilities`.
- `npm.cmd audit`: falhou por vulnerabilidade alta em `brace-expansion <=5.0.7` via cadeia de ESLint; correcao sugerida exige `npm audit fix --force`.
- `npm.cmd run lint`: passou.
- `npx.cmd tsc --noEmit`: passou.
- `npm.cmd test`: passou com 3 arquivos e 30 testes.
- `npm.cmd run build`: passou; build listou 38 rotas App Router.
- Servidor local: `npm.cmd run dev` em `http://localhost:3000`.
- Browser: console sem warnings/erros nas rotas publicas testadas; sem overflow horizontal em `/`, `/campanhas/setup-gamer-dos-sonhos` e `/login` nos breakpoints pedidos.
- Capturas: `C:\Users\ADM\Documents\Codex\2026-07-25\cru\outputs\audit-public-390.png` e `C:\Users\ADM\Documents\Codex\2026-07-25\cru\outputs\audit-campaign-390.png`.

## Problemas encontrados

### 1. Participante demo via API conseguia ler pedido de outro participante

- Gravidade: critica.
- Descricao: no modo sem Supabase, `/api/orders/[orderId]` retornava `demoOrders` por ID sem validar o dono do pedido.
- Arquivo e linha: `src/app/api/orders/[orderId]/route.ts:14-15`.
- Rota afetada: `/api/orders/[orderId]`.
- Perfil afetado: participante.
- Risco causado: vazamento de pedido, quantidade, valor e status de outro participante no ambiente demo/local.
- Correcao recomendada: validar `participantId` contra o usuario atual antes de retornar pedido.
- Estado: corrigido.
- Evidencia: antes da correcao, `GET /api/orders/order-demo-2` com cookie de participante retornou `200`; depois da correcao retorna `404 {"error":"Pedido nao encontrado."}`.

### 2. Conta demo exibia pedidos de todos os participantes

- Gravidade: alta.
- Descricao: a pagina de pedidos do participante renderizava `demoOrders` inteiro.
- Arquivo e linha: `src/app/(account)/conta/compras/page.tsx:7`.
- Rota afetada: `/conta/compras`.
- Perfil afetado: participante.
- Risco causado: um participante via demo via compras de outro.
- Correcao recomendada: filtrar pedidos pelo `user.id` atual.
- Estado: corrigido.
- Evidencia: arquivo agora usa `demoOrders.filter((order) => order.participantId === user.id)`.

### 3. Conta demo exibia numeros de todos os participantes

- Gravidade: alta.
- Descricao: a pagina de numeros do participante renderizava `demoAllocations` inteiro.
- Arquivo e linha: `src/app/(account)/conta/numeros/page.tsx:7`.
- Rota afetada: `/conta/numeros`.
- Perfil afetado: participante.
- Risco causado: vazamento de numeros de outro participante.
- Correcao recomendada: filtrar alocacoes pelo `user.id` atual.
- Estado: corrigido.
- Evidencia: arquivo agora usa `demoAllocations.filter((allocation) => allocation.participantId === user.id)`.

### 4. Conta demo fixava perfil no primeiro usuario

- Gravidade: alta.
- Descricao: `/conta` e `/conta/perfil` usavam sempre `demoProfiles[0]`, ignorando o usuario autenticado.
- Arquivo e linha: `src/app/(account)/conta/page.tsx:7` e `src/app/(account)/conta/perfil/page.tsx:6`.
- Rota afetada: `/conta`, `/conta/perfil`.
- Perfil afetado: participante.
- Risco causado: perfil e dados pessoais incorretos se outro usuario demo estiver autenticado.
- Correcao recomendada: buscar o perfil por `user.id`.
- Estado: corrigido.
- Evidencia: as paginas agora usam `demoProfiles.find((item) => item.id === user.id)`.

### 5. Texto publico ainda citava area administrativa

- Gravidade: baixa.
- Descricao: a home publica citava "auditoria administrativa" em texto de marketing.
- Arquivo e linha: `src/app/(public)/page.tsx:25`.
- Rota afetada: `/`.
- Perfil afetado: visitante.
- Risco causado: confusao visual/conceitual entre area publica e operacao interna.
- Correcao recomendada: trocar por linguagem publica.
- Estado: corrigido.
- Evidencia: texto atual usa "conferencia segura".

### 6. Modo demo aceita papel de usuario via cookie

- Gravidade: critica.
- Descricao: sem Supabase configurado, o servidor confia no cookie `cotarush_demo_role` para decidir participante/admin.
- Arquivo e linha: `src/lib/auth.ts:14`.
- Rota afetada: `/admin`, `/conta`, APIs protegidas.
- Perfil afetado: visitante, participante e administrador.
- Risco causado: qualquer cliente que consiga enviar `cotarush_demo_role=admin` acessa o painel local/demo.
- Correcao recomendada: limitar o modo demo a desenvolvimento local, exigir segredo de demo ou remover autorizacao por cookie em ambientes compartilhados.
- Estado: pendente.
- Evidencia: `GET /admin` com cookie `cotarush_demo_role=admin` retornou `200`.

### 7. Senha administrativa demo possui fallback fixo

- Gravidade: critica.
- Descricao: quando nao ha Supabase, `ADMIN_PASSWORD` cai para `CotaRush@2026`.
- Arquivo e linha: `src/app/api/auth/login/route.ts:23`.
- Rota afetada: `/admin/login`.
- Perfil afetado: administrador.
- Risco causado: se o ambiente demo for exposto, existe uma credencial previsivel.
- Correcao recomendada: exigir `ADMIN_EMAIL` e `ADMIN_PASSWORD` definidos; falhar login admin se ausentes.
- Estado: pendente.
- Evidencia: README manda trocar `ADMIN_EMAIL` e `ADMIN_PASSWORD`, mas o codigo ainda tem fallback.

### 8. Webhook Mercado Pago aceita falta de segredo

- Gravidade: critica.
- Descricao: a verificacao de assinatura retorna `true` quando `MERCADO_PAGO_WEBHOOK_SECRET` esta ausente.
- Arquivo e linha: `src/lib/mercadopago.ts:58`.
- Rota afetada: `/api/webhooks/mercadopago`.
- Perfil afetado: administrador e financeiro.
- Risco causado: em ambiente mal configurado, eventos de pagamento podem ser aceitos sem prova de origem.
- Correcao recomendada: rejeitar webhook quando o segredo nao estiver configurado fora de desenvolvimento local.
- Estado: pendente.

### 9. Webhook nao grava erro de processamento

- Gravidade: alta.
- Descricao: `payment_events` tem coluna `error`, mas a rota nao envolve consulta ao Mercado Pago/RPC em bloco que atualize `error` se falhar.
- Arquivo e linha: `src/app/api/webhooks/mercadopago/route.ts:42-58`.
- Rota afetada: `/api/webhooks/mercadopago`.
- Perfil afetado: administrador.
- Risco causado: falha de webhook pode ficar invisivel para auditoria e suporte.
- Correcao recomendada: capturar excecoes, atualizar `payment_events.error` e responder de forma idempotente.
- Estado: pendente.

### 10. Pedido e pagamento Pix nao sao criados em transacao unica

- Gravidade: alta.
- Descricao: `/api/orders` insere pedido, chama Mercado Pago e depois insere pagamento em passos separados.
- Arquivo e linha: `src/app/api/orders/route.ts:48-82`.
- Rota afetada: `/api/orders`.
- Perfil afetado: participante e financeiro.
- Risco causado: pode existir pedido sem pagamento salvo, Pix criado sem registro consistente ou falha parcial.
- Correcao recomendada: usar transacao/RPC para criar pedido e pagamento ou estrategia compensatoria com estado de erro.
- Estado: pendente.

### 11. Criacao de pedido nao possui chave de idempotencia

- Gravidade: alta.
- Descricao: `pendingPurchaseToken` existe no schema mas nao e usado para impedir pedidos duplicados.
- Arquivo e linha: `src/lib/validations.ts:44` e `src/app/api/orders/route.ts:48-82`.
- Rota afetada: `/api/orders`, `/pagamento/[orderId]`.
- Perfil afetado: participante.
- Risco causado: duplo clique, retry do browser ou retomada repetida podem criar pedidos/Pix duplicados.
- Correcao recomendada: persistir token idempotente por participante/campanha/quantidade e retornar o pedido existente em retries.
- Estado: pendente.

### 12. POST de pedido nao verifica estoque restante antes do Pix

- Gravidade: alta.
- Descricao: a rota valida status ativo e limite por pedido, mas nao valida `confirmed_numbers + quantity <= total_numbers` antes de criar o Pix.
- Arquivo e linha: `src/app/api/orders/route.ts:36-45`.
- Rota afetada: `/api/orders`.
- Perfil afetado: participante e financeiro.
- Risco causado: campanha quase esgotada pode receber Pix para mais cotas do que o estoque disponivel.
- Correcao recomendada: bloquear no servidor com lock transacional ou reserva temporaria expirada.
- Estado: pendente.

### 13. Distribuicao SQL pode entrar em loop longo em campanha quase cheia

- Gravidade: alta.
- Descricao: `allocate_order_numbers` usa `while v_allocated < v_needed loop` sem limite de tentativas.
- Arquivo e linha: `supabase/migrations/20260725160000_initial_schema.sql:342`.
- Rota afetada: webhook/processamento de pagamento.
- Perfil afetado: participante, administrador e financeiro.
- Risco causado: pagamento aprovado pode travar processamento quando ha poucos numeros livres ou muitos numeros reservados.
- Correcao recomendada: impor limite de tentativas e fallback deterministico/consulta de numeros livres.
- Estado: pendente.

### 14. Reembolso/estorno nao invalida numeros alocados

- Gravidade: alta.
- Descricao: `process_payment_status` atualiza `orders` e `payments`, mas so chama alocacao em `approved`; nao ha rotina para invalidar numeros em `refunded` ou `charged_back`.
- Arquivo e linha: `supabase/migrations/20260725160000_initial_schema.sql:441-466`.
- Rota afetada: webhook/processamento de pagamento.
- Perfil afetado: participante, administrador e financeiro.
- Risco causado: cota estornada pode continuar valida em ranking, premio ou apuracao.
- Correcao recomendada: invalidar `number_allocations`, ajustar rankings e registrar auditoria ao receber estorno/reembolso.
- Estado: pendente.

### 15. Painel admin ainda usa dados demo em varias paginas

- Gravidade: alta.
- Descricao: dashboard, pedidos, pagamentos, participantes e numeros importam `demo*` diretamente.
- Arquivo e linha: `src/app/admin/(panel)/page.tsx:2`, `src/app/admin/(panel)/pedidos/page.tsx:2`, `src/app/admin/(panel)/pagamentos/page.tsx:2`, `src/app/admin/(panel)/participantes/page.tsx:2`, `src/app/admin/(panel)/numeros/page.tsx:2`.
- Rota afetada: `/admin`, `/admin/pedidos`, `/admin/pagamentos`, `/admin/participantes`, `/admin/numeros`.
- Perfil afetado: administrador.
- Risco causado: painel pode mostrar dados ficticios como se fossem operacionais.
- Correcao recomendada: trocar por queries server-side com service role controlado e estados vazios claros.
- Estado: pendente.

### 16. Botoes administrativos ainda nao executam acoes reais

- Gravidade: media.
- Descricao: paginas de nova campanha, edicao e configuracoes usam botoes `type="button"` sem submit/action.
- Arquivo e linha: `src/app/admin/(panel)/campanhas/nova/page.tsx:18`, `src/app/admin/(panel)/campanhas/[id]/page.tsx:19-25`, `src/app/admin/(panel)/configuracoes/page.tsx:18`.
- Rota afetada: `/admin/campanhas/nova`, `/admin/campanhas/[id]`, `/admin/configuracoes`.
- Perfil afetado: administrador.
- Risco causado: ADM acha que salvou, pausou ou encerrou algo, mas nada persiste.
- Correcao recomendada: implementar server actions/APIs com validacao, confirmacao e auditoria.
- Estado: pendente.

### 17. Confirmacao e auditoria administrativas sao apenas texto

- Gravidade: media.
- Descricao: `ConfirmActionDialog` e `AuditHistory` renderizam avisos/dados ficticios, nao confirmam nem registram acoes.
- Arquivo e linha: `src/components/admin/admin.tsx:203` e `src/components/admin/admin.tsx:211`.
- Rota afetada: `/admin/campanhas`, `/admin/campanhas/[id]`, `/admin/numeros-premiados`, `/admin/configuracoes`, `/admin/auditoria`.
- Perfil afetado: administrador.
- Risco causado: acoes sensiveis podem parecer auditadas sem estarem conectadas a logs reais.
- Correcao recomendada: modal real com motivo obrigatorio e insert em `audit_logs`.
- Estado: pendente.

### 18. Tabelas administrativas nao tem cabecalho, filtros ou paginacao

- Gravidade: media.
- Descricao: `AdminDataTable` renderiza somente `tbody` e recebe todas as linhas.
- Arquivo e linha: `src/components/admin/admin.tsx:141-152`.
- Rota afetada: rotas admin com tabelas.
- Perfil afetado: administrador.
- Risco causado: uso dificil em mobile/desktop e baixa auditabilidade operacional.
- Correcao recomendada: adicionar colunas nomeadas, filtros, busca, paginacao e estados vazios.
- Estado: pendente.

### 19. Configuracoes de campanha tem leitura publica ampla no RLS

- Gravidade: media.
- Descricao: `campaign_settings` e `campaign_rules` usam `for select using (true)`.
- Arquivo e linha: `supabase/migrations/20260725160000_initial_schema.sql:503-507`.
- Rota afetada: consultas publicas ao Supabase.
- Perfil afetado: visitante.
- Risco causado: configuracoes internas podem ficar publicas se a tabela carregar flags que deveriam ser administrativas.
- Correcao recomendada: separar campos publicos de campos internos ou criar view publica.
- Estado: pendente.

### 20. Rankings e extremos diarios sao publicos sem recorte

- Gravidade: media.
- Descricao: policies de `daily_buyer_rankings`, `campaign_rankings` e `daily_number_extremes` permitem leitura publica total.
- Arquivo e linha: `supabase/migrations/20260725160000_initial_schema.sql:525-527`.
- Rota afetada: consultas publicas ao Supabase.
- Perfil afetado: visitante.
- Risco causado: exposicao de historico completo se nao houver view/consulta limitada por campanha publicada.
- Correcao recomendada: expor apenas views publicas com nome publico, campanha publicada e limites 6/10.
- Estado: pendente.

### 21. Retomada de compra depende so de `sessionStorage`

- Gravidade: media.
- Descricao: quantidade/campanha ficam em `sessionStorage` e sao reenviadas para `/api/orders`.
- Arquivo e linha: `src/components/public/quantity-selector.tsx:27-40` e `src/components/account/resume-purchase.tsx:17-37`.
- Rota afetada: `/campanhas/[slug]`, `/login`, `/pagamento/retomar`.
- Perfil afetado: visitante e participante.
- Risco causado: fluxo perde compra em outro dispositivo/aba e nao tem token idempotente para retomar com seguranca.
- Correcao recomendada: criar compra pendente server-side com token curto e idempotente.
- Estado: pendente.

### 22. Vulnerabilidade alta em dependencias de desenvolvimento

- Gravidade: baixa.
- Descricao: `npm audit` completo encontrou `brace-expansion <=5.0.7` via cadeia de ESLint.
- Arquivo e linha: `package-lock.json` e cadeia `eslint-config-next`.
- Rota afetada: nenhuma rota runtime.
- Perfil afetado: desenvolvedor/CI.
- Risco causado: DoS teorico em ferramenta de desenvolvimento; nao aparece em `npm audit --omit=dev`.
- Correcao recomendada: avaliar upgrade de ESLint/Next lint chain em fase separada, pois `npm audit fix --force` sugere breaking change.
- Estado: pendente.

## Testes manuais pedidos

- Visitante em `/conta`: redirect `307` para `/login?returnTo=/conta`.
- Visitante em `/admin`: redirect `307` para `/admin/login?error=admin`.
- Participante em `/admin`: redirect `307` para `/admin/login?error=admin`.
- Participante chamando API administrativa: `/api/admin/numbers` retornou `403 {"error":"ADMIN_REQUIRED"}`.
- Participante tentando consultar pedido de outra pessoa: antes retornava `200`; corrigido para `404`.
- Participante tentando alterar campanha: `/api/admin/campaigns` com cookie participante retornou `403`.
- Usuario bloqueado tentando comprar: pendente; nao ha fluxo de bloqueio conectado a `/api/orders`.
- Sessao expirada: pendente; fallback demo usa cookie de 8 horas e nao ha teste de expiracao controlada.
- Logout: `/api/auth/logout` limpa cookie demo com `maxAge: 0`.
- Login administrativo: `/admin/login` existe e `/admin` com cookie admin retorna `200` no modo demo.

## Dez problemas mais graves

1. Webhook aceita falta de segredo.
2. Modo demo aceita papel por cookie.
3. Senha admin demo com fallback fixo.
4. POST de pedido sem estoque transacional.
5. Pedido/Pix sem transacao unica.
6. Criacao de pedido sem idempotencia.
7. Distribuicao SQL com loop sem limite.
8. Estorno/reembolso sem invalidar numeros.
9. Painel admin usando dados demo como operacao.
10. Vazamento demo de pedido de outro participante, corrigido nesta fase.

## Arquivos mais problematicos

- `src/app/api/orders/route.ts`: pedido/Pix sem transacao, sem idempotencia e sem reserva de estoque.
- `src/lib/auth.ts`: fallback demo por cookie de papel.
- `src/app/api/auth/login/route.ts`: fallback fixo de senha admin demo.
- `src/lib/mercadopago.ts`: webhook sem segredo aceito.
- `src/app/api/webhooks/mercadopago/route.ts`: processamento sem gravar erro.
- `supabase/migrations/20260725160000_initial_schema.sql`: funcoes financeiras/numericas e RLS publico amplo.
- `src/components/admin/admin.tsx`: tabela admin generica, dialog/auditoria apenas textuais.
- `src/app/admin/(panel)/*`: varias paginas usam `demo*` diretamente.

## Rotas mais problematicas

- `/api/webhooks/mercadopago`: risco financeiro e de integridade.
- `/api/orders`: risco de duplicidade, estoque e consistencia Pix.
- `/admin/*`: experiencia protegida, mas ainda dependente de dados demo e controles sem persistencia.
- `/conta/*`: vazamento demo corrigido; precisa substituir dados demo por consulta real.
- `/pagamento/[orderId]`: precisa expirar Pix visualmente e bloquear alteracao/duplicidade de pedido.

## Falhas por categoria

Seguranca:

- Cookie demo define papel.
- Fallback fixo de senha admin demo.
- Webhook aceita falta de segredo.
- RLS publico amplo para settings/rankings.
- Pendencia de expiracao e bloqueio de usuario.

Financeiro:

- Pedido/Pix sem transacao unica.
- Falta idempotencia de pedido.
- Falta validacao de estoque/reserva antes do Pix.
- Reembolso/estorno nao invalida cotas.
- Erro de webhook nao fica registrado.

Banco:

- Loop SQL de alocacao sem limite.
- Policies publicas amplas para rankings/settings.
- Falta rotina transacional para reserva/expiracao.
- Falta rotina de recomputo/invalida ranking em estorno.

Experiencia do usuario:

- Admin tem botoes sem acao real.
- Tabelas admin sem filtros/paginacao/cabecalhos.
- Retomada de compra fica presa ao `sessionStorage`.
- Painel mostra dados demo, nao estado operacional real.

## O que ja foi corrigido nesta fase

- `/api/orders/[orderId]` demo passou a validar dono do pedido.
- `/conta/compras` filtra pedidos por `user.id`.
- `/conta/numeros` filtra cotas por `user.id`.
- `/conta/premiacoes` filtra premios por `user.id`.
- `/conta` e `/conta/perfil` buscam perfil por `user.id`.
- Home publica removeu termo interno "auditoria administrativa".
- Teste de concorrencia com varias compras simultaneas foi adicionado em `src/lib/rush-engine.test.ts:57`.
- Teste de filtro demo do participante foi adicionado em `src/lib/separation.test.ts:80`.

## O que ainda falta

- Remover ou endurecer modo demo de admin por cookie.
- Exigir segredo de webhook fora de desenvolvimento.
- Implementar idempotencia real em `/api/orders`.
- Criar reserva/estoque transacional antes do Pix.
- Tratar reembolso/estorno com invalidacao de numeros e recomputo de ranking.
- Trocar dados demo do admin por consultas reais.
- Conectar formularios admin a server actions/APIs com auditoria.
- Revisar RLS publica para settings/rankings usando views publicas.
- Criar teste de concorrencia de banco real, nao apenas unitario.
- Avaliar upgrade da cadeia ESLint afetada pelo audit de dev.

## Proxima fase recomendada

Fase 2 deve focar no nucleo financeiro e de seguranca: `/api/orders`, webhook Mercado Pago e funcoes SQL de alocacao/estorno. A ordem recomendada e:

1. Endurecer auth demo e webhook.
2. Criar token idempotente de pedido.
3. Implementar reserva transacional de cotas antes do Pix.
4. Adicionar invalidacao de cotas em estorno/reembolso.
5. Substituir paineis admin demo por consultas reais com filtros, paginacao e auditoria.
