alter table public.support_settings
  add column if not exists admin_id uuid references public.profiles(id) on delete cascade,
  add column if not exists enabled boolean not null default true;

alter table public.support_settings
  alter column label set default 'Suporte',
  alter column whatsapp_support drop not null;

update public.support_settings
set admin_id = coalesce(
  admin_id,
  (
    select ur.user_id
    from public.user_roles ur
    where ur.role in ('admin', 'super_admin')
    order by case when ur.role = 'super_admin' then 0 else 1 end
    limit 1
  )
)
where admin_id is null;

create unique index if not exists support_settings_admin_id_uidx
on public.support_settings (admin_id)
where admin_id is not null;

drop policy if exists "support public read" on public.support_settings;
create policy "support enabled public read"
on public.support_settings for select
using (enabled = true or public.can_manage_admin_scope(admin_id));

drop policy if exists "admins manage scoped support settings" on public.support_settings;
create policy "admins manage scoped support settings"
on public.support_settings for all
using (public.can_manage_admin_scope(admin_id))
with check (public.can_manage_admin_scope(admin_id));
