alter table public.household_transactions
  add column if not exists recurring_day integer,
  add column if not exists is_skipped boolean not null default false;

create table if not exists public.household_recurring_amount_changes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  recurring_parent_id uuid not null
    references public.household_transactions(id) on delete cascade,
  effective_month date not null,
  amount numeric not null check (amount > 0),
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (recurring_parent_id, effective_month)
);

alter table public.household_recurring_amount_changes enable row level security;

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
    coalesce(amount_change.amount, source.amount),
    source.category,
    v_month_start
      + least(
          coalesce(source.recurring_day, extract(day from source.date)::integer),
          extract(day from (v_month_start + interval '1 month' - interval '1 day'))::integer
        )
      - 1,
    source.id,
    v_month_start
  from public.household_transactions source
  left join lateral (
    select changes.amount
    from public.household_recurring_amount_changes changes
    where changes.recurring_parent_id = source.id
      and changes.effective_month <= v_month_start
    order by changes.effective_month desc
    limit 1
  ) amount_change on true
  where source.household_id = p_household_id
    and source.is_recurring = true
    and source.date < v_month_start
  on conflict (recurring_parent_id, recurring_month) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function public.set_household_recurring_amount(
  p_household_id uuid,
  p_recurring_parent_id uuid,
  p_effective_month date,
  p_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_effective_month is null
    or p_effective_month <> date_trunc('month', p_effective_month)::date
    or p_amount is null
    or p_amount <= 0 then
    raise exception 'A valid month and positive amount are required';
  end if;

  if auth.uid() is null or not exists (
    select 1
    from public.household_members member
    join public.household_transactions source
      on source.household_id = member.household_id
    where member.household_id = p_household_id
      and member.user_id = auth.uid()
      and source.id = p_recurring_parent_id
      and source.is_recurring = true
      and source.recurring_parent_id is null
  ) then
    raise exception 'Recurring expense not found in this household'
      using errcode = '42501';
  end if;

  insert into public.household_recurring_amount_changes (
    household_id,
    recurring_parent_id,
    effective_month,
    amount,
    changed_by
  ) values (
    p_household_id,
    p_recurring_parent_id,
    p_effective_month,
    p_amount,
    auth.uid()
  )
  on conflict (recurring_parent_id, effective_month)
  do update set amount = excluded.amount, changed_by = excluded.changed_by;

  update public.household_transactions
  set amount = p_amount
  where household_id = p_household_id
    and recurring_parent_id = p_recurring_parent_id
    and recurring_month >= p_effective_month;
end;
$$;

revoke all on function public.generate_household_recurring_transactions(uuid, date) from public;
grant execute on function public.generate_household_recurring_transactions(uuid, date) to authenticated;
revoke all on function public.set_household_recurring_amount(uuid, uuid, date, numeric) from public;
grant execute on function public.set_household_recurring_amount(uuid, uuid, date, numeric) to authenticated;
