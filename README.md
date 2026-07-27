# CotaRush — Campanhas Premiadas

Aplicacao Next.js App Router para campanhas premiadas com area publica, area do participante, painel administrativo, Supabase, Pix via Mercado Pago, webhooks, auditoria, RLS e testes de regras criticas.

## Arquitetura

- `src/app`: frontend Next.js com rotas publicas, participante e admin.
- `src/app/api`: camada de compatibilidade/proxy para o frontend web.
- `apps/backend`: backend HTTP separado para auth, pedidos, admin, webhooks e integracao Supabase/Mercado Pago.
- `src/components`: componentes reutilizaveis como `CampaignCard`, `QuantitySelector`, `PixPaymentCard`, `MyNumbersGrid`, `AdminSidebar/DataTable` e blocos de ranking.
- `src/lib`: regras de dominio, formatacao brasileira, validacoes Zod, clientes Supabase/Mercado Pago e motor testavel de alocacao.
- `supabase/migrations`: schema PostgreSQL completo, RLS, indices, seeds e funcoes transacionais.

O navegador nunca define valor final, status financeiro, premio ou numero distribuido. O backend recalcula o pedido usando o preco salvo na campanha, cria o Pix e aguarda o webhook oficial. A alocacao acontece depois do pagamento aprovado, dentro da funcao transacional `allocate_order_numbers`.

## Estrategia de numeros

O sistema nao cria previamente 1.000.000 de registros por campanha. Cada numero distribuido vira uma linha em `number_allocations`, com restricao unica `(campaign_id, number)`. Numeros premiados desativados ou ja encontrados ficam reservados fora da distribuicao. A funcao transacional tenta candidatos aleatorios, ignora duplicados/reservados e usa a restricao unica do banco como protecao final contra concorrencia.

Riscos tratados:

- Concorrencia: `orders` e `campaigns` sao bloqueados com `for update`; duplicidade e impedida por indice unico.
- Pagamentos: webhooks sao salvos em `payment_events` com idempotencia por `(provider, provider_event_id)`.
- Seguranca: RLS protege dados proprios de participantes e libera gestao apenas para admins.
- Privacidade: a area publica mostra apenas premios encontrados; estados internos de premios ficam no admin.
- Estornos: estados `charged_back` e `refunded` existem para invalidacao operacional das cotas.

## Variaveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
BACKEND_API_URL=http://localhost:4000
BACKEND_PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=
MERCADO_PAGO_WEBHOOK_URL=http://localhost:3000/api/webhooks/mercadopago
```

Chaves privadas ficam somente no backend. Nunca use `SUPABASE_SERVICE_ROLE_KEY` ou `MERCADO_PAGO_ACCESS_TOKEN` no frontend.

Para producao na Vercel, use o nome de projeto `cotarush` e configure o dominio:

```bash
NEXT_PUBLIC_APP_URL=https://cotarush.vercel.app
FRONTEND_ORIGIN=https://cotarush.vercel.app
MERCADO_PAGO_WEBHOOK_URL=https://cotarush.vercel.app/api/webhooks/mercadopago
```

## Supabase

1. Crie um projeto Supabase.
2. Execute a migration `supabase/migrations/20260725160000_initial_schema.sql`.
3. Ative confirmacao de e-mail em Authentication.
4. Configure Storage para imagens de campanhas e comprovantes, se for usar uploads reais.
5. Crie o primeiro administrador:

```sql
insert into public.profiles (id, full_name, public_name, email, phone)
values ('USER_UUID_DO_AUTH', 'Administrador', 'Admin', 'admin@example.com', '11999999999');

insert into public.user_roles (user_id, role)
values ('USER_UUID_DO_AUTH', 'super_admin');
```

Admins devem ativar 2FA no provedor de autenticacao quando disponivel.

## Mercado Pago

1. Crie uma aplicacao no Mercado Pago.
2. Gere o access token de producao ou sandbox.
3. Configure o webhook para `https://seu-dominio.com/api/webhooks/mercadopago`.
4. Preencha `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET` e `MERCADO_PAGO_WEBHOOK_URL`.
5. Teste eventos repetidos: a tabela `payment_events` deve retornar duplicado sem alocar numeros novamente.

## Executar localmente

```bash
npm install
npm run dev:backend
npm run dev:frontend
```

Se `BACKEND_API_URL` nao estiver configurado, o frontend usa as rotas internas de compatibilidade. Quando estiver configurado, chamadas de negocio como cadastro, pedidos, admin e webhooks podem ser encaminhadas ao backend separado.

Sem Supabase configurado, o app usa um fallback local seguro: visitante nao acessa `/admin` nem `/conta` sem sessao. Para testar o painel ADM localmente, use:

- E-mail: `adm@cotarush.local`
- Senha: `CotaRush@2026`

Troque `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env.local` antes de demonstrar para terceiros. Com Supabase e Mercado Pago configurados, as APIs passam a usar os servicos reais e o papel ADM vem de `user_roles`.

## Validacao

```bash
npm run lint
npm test
npm run build
```

Os testes cobrem formatacao de seis digitos, calculo de valores, limite de quantidade, idempotencia de webhook, distribuicao sem duplicidade, concorrencia simulada, premios ativos/desativados, menor/maior do dia, reinicio diario, rankings, cotas extras, permissoes administrativas, RLS e estorno.

## Publicacao

Pode publicar em Vercel, Netlify com suporte a Next.js ou infraestrutura Node compativel:

1. Configure as variaveis de ambiente no provedor.
2. Aponte o dominio publico.
3. Atualize `MERCADO_PAGO_WEBHOOK_URL`.
4. Rode as migrations antes de abrir campanhas reais.
5. Cadastre responsavel, documento, regulamento, criterios e autorizacao aplicavel antes de publicar uma campanha.

## Dependencias externas pendentes

Para operar dinheiro real, ainda dependem de contas e credenciais externas:

- Projeto Supabase com Auth, PostgreSQL e Storage.
- Aplicacao Mercado Pago com Pix e webhook habilitados.
- Revisao juridica/compliance para autorizacao, regulamento, idade, localidade e politica de cancelamento.
