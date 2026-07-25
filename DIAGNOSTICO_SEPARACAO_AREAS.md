# Diagnostico de Separacao de Areas

Branch de trabalho: `fix/separacao-publico-participante-admin`

## Estrutura atual

Framework identificado: Next.js App Router, TypeScript estrito, Tailwind CSS 4, Supabase SSR/client, Mercado Pago, Zod e Vitest.

Rotas existentes antes da reorganizacao:

- Publicas: `/`, `/campanhas`, `/campanhas/[slug]`, `/ganhadores`, `/login`, `/cadastro`, `/recuperar-senha`, `/termos`, `/privacidade`, `/regulamento/[slug]`.
- Participante: `/conta`, `/conta/compras`, `/conta/numeros`, `/conta/premiacoes`, `/pagamento/[orderId]`.
- Admin: `/admin`, `/admin/campanhas`, `/admin/campanhas/nova`, `/admin/campanhas/[id]`, `/admin/participantes`, `/admin/pedidos`, `/admin/pagamentos`, `/admin/numeros`, `/admin/numeros-premiados`, `/admin/premiacoes`, `/admin/rankings`, `/admin/ganhadores`, `/admin/configuracoes`, `/admin/auditoria`.
- APIs: `/api/orders`, `/api/orders/[orderId]`, `/api/webhooks/mercadopago`, `/api/admin/campaigns`, `/api/admin/numbers`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/pending-purchase`.

Banco/integracoes:

- Migration principal: `supabase/migrations/20260725160000_initial_schema.sql`.
- RLS existe para perfis, campanhas, pedidos, pagamentos, alocacoes, premios, rankings, notificacoes, links sociais e auditoria.
- Mercado Pago esta isolado em `src/lib/mercadopago.ts`.
- Supabase service role esta isolado em `src/lib/supabase.ts`.

## Problemas encontrados

1. Componentes de areas diferentes estavam todos em `src/components`:
   - `admin.tsx`
   - `account.tsx`
   - `campaign.tsx`
   - `payment.tsx`
   - `quantity-selector.tsx`
   - `shell.tsx`
   - `logo.tsx`

2. A conta do participante reutilizava `PublicShell`, ou seja, o menu de visitante tambem aparecia na area autenticada.

3. A pagina de pagamento reutilizava `PublicShell`, mesmo fazendo parte do fluxo autenticado do participante.

4. A rota `/login` tambem atendia retorno administrativo por query string. Embora protegida no servidor, isso misturava experiencia publica e administrativa no mesmo visual.

5. A pasta de rotas nao usava route groups do App Router. A separacao visual existia parcialmente por URLs, mas nao por layouts fisicamente separados como `(public)`, `(account)` e `/admin`.

6. O admin importava componentes de campanha publica em `/admin/rankings`, misturando visual publico com painel interno.

7. O arquivo `src/components/admin.tsx` era grande e concentrava sidebar, dashboard, tabelas, rows e auditoria.

8. O rodape publico citava "auditoria e painel administrativo" em texto institucional, o que nao e controle direto, mas reforca informacao interna para visitante e sera suavizado.

9. Faltava regra de lint para bloquear imports de `components/admin` fora de rotas admin.

10. Faltava `/admin/login`, rota exigida pela tarefa. O painel redirecionava para `/login?returnTo=/admin`.

11. Faltava `/conta/perfil`.

12. Capturas antes da correcao apontaram rolagem horizontal inesperada em mobile:
    - `/` em 390 px: `scrollWidth=427`, `clientWidth=390`.
    - `/campanhas/setup-gamer-dos-sonhos` em 390 px: `scrollWidth=427`, `clientWidth=390`.

## Rotas misturadas

- `/conta`, `/conta/compras`, `/conta/numeros` e `/conta/premiacoes` usavam `PublicShell`.
- `/pagamento/[orderId]` usava `PublicShell`.
- `/admin/rankings` usava componentes de campanha publica (`DailyBuyerRanking`, `CampaignTopTen`, `DailyNumberExtremes`).
- `/login` tambem exibia estado textual de login administrativo.

## Componentes reutilizados incorretamente

- `PublicShell` usado em area de participante e pagamento.
- `CampaignTopTen`, `DailyBuyerRanking`, `DailyNumberExtremes` usados no admin.
- Componentes `admin`, `account`, `campaign`, `payment`, `quantity-selector`, `shell` estavam no mesmo nivel, sem barreira estrutural.

## Falhas de autorizacao

Protecao server-side ja existia parcialmente:

- `/admin/layout.tsx` chama `requireAdmin()`.
- `/conta/layout.tsx` chama `requireUser()`.
- APIs `/api/admin/*` chamam `requireAdmin()`.
- `/api/orders/*` chamam `requireUser()`.

Falhas/ajustes necessarios:

- Criar `/admin/login` proprio para separar experiencia administrativa da publica.
- Garantir que a area publica nao tenha botao/link administrativo.
- Garantir que participante comum nao consiga entrar em `/admin` mesmo se tiver sessao.
- Adicionar testes para rejeicoes de visitante/participante e para APIs administrativas.

## Dados administrativos expostos

Nao foram encontrados imports diretos de `AdminShell` em paginas publicas. Ainda assim, havia:

- Texto publico citando painel/auditoria.
- Login publico assumindo contexto administrativo por query string.
- Componentes publicos reutilizados no admin, confundindo fronteira visual.

## Resultado tecnico antes das mudancas

- `npm run lint`: passou.
- `npm test`: passou, 19 testes.
- `npm run build`: passou.
- Console em dev: apenas mensagens de React DevTools/HMR.
- Screenshots antes da correcao salvos em `work/screens-before`.

## Plano de correcao

1. Criar route groups do App Router:
   - `src/app/(public)`
   - `src/app/(account)`
   - manter `src/app/admin` separado.

2. Separar componentes:
   - `src/components/public`
   - `src/components/account`
   - `src/components/admin`
   - `src/components/shared`

3. Criar layouts separados:
   - `app/(public)/layout.tsx`
   - `app/(account)/layout.tsx`
   - `app/admin/layout.tsx`

4. Criar `/admin/login`.

5. Criar `/conta/perfil`.

6. Remover `PublicShell` de paginas de participante e pagamento.

7. Substituir componentes publicos usados no admin por equivalentes administrativos.

8. Adicionar regras ESLint `no-restricted-imports` para impedir:
   - admin fora de `src/app/admin` e `src/components/admin`.
   - account dentro de public/admin.

9. Adicionar testes de separacao de areas, guards e compra pendente.

10. Corrigir rolagem horizontal mobile.

11. Validar lint, testes, TypeScript/build e capturas em 360, 390, 768, 1024 e desktop.

## Arquivos que serao alterados

- `src/app/*` para mover paginas publicas e de conta para route groups.
- `src/components/*` para separar por area.
- `src/app/admin/*` para usar apenas componentes admin.
- `src/app/login/page.tsx` e nova `src/app/admin/login/page.tsx`.
- `src/app/api/auth/login/route.ts` para separar retorno admin/publico com seguranca.
- `eslint.config.mjs` para regras de fronteira.
- `AGENTS.md` para regras permanentes.
- Testes em `src/lib` ou nova pasta de testes.
- `README.md` para documentar rotas e permissoes finais.
