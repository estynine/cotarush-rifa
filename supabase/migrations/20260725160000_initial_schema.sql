create extension if not exists "pgcrypto";

create type public.app_role as enum ('participant', 'admin', 'super_admin');
create type public.campaign_status as enum ('draft', 'scheduled', 'active', 'paused', 'sold_out', 'awaiting_draw', 'drawn', 'finished', 'cancelled');
create type public.payment_status as enum ('pending', 'approved', 'in_review', 'expired', 'cancelled', 'charged_back', 'refunded');
create type public.prize_type as enum ('money', 'product', 'extra_numbers', 'credit', 'other');
create type public.prize_award_status as enum ('pending', 'validating', 'validated', 'awaiting_payment', 'paid', 'delivered', 'refused', 'cancelled');
create type public.allocation_source as enum ('purchase', 'prize_grant');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  public_name text not null,
  email text not null,
  phone text not null,
  blocked boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'participant',
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  title text not null,
  subtitle text not null,
  short_description text not null,
  full_description text not null,
  main_image text,
  prize_type public.prize_type not null,
  estimated_value_cents integer not null check (estimated_value_cents >= 0),
  price_per_number_cents integer not null check (price_per_number_cents > 0),
  total_numbers integer not null check (total_numbers between 1 and 1000000),
  max_numbers_per_order integer not null default 10000 check (max_numbers_per_order between 1 and 10000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  draw_at timestamptz not null,
  regulation text not null,
  status public.campaign_status not null default 'draft',
  confirmed_numbers integer not null default 0 check (confirmed_numbers >= 0),
  responsible_name text not null,
  responsible_document text not null,
  authorization_number text,
  cancellation_policy text,
  participation_criteria text,
  draw_criteria text,
  age_restriction text,
  geographic_limits text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (confirmed_numbers <= total_numbers),
  check (starts_at < ends_at),
  check (ends_at <= draw_at)
);

create table public.campaign_media (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  url text not null,
  alt text,
  position integer not null default 0
);

create table public.campaign_settings (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  ranking_daily_enabled boolean not null default true,
  ranking_top_ten_enabled boolean not null default true,
  daily_lowest_enabled boolean not null default true,
  daily_highest_enabled boolean not null default true,
  daily_lowest_value_cents integer not null default 0,
  daily_highest_value_cents integer not null default 0,
  daily_prize_type public.prize_type not null default 'money',
  count_extra_numbers_daily boolean not null default false,
  count_extra_numbers_top_ten boolean not null default false,
  show_name_mode text not null default 'public_name' check (show_name_mode in ('full_name', 'public_name', 'masked'))
);

create table public.campaign_rules (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  rules text not null,
  publication_checklist jsonb not null default '{}'::jsonb
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  readable_code text not null unique,
  campaign_id uuid not null references public.campaigns(id),
  participant_id uuid not null references public.profiles(id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents > 0),
  total_cents integer not null check (total_cents > 0),
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  processed_at timestamptz,
  check (total_cents = quantity * unit_price_cents)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'mercado_pago',
  provider_payment_id text,
  status public.payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents > 0),
  pix_copy_paste text,
  pix_qr_code_base64 text,
  expires_at timestamptz,
  paid_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  raw_payload jsonb not null,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table public.instant_prizes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  number integer not null check (number between 0 and 999999),
  title text not null,
  prize_type public.prize_type not null,
  value_cents integer check (value_cents is null or value_cents >= 0),
  extra_numbers integer check (extra_numbers is null or extra_numbers > 0),
  description text not null,
  image_url text,
  active boolean not null default false,
  found boolean not null default false,
  found_by_participant_id uuid references public.profiles(id),
  found_order_id uuid references public.orders(id),
  activated_at timestamptz,
  found_at timestamptz,
  delivery_status public.prize_award_status not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, number),
  check ((found = false and found_by_participant_id is null and found_order_id is null and found_at is null) or found = true)
);

create table public.number_allocations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  participant_id uuid not null references public.profiles(id),
  order_id uuid references public.orders(id),
  number integer not null check (number between 0 and 999999),
  source public.allocation_source not null default 'purchase',
  awarded boolean not null default false,
  allocation_date timestamptz not null default now(),
  status text not null default 'valid' check (status in ('valid', 'invalidated')),
  unique (campaign_id, number)
);

