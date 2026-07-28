alter table public.order_revenue_splits
  add column if not exists admin_payment_account_id uuid references public.admin_payment_accounts(admin_id),
  add column if not exists split_rule_version text not null default 'platform_split_50_50_v1',
  add column if not exists platform_fee_bps integer not null default 5000,
  add column if not exists admin_net_bps integer not null default 5000;

alter table public.order_revenue_splits
  add constraint order_revenue_splits_fixed_50_50_bps
  check (platform_fee_bps = 5000 and admin_net_bps = 5000)
  not valid;

alter table public.order_revenue_splits
  add constraint order_revenue_splits_exact_half
  check (
    platform_fee_cents = floor((platform_fee_cents + admin_net_cents) / 2.0)::integer
    and admin_net_cents = (platform_fee_cents + admin_net_cents) - floor((platform_fee_cents + admin_net_cents) / 2.0)::integer
  )
  not valid;

alter table public.orders
  add constraint orders_revenue_split_exact_half
  check (
    platform_fee_cents = floor(total_cents / 2.0)::integer
    and admin_net_cents = total_cents - floor(total_cents / 2.0)::integer
  )
  not valid;

alter table public.payments
  add constraint payments_revenue_split_exact_half
  check (
    platform_fee_cents = floor(amount_cents / 2.0)::integer
    and admin_net_cents = amount_cents - floor(amount_cents / 2.0)::integer
  )
  not valid;

create table if not exists public.payment_split_instructions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete cascade,
  owner_admin_id uuid not null references public.profiles(id),
  admin_payment_account_id uuid not null references public.admin_payment_accounts(admin_id),
  split_rule_version text not null default 'platform_split_50_50_v1',
  platform_fee_bps integer not null default 5000 check (platform_fee_bps = 5000),
  admin_net_bps integer not null default 5000 check (admin_net_bps = 5000),
  gross_amount_cents integer not null check (gross_amount_cents > 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  admin_net_cents integer not null check (admin_net_cents >= 0),
  provider text not null default 'mercado_pago',
  platform_destination_reference text not null default 'platform_owner',
  admin_destination_reference text not null,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'ready_to_split', 'split_sent', 'split_confirmed', 'failed', 'cancelled')),
  provider_payment_id text,
  provider_split_id text,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (platform_fee_cents + admin_net_cents = gross_amount_cents),
  check (
    platform_fee_cents = floor(gross_amount_cents / 2.0)::integer
    and admin_net_cents = gross_amount_cents - floor(gross_amount_cents / 2.0)::integer
  )
);

insert into public.payment_split_instructions (
  order_id,
  owner_admin_id,
  admin_payment_account_id,
  split_rule_version,
  platform_fee_bps,
  admin_net_bps,
  gross_amount_cents,
  platform_fee_cents,
  admin_net_cents,
  provider,
  admin_destination_reference,
  status
)
select
  o.id,
  o.owner_admin_id,
  apa.admin_id,
  'platform_split_50_50_v1',
  5000,
  5000,
  o.total_cents,
  floor(o.total_cents / 2.0)::integer,
  o.total_cents - floor(o.total_cents / 2.0)::integer,
  apa.provider,
  apa.account_reference,
  case when o.status = 'approved' then 'ready_to_split' else 'pending_payment' end
from public.orders o
join public.admin_payment_accounts apa on apa.admin_id = o.owner_admin_id and apa.active = true
where o.total_cents > 0
on conflict (order_id) do nothing;

create index if not exists payment_split_instructions_owner_admin_idx
on public.payment_split_instructions (owner_admin_id, created_at desc);

create index if not exists payment_split_instructions_status_idx
on public.payment_split_instructions (status, created_at desc);

alter table public.payment_split_instructions enable row level security;

drop policy if exists "revenue splits owner manage" on public.order_revenue_splits;
drop policy if exists "payment split instructions owner manage" on public.payment_split_instructions;

create policy "payment split instructions owner read"
on public.payment_split_instructions for select
using (public.can_manage_admin_scope(owner_admin_id));

create or replace function public.process_payment_status(
  p_order_id uuid,
  p_provider_payment_id text,
  p_status text,
  p_raw_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.payments
    set provider_payment_id = p_provider_payment_id,
        status = p_status::public.payment_status,
        raw_payload = p_raw_payload,
        paid_at = case when p_status = 'approved' then now() else paid_at end
    where order_id = p_order_id;

  update public.orders
    set status = p_status::public.payment_status,
        approved_at = case when p_status = 'approved' then coalesce(approved_at, now()) else approved_at end
    where id = p_order_id;

  update public.order_revenue_splits
    set provider_transfer_id = coalesce(provider_transfer_id, p_provider_payment_id),
        status = p_status::public.payment_status,
        settled_at = case when p_status = 'approved' then settled_at else null end
    where order_id = p_order_id;

  update public.payment_split_instructions
    set provider_payment_id = p_provider_payment_id,
        status = case
          when p_status = 'approved' then 'ready_to_split'
          when p_status = 'refunded' then 'cancelled'
          else 'pending_payment'
        end,
        updated_at = now()
    where order_id = p_order_id;

  if p_status = 'approved' then
    perform public.allocate_order_numbers(p_order_id);
  end if;
end;
$$;
