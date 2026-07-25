create policy "user roles own read"
on public.user_roles
for select
using (user_id = auth.uid() or public.has_role('admin'));

create policy "admins manage user roles"
on public.user_roles
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "admins read payment events"
on public.payment_events
for select
using (public.has_role('admin'));

create policy "service/admin insert payment events"
on public.payment_events
for insert
with check (public.has_role('admin'));

create policy "promotional grants own read"
on public.promotional_grants
for select
using (participant_id = auth.uid() or public.has_role('admin'));

create policy "admins manage promotional grants"
on public.promotional_grants
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));