create table public.prize_awards (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.profiles(id),
  campaign_id uuid not null references public.campaigns(id),
  category text not null check (category in ('main_draw', 'instant', 'daily_lowest', 'daily_highest', 'extra')),
  number integer check (number is null or number between 0 and 999999),
  value_cents integer,
  description text not null,
  validation_code text not null unique,
  status public.prize_award_status not null default 'pending',
  payment_method text,
  paid_at timestamptz,
  paid_by uuid references public.profiles(id),
  payment_note text,
  proof_url text,
  admin_notes text,
  created_at timestamptz not null default now()
);

create table public.promotional_grants (
  id uuid primary key default gen_random_uuid(),
  award_id uuid references public.prize_awards(id),
  campaign_id uuid not null references public.campaigns(id),
  participant_id uuid not null references public.profiles(id),
  quantity integer not null check (quantity > 0),
  count_daily_ranking boolean not null default false,
  count_top_ten boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.daily_number_extremes (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  date_key date not null,
  lowest_number integer,
  lowest_participant_id uuid references public.profiles(id),
  lowest_order_id uuid references public.orders(id),
  highest_number integer,
  highest_participant_id uuid references public.profiles(id),
  highest_order_id uuid references public.orders(id),
  closed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (campaign_id, date_key)
);

create table public.daily_buyer_rankings (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  date_key date not null,
  participant_id uuid not null references public.profiles(id),
  quantity integer not null default 0,
  last_purchase_at timestamptz,
  primary key (campaign_id, date_key, participant_id)
);

create table public.campaign_rankings (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  participant_id uuid not null references public.profiles(id),
  quantity integer not null default 0,
  last_purchase_at timestamptz,
  primary key (campaign_id, participant_id)
);

create table public.draw_results (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id),
  final_number integer not null check (final_number between 0 and 999999),
  draw_source text not null,
  drawn_at timestamptz not null,
  verification_code text not null unique,
  winner_participant_id uuid references public.profiles(id),
  related_order_id uuid references public.orders(id),
  delivery_status public.prize_award_status not null default 'pending',
  published_at timestamptz
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.profiles(id),
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'global',
  campaign_id uuid references public.campaigns(id) on delete cascade,
  whatsapp_group text,
  whatsapp_support text,
  instagram text,
  tiktok text,
  youtube text,
  updated_at timestamptz not null default now()
);

create table public.support_settings (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  whatsapp_support text not null,
  help_text text,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  reason text,
  ip inet,
  created_at timestamptz not null default now()
);

create index campaigns_status_idx on public.campaigns (status, starts_at, ends_at);
create index orders_participant_idx on public.orders (participant_id, created_at desc);
create index orders_campaign_status_idx on public.orders (campaign_id, status, approved_at desc);
create index payments_order_idx on public.payments (order_id, status);
create index allocations_participant_idx on public.number_allocations (participant_id, campaign_id, allocation_date desc);
create index allocations_order_idx on public.number_allocations (order_id);
create index instant_prizes_campaign_active_idx on public.instant_prizes (campaign_id, active, found);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id, created_at desc);

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and (role = required_role or role = 'super_admin')
  );
$$;

create or replace function public.current_sp_date(ts timestamptz)
returns date
language sql
stable
as $$
  select (ts at time zone 'America/Sao_Paulo')::date;
$$;

