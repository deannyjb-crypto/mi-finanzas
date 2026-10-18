alter table public.household_transactions
  add column if not exists is_recurring boolean not null default false,
  add column if not exists recurring_parent_id uuid
    references public.household_transactions(id) on delete cascade,
  add column if not exists recurring_month date;

create unique index if not exists household_transactions_recurring_month_unique
  on public.household_transactions (recurring_parent_id, recurring_month);
