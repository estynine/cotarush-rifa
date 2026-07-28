delete from public.instant_prizes
where campaign_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and number in (0, 111111, 222222, 333333, 444444)
  and found = false;

create or replace function public.instant_prize_is_released(
  p_prize public.instant_prizes,
  p_campaign public.campaigns,
  p_projected_numbers integer
)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  v_projected_percent numeric(7,4);
  v_projected_revenue integer;
begin
  if p_prize.found = true or p_prize.active = false then
    return false;
  end if;

  v_projected_percent := (p_projected_numbers::numeric * 100) / greatest(p_campaign.total_numbers, 1);
  v_projected_revenue := p_projected_numbers * p_campaign.price_per_number_cents;

  if p_prize.release_rule = 'manual' then
    return true;
  end if;

  if p_prize.release_rule = 'after_percent_sold' then
    return v_projected_percent >= coalesce(p_prize.release_threshold_percent, 101);
  end if;

  if p_prize.release_rule = 'after_revenue' then
    return v_projected_revenue >= coalesce(p_prize.release_threshold_cents, 2147483647);
  end if;

  if p_prize.release_rule = 'sold_out' then
    return p_projected_numbers >= p_campaign.total_numbers;
  end if;

  return false;
end;
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
  v_projected_numbers integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.status <> 'approved' then raise exception 'order_not_approved'; end if;
  if v_order.processed_at is not null then return; end if;

  select * into v_campaign from public.campaigns where id = v_order.campaign_id for update;
  v_needed := v_order.quantity;
  v_today := public.current_sp_date(coalesce(v_order.approved_at, now()));
  v_projected_numbers := v_campaign.confirmed_numbers + v_order.quantity;

  while v_allocated < v_needed loop
    v_candidate := floor(random() * v_campaign.total_numbers)::integer;

    begin
      if exists (
        select 1
        from public.instant_prizes ip
        where ip.campaign_id = v_campaign.id
          and ip.number = v_candidate
          and public.instant_prize_is_released(ip, v_campaign, v_projected_numbers) = false
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
    select *
    from public.instant_prizes ip
    where ip.campaign_id = v_campaign.id
      and public.instant_prize_is_released(ip, v_campaign, v_projected_numbers) = true
      and exists (
        select 1 from public.number_allocations
        where campaign_id = v_campaign.id and order_id = v_order.id and number = ip.number
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