create or replace function public.allocate_order_numbers(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_campaign public.campaigns%rowtype;
  v_needed integer;
  v_candidate integer;
  v_allocated integer := 0;
  v_today date;
  v_prize public.instant_prizes%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.status <> 'approved' then raise exception 'order_not_approved'; end if;
  if v_order.processed_at is not null then return; end if;

  select * into v_campaign from public.campaigns where id = v_order.campaign_id for update;
  v_needed := v_order.quantity;
  v_today := public.current_sp_date(coalesce(v_order.approved_at, now()));

  while v_allocated < v_needed loop
    v_candidate := floor(random() * v_campaign.total_numbers)::integer;

    begin
      if exists (
        select 1 from public.instant_prizes
        where campaign_id = v_campaign.id and number = v_candidate and (active = false or found = true)
      ) then
        continue;
      end if;

      insert into public.number_allocations (campaign_id, participant_id, order_id, number, source, allocation_date)
      values (v_campaign.id, v_order.participant_id, v_order.id, v_candidate, 'purchase', coalesce(v_order.approved_at, now()));
      v_allocated := v_allocated + 1;
    exception when unique_violation then
      continue;
    end;
  end loop;

  for v_prize in
    select * from public.instant_prizes
    where campaign_id = v_campaign.id and active = true and found = false
      and exists (
        select 1 from public.number_allocations
        where campaign_id = v_campaign.id and order_id = v_order.id and number = instant_prizes.number
      )
    for update
  loop
    update public.instant_prizes
      set found = true,
          found_by_participant_id = v_order.participant_id,
          found_order_id = v_order.id,
          found_at = now(),
          delivery_status = 'pending'
      where id = v_prize.id;

    update public.number_allocations
      set awarded = true
      where campaign_id = v_campaign.id and order_id = v_order.id and number = v_prize.number;

    insert into public.prize_awards (
      participant_id, campaign_id, category, number, value_cents, description, validation_code, status
    ) values (
      v_order.participant_id,
      v_campaign.id,
      'instant',
      v_prize.number,
      v_prize.value_cents,
      v_prize.title,
      'CR-' || upper(substr(gen_random_uuid()::text, 1, 8)),
      'pending'
    );

    insert into public.notifications (participant_id, title, body)
    values (v_order.participant_id, 'Parabens! Voce encontrou um numero premiado.', v_prize.title);
  end loop;

  update public.campaigns
    set confirmed_numbers = confirmed_numbers + v_order.quantity,
        status = case when confirmed_numbers + v_order.quantity >= total_numbers then 'sold_out' else status end
    where id = v_campaign.id;

  insert into public.daily_buyer_rankings (campaign_id, date_key, participant_id, quantity, last_purchase_at)
  values (v_campaign.id, v_today, v_order.participant_id, v_order.quantity, v_order.approved_at)
  on conflict (campaign_id, date_key, participant_id)
  do update set quantity = daily_buyer_rankings.quantity + excluded.quantity,
                last_purchase_at = excluded.last_purchase_at;

  insert into public.campaign_rankings (campaign_id, participant_id, quantity, last_purchase_at)
  values (v_campaign.id, v_order.participant_id, v_order.quantity, v_order.approved_at)
  on conflict (campaign_id, participant_id)
  do update set quantity = campaign_rankings.quantity + excluded.quantity,
                last_purchase_at = excluded.last_purchase_at;

  insert into public.daily_number_extremes (
    campaign_id, date_key, lowest_number, lowest_participant_id, lowest_order_id,
    highest_number, highest_participant_id, highest_order_id
  )
  select
    v_campaign.id,
    v_today,
    min(number), v_order.participant_id, v_order.id,
    max(number), v_order.participant_id, v_order.id
  from public.number_allocations
  where order_id = v_order.id
  on conflict (campaign_id, date_key)
  do update set
    lowest_number = least(daily_number_extremes.lowest_number, excluded.lowest_number),
    lowest_participant_id = case when excluded.lowest_number < daily_number_extremes.lowest_number then excluded.lowest_participant_id else daily_number_extremes.lowest_participant_id end,
    lowest_order_id = case when excluded.lowest_number < daily_number_extremes.lowest_number then excluded.lowest_order_id else daily_number_extremes.lowest_order_id end,
    highest_number = greatest(daily_number_extremes.highest_number, excluded.highest_number),
    highest_participant_id = case when excluded.highest_number > daily_number_extremes.highest_number then excluded.highest_participant_id else daily_number_extremes.highest_participant_id end,
    highest_order_id = case when excluded.highest_number > daily_number_extremes.highest_number then excluded.highest_order_id else daily_number_extremes.highest_order_id end,
    updated_at = now();

  update public.orders set processed_at = now() where id = v_order.id;
end;
$$;

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

  if p_status = 'approved' then
    perform public.allocate_order_numbers(p_order_id);
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_media enable row level security;
alter table public.campaign_settings enable row level security;
alter table public.campaign_rules enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.number_allocations enable row level security;
alter table public.instant_prizes enable row level security;
alter table public.prize_awards enable row level security;
alter table public.promotional_grants enable row level security;
alter table public.daily_number_extremes enable row level security;
alter table public.daily_buyer_rankings enable row level security;
alter table public.campaign_rankings enable row level security;
alter table public.draw_results enable row level security;
alter table public.notifications enable row level security;
alter table public.social_links enable row level security;
alter table public.support_settings enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles own read" on public.profiles for select using (id = auth.uid() or public.has_role('admin'));
create policy "profiles own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "admins manage profiles" on public.profiles for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "public active campaigns" on public.campaigns for select using (status in ('active', 'sold_out', 'awaiting_draw', 'drawn', 'finished') or public.has_role('admin'));
create policy "admins manage campaigns" on public.campaigns for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "public campaign media" on public.campaign_media for select using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.status in ('active', 'sold_out', 'awaiting_draw', 'drawn', 'finished')));
create policy "admins manage campaign media" on public.campaign_media for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "public campaign settings read" on public.campaign_settings for select using (true);
create policy "admins manage campaign settings" on public.campaign_settings for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "public campaign rules read" on public.campaign_rules for select using (true);
create policy "admins manage campaign rules" on public.campaign_rules for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "orders own read" on public.orders for select using (participant_id = auth.uid() or public.has_role('admin'));
create policy "orders own insert" on public.orders for insert with check (participant_id = auth.uid());
create policy "admins manage orders" on public.orders for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "payments own read" on public.payments for select using (exists (select 1 from public.orders o where o.id = order_id and (o.participant_id = auth.uid() or public.has_role('admin'))));
create policy "admins manage payments" on public.payments for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "allocations own read" on public.number_allocations for select using (participant_id = auth.uid() or public.has_role('admin'));
create policy "admins manage allocations" on public.number_allocations for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "public found instant prizes only" on public.instant_prizes for select using (found = true or public.has_role('admin'));
create policy "admins manage instant prizes" on public.instant_prizes for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "awards own read" on public.prize_awards for select using (participant_id = auth.uid() or public.has_role('admin'));
create policy "admins manage awards" on public.prize_awards for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "rankings public read" on public.daily_buyer_rankings for select using (true);
create policy "campaign rankings public read" on public.campaign_rankings for select using (true);
create policy "daily extremes public read" on public.daily_number_extremes for select using (true);
create policy "draw results public read" on public.draw_results for select using (published_at is not null or public.has_role('admin'));
create policy "notifications own read" on public.notifications for select using (participant_id = auth.uid() or public.has_role('admin'));
create policy "social public read" on public.social_links for select using (true);
create policy "support public read" on public.support_settings for select using (true);
create policy "admins read audit logs" on public.audit_logs for select using (public.has_role('admin'));
create policy "admins insert audit logs" on public.audit_logs for insert with check (public.has_role('admin'));

