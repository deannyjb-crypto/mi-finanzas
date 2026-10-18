create or replace function public.generate_household_recurring_transactions(
  p_household_id uuid,
  p_month date
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_month_start date := date_trunc('month', p_month)::date;
  v_inserted integer;
begin
  if p_month is null or p_month <> v_month_start then
    raise exception 'p_month must be the first day of a month';
  end if;

  if auth.uid() is null or not exists (
    select 1
    from public.household_members member
    where member.household_id = p_household_id
      and member.user_id = auth.uid()
  ) then
    raise exception 'User is not a member of this household'
      using errcode = '42501';
  end if;

  insert into public.household_transactions (
    household_id,
    paid_by,
    description,
    amount,
    category,
    date,
    recurring_parent_id,
    recurring_month
  )
  select
    source.household_id,
    source.paid_by,
    source.description,
    source.amount,
    source.category,
    v_month_start
      + least(
          extract(day from source.date)::integer,
          extract(day from (v_month_start + interval '1 month' - interval '1 day'))::integer
        )
      - 1,
    source.id,
    v_month_start
  from public.household_transactions source
  where source.household_id = p_household_id
    and source.is_recurring = true
    and source.date < v_month_start
  on conflict (recurring_parent_id, recurring_month) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke all on function public.generate_household_recurring_transactions(uuid, date) from public;
grant execute on function public.generate_household_recurring_transactions(uuid, date) to authenticated;
