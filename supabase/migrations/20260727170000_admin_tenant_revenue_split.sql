create table public.admin_invite_codes (
  code text primary key check (code ~ '^[A-Z][0-9]{3}$'),
  admin_id uuid not null unique references public.profiles(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_payment_accounts (
  admin_id uuid primary key references public.profiles(id) on delete cascade,
  provider text not null default 'mercado_pago',
  account_reference text not null,
  label text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column owner_admin_id uuid references public.profiles(id),
  add column admin_code text references public.admin_invite_codes(code);

alter table public.campaigns
  add column owner_admin_id uuid references public.profiles(id);

alter table public.orders
  add column owner_admin_id uuid references public.profiles(id),
  add column platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  add column admin_net_cents integer not null default 0 check (admin_net_cents >= 0);

alter table public.payments
  add column platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  add column admin_net_cents integer not null default 0 check (admin_net_cents >= 0);

create table public.order_revenue_splits (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  owner_admin_id uuid not null references public.profiles(id),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  admin_net_cents integer not null check (admin_net_cents >= 0),
  status public.payment_status not null default 'pending',
  provider_transfer_id text,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  check (platform_fee_cents + admin_net_cents > 0)
);

insert into public.admin_invite_codes (code, admin_id)
select 'A001', p.id
from public.profiles p
join public.user_roles r on r.user_id = p.id
where r.role in ('admin', 'super_admin')
order by p.created_at
limit 1
on conflict do nothing;

update public.profiles p
set admin_code = c.code
from public.admin_invite_codes c
where c.admin_id = p.id and p.admin_code is null;

update public.profiles p
set owner_admin_id = c.admin_id,
    admin_code = c.code
from public.admin_invite_codes c
where p.owner_admin_id is null
  and exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'participant');

update public.campaigns c
set owner_admin_id = a.admin_id
from public.admin_invite_codes a
where c.owner_admin_id is null;

update public.orders o
set owner_admin_id = c.owner_admin_id,
    platform_fee_cents = floor(o.total_cents / 2.0)::integer,
    admin_net_cents = o.total_cents - floor(o.total_cents / 2.0)::integer
from public.campaigns c
where o.campaign_id = c.id and o.owner_admin_id is null;

update public.payments p
set platform_fee_cents = o.platform_fee_cents,
    admin_net_cents = o.admin_net_cents
from public.orders o
where p.order_id = o.id;

insert into public.order_revenue_splits (order_id, owner_admin_id, platform_fee_cents, admin_net_cents, status)
select id, owner_admin_id, platform_fee_cents, admin_net_cents, status
from public.orders
where owner_admin_id is not null
on conflict (order_id) do nothing;

alter table public.campaigns
  alter column owner_admin_id set not null;

alter table public.orders
  alter column owner_admin_id set not null,
  add constraint orders_revenue_split_total
  check (platform_fee_cents + admin_net_cents = total_cents);

alter table public.payments
  add constraint payments_revenue_split_total
  check (platform_fee_cents + admin_net_cents = amount_cents);

alter table public.profiles
  add constraint participant_admin_code_required
  check (
    owner_admin_id is null
    or admin_code is not null
  );

create index profiles_owner_admin_idx on public.profiles (owner_admin_id);
create index campaigns_owner_admin_idx on public.campaigns (owner_admin_id, status);
create index orders_owner_admin_idx on public.orders (owner_admin_id, created_at desc);
create index revenue_splits_owner_admin_idx on public.order_revenue_splits (owner_admin_id, created_at desc);

alter table public.admin_invite_codes enable row level security;
alter table public.admin_payment_accounts enable row level security;
alter table public.order_revenue_splits enable row level security;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.can_manage_admin_scope(target_admin_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_admin_id = auth.uid() or public.is_super_admin();
$$;

drop policy if exists "profiles own read" on public.profiles;
drop policy if exists "admins manage campaigns" on public.campaigns;
drop policy if exists "orders own read" on public.orders;
drop policy if exists "orders own insert" on public.orders;
drop policy if exists "admins manage orders" on public.orders;
drop policy if exists "payments own read" on public.payments;
drop policy if exists "admins manage payments" on public.payments;
drop policy if exists "admins manage profiles" on public.profiles;
drop policy if exists "allocations own read" on public.number_allocations;
drop policy if exists "admins manage allocations" on public.number_allocations;
drop policy if exists "public found instant prizes only" on public.instant_prizes;
drop policy if exists "admins manage instant prizes" on public.instant_prizes;
drop policy if exists "awards own read" on public.prize_awards;
drop policy if exists "admins manage awards" on public.prize_awards;

create policy "profiles scoped read"
on public.profiles for select
using (id = auth.uid() or public.can_manage_admin_scope(owner_admin_id) or public.can_manage_admin_scope(id));

create policy "admins manage scoped profiles"
on public.profiles for all
using (id = auth.uid() or public.can_manage_admin_scope(owner_admin_id) or public.can_manage_admin_scope(id))
with check (id = auth.uid() or public.can_manage_admin_scope(owner_admin_id) or public.can_manage_admin_scope(id));

create policy "admins manage scoped campaigns"
on public.campaigns for all
using (public.can_manage_admin_scope(owner_admin_id))
with check (public.can_manage_admin_scope(owner_admin_id));

create policy "orders own or scoped read"
on public.orders for select
using (participant_id = auth.uid() or public.can_manage_admin_scope(owner_admin_id));

create policy "orders own scoped insert"
on public.orders for insert
with check (participant_id = auth.uid());

create policy "admins manage scoped orders"
on public.orders for all
using (public.can_manage_admin_scope(owner_admin_id))
with check (public.can_manage_admin_scope(owner_admin_id));

create policy "payments own or scoped read"
on public.payments for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.participant_id = auth.uid() or public.can_manage_admin_scope(o.owner_admin_id))
  )
);

