alter table public.social_links
  add column if not exists admin_id uuid references public.profiles(id) on delete cascade,
  add column if not exists telegram text;

update public.social_links
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

create unique index if not exists social_links_admin_id_uidx
on public.social_links (admin_id);

drop policy if exists "social public read" on public.social_links;
create policy "social configured public read"
on public.social_links for select
using (true);

drop policy if exists "admins manage scoped social links" on public.social_links;
create policy "admins manage scoped social links"
on public.social_links for all
using (public.can_manage_admin_scope(admin_id))
with check (public.can_manage_admin_scope(admin_id));
