alter table public.orders
  add constraint orders_quantity_hard_limit
  check (quantity between 1 and 10000);

alter table public.orders
  add constraint orders_price_total_hard_limit
  check (
    unit_price_cents between 1 and 214748
    and total_cents = quantity * unit_price_cents
    and total_cents between 1 and 2147483647
  );

alter table public.campaigns
  add constraint campaigns_price_and_quantity_hard_limit
  check (
    price_per_number_cents between 1 and 214748
    and max_numbers_per_order between 1 and 10000
    and total_numbers between 1 and 1000000
    and confirmed_numbers between 0 and total_numbers
  );

alter table public.daily_number_extremes
  add constraint daily_number_extremes_number_range
  check (
    (lowest_number is null or lowest_number between 0 and 999999)
    and (highest_number is null or highest_number between 0 and 999999)
  );

alter table public.daily_buyer_rankings
  add constraint daily_buyer_rankings_quantity_nonnegative
  check (quantity >= 0);

alter table public.campaign_rankings
  add constraint campaign_rankings_quantity_nonnegative
  check (quantity >= 0);
