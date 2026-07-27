# CotaRush Backend

Servico HTTP separado do frontend.

## Rodar local

```bash
npm run dev:backend
```

Padrao: `http://localhost:4000`.

## Endpoints

- `GET /health`
- `POST /auth/signup`
- `POST /orders`
- `GET /orders/:orderId`
- `POST /admin/campaigns`
- `GET /admin/numbers`
- `PATCH /admin/instant-prizes`
- `POST /webhooks/mercadopago`

O frontend Next pode continuar usando `/api/*`. Quando `BACKEND_API_URL` estiver configurado, as rotas do Next podem encaminhar chamadas para este backend.
