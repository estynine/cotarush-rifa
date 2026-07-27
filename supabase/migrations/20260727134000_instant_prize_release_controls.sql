create type public.instant_prize_release_rule as enum ('manual', 'after_percent_sold', 'after_revenue', 'sold_out');

alter table public.instant_prizes
  add column release_rule public.instant_prize_release_rule not null default 'manual',
  add column release_threshold_percent numeric(5,2),
  add column release_threshold_cents integer,
  add column payout_reserve_cents integer not null default 0,
  add column public_rule_label text not null default 'Liberacao conforme regulamento da campanha',
  add column locked_at timestamptz;

alter table public.instant_prizes
  add constraint instant_prizes_release_controls_valid
  check (
    payout_reserve_cents >= 0
    and (release_threshold_percent is null or release_threshold_percent between 0 and 100)
    and (release_threshold_cents is null or release_threshold_cents >= 0)
    and (
      (release_rule = 'manual' and release_threshold_percent is null and release_threshold_cents is null)
      or (release_rule = 'after_percent_sold' and release_threshold_percent is not null and release_threshold_cents is null)
      or (release_rule = 'after_revenue' and release_threshold_cents is not null and release_threshold_percent is null)
      or (release_rule = 'sold_out' and release_threshold_percent is null and release_threshold_cents is null)
    )
  );

create or replace function public.lock_found_instant_prize()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.found = true then
    if new.number <> old.number
      or coalesce(new.value_cents, -1) <> coalesce(old.value_cents, -1)
      or new.campaign_id <> old.campaign_id
      or new.found_by_participant_id <> old.found_by_participant_id
      or new.found_order_id <> old.found_order_id
    then
      raise exception 'instant_prize_found_locked';
    end if;
  end if;

  if new.found = true and old.found = false then
    new.locked_at := now();
  end if;

  return new;
end;
$$;

create trigger lock_found_instant_prize_trigger
before update on public.instant_prizes
for each row execute function public.lock_found_instant_prize();

create or replace function public.prevent_found_instant_prize_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.found = true then
    raise exception 'instant_prize_found_locked';
  end if;

  return old;
end;
$$;

create trigger prevent_found_instant_prize_delete_trigger
before delete on public.instant_prizes
for each row execute function public.prevent_found_instant_prize_delete();
