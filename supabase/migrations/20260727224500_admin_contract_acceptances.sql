create table if not exists public.admin_contract_acceptances (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  contract_version text not null,
  accepted boolean not null default true,
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (admin_id, contract_version)
);

alter table public.admin_contract_acceptances enable row level security;

drop policy if exists "admin contract owner read" on public.admin_contract_acceptances;
create policy "admin contract owner read"
on public.admin_contract_acceptances for select
using (public.can_manage_admin_scope(admin_id));

drop policy if exists "admin contract service insert" on public.admin_contract_acceptances;
create policy "admin contract service insert"
on public.admin_contract_acceptances for insert
with check (public.can_manage_admin_scope(admin_id));