create policy "admins manage scoped payments"
on public.payments for all
using (exists (select 1 from public.orders o where o.id = order_id and public.can_manage_admin_scope(o.owner_admin_id)))
with check (exists (select 1 from public.orders o where o.id = order_id and public.can_manage_admin_scope(o.owner_admin_id)));

create policy "allocations own or scoped read"
on public.number_allocations for select
using (
  participant_id = auth.uid()
  or exists (
    select 1 from public.campaigns c
    where c.id = campaign_id and public.can_manage_admin_scope(c.owner_admin_id)
  )
);

create policy "admins manage scoped allocations"
on public.number_allocations for all
using (exists (select 1 from public.campaigns c where c.id = campaign_id and public.can_manage_admin_scope(c.owner_admin_id)))
with check (exists (select 1 from public.campaigns c where c.id = campaign_id and public.can_manage_admin_scope(c.owner_admin_id)));

create policy "public found scoped instant prizes"
on public.instant_prizes for select
using (
  found = true
  or exists (
    select 1 from public.campaigns c
    where c.id = campaign_id and public.can_manage_admin_scope(c.owner_admin_id)
  )
);

create policy "admins manage scoped instant prizes"
on public.instant_prizes for all
using (exists (select 1 from public.campaigns c where c.id = campaign_id and public.can_manage_admin_scope(c.owner_admin_id)))
with check (exists (select 1 from public.campaigns c where c.id = campaign_id and public.can_manage_admin_scope(c.owner_admin_id)));

create policy "awards own or scoped read"
on public.prize_awards for select
using (
  participant_id = auth.uid()
  or exists (
    select 1 from public.campaigns c
    where c.id = campaign_id and public.can_manage_admin_scope(c.owner_admin_id)
  )
);

create policy "admins manage scoped awards"
on public.prize_awards for all
using (exists (select 1 from public.campaigns c where c.id = campaign_id and public.can_manage_admin_scope(c.owner_admin_id)))
with check (exists (select 1 from public.campaigns c where c.id = campaign_id and public.can_manage_admin_scope(c.owner_admin_id)));

create policy "admin code owner read"
on public.admin_invite_codes for select
using (public.can_manage_admin_scope(admin_id));

create policy "admin code owner manage"
on public.admin_invite_codes for all
using (public.can_manage_admin_scope(admin_id))
with check (public.can_manage_admin_scope(admin_id));

create policy "payment account owner manage"
on public.admin_payment_accounts for all
using (public.can_manage_admin_scope(admin_id))
with check (public.can_manage_admin_scope(admin_id));

create policy "revenue splits owner read"
on public.order_revenue_splits for select
using (public.can_manage_admin_scope(owner_admin_id));

create policy "revenue splits owner manage"
on public.order_revenue_splits for all
using (public.can_manage_admin_scope(owner_admin_id))
with check (public.can_manage_admin_scope(owner_admin_id));