insert into public.campaigns (
  id, name, slug, title, subtitle, short_description, full_description, prize_type,
  estimated_value_cents, price_per_number_cents, total_numbers, max_numbers_per_order,
  starts_at, ends_at, draw_at, regulation, status, confirmed_numbers,
  responsible_name, responsible_document, authorization_number, cancellation_policy,
  participation_criteria, draw_criteria, age_restriction, geographic_limits
) values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Setup Gamer dos Sonhos',
  'setup-gamer-dos-sonhos',
  'Setup Gamer dos Sonhos',
  'PC Gamer Completo',
  'Campanha premiada com PC gamer completo.',
  'Escolha suas cotas, pague por Pix e receba seus numeros apos confirmacao oficial.',
  'product',
  850000,
  10,
  1000000,
  10000,
  '2026-07-25 00:00:00-03',
  '2026-08-24 23:59:59-03',
  '2026-08-25 21:00:00-03',
  'Resultado definido pela fonte de apuracao registrada no painel.',
  'active',
  0,
  'CotaRush Demonstracao',
  '00.000.000/0001-00',
  'DEMO-2026',
  'Cancelamentos seguem regras do regulamento.',
  'Participantes maiores de idade conforme regras locais.',
  'Fonte de apuracao registrada e auditada.',
  '18+',
  'Brasil'
);

insert into public.campaign_settings (
  campaign_id, daily_lowest_value_cents, daily_highest_value_cents
) values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  5000,
  10000
);

insert into public.instant_prizes (campaign_id, number, title, prize_type, value_cents, extra_numbers, description, active)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0, 'Bonus relampago', 'money', 5000, null, 'R$ 50,00.', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 111111, 'Combo energia', 'money', 10000, null, 'R$ 100,00.', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 222222, 'Cotas extras', 'extra_numbers', null, 1000, '1.000 cotas extras.', false),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 333333, 'Mouse gamer', 'product', null, null, 'Mouse gamer.', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 444444, 'Premio turbo', 'money', 30000, null, 'R$ 300,00.', false);

insert into public.social_links (whatsapp_group, whatsapp_support, instagram, tiktok, youtube)
values ('https://wa.me/5500000000000', 'https://wa.me/5500000000000', 'https://instagram.com/cotarush', 'https://tiktok.com/@cotarush', 'https://youtube.com/@cotarush');
