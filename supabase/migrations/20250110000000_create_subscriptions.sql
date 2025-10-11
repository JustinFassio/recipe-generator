-- Create subscriptions table
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null, -- trialing, active, canceled, past_due, unpaid
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index on user_id for faster lookups
create index idx_user_subscriptions_user_id on public.user_subscriptions(user_id);
create index idx_user_subscriptions_stripe_customer_id on public.user_subscriptions(stripe_customer_id);
create index idx_user_subscriptions_status on public.user_subscriptions(status);

-- Enable Row Level Security
alter table public.user_subscriptions enable row level security;

-- Policy: Users can view their own subscription
create policy "Users can view own subscription"
  on public.user_subscriptions
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own subscription (via service role only in practice)
create policy "Service role can insert subscriptions"
  on public.user_subscriptions
  for insert
  with check (true);

-- Policy: Service role can update subscriptions
create policy "Service role can update subscriptions"
  on public.user_subscriptions
  for update
  using (true);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.user_subscriptions
  for each row
  execute function public.handle_updated_at();

-- Create a view for easy subscription status checking
create or replace view public.user_subscription_status as
select 
  user_id,
  status,
  trial_end,
  current_period_end,
  case 
    when status in ('trialing', 'active') then true
    else false
  end as has_access,
  case
    when status = 'trialing' and trial_end > now() then true
    else false
  end as is_in_trial,
  case
    when trial_end is not null and trial_end < now() then true
    else false
  end as trial_ended
from public.user_subscriptions;

-- Grant access to authenticated users
grant select on public.user_subscription_status to authenticated;

comment on table public.user_subscriptions is 'Stores user subscription information synced from Stripe';
comment on view public.user_subscription_status is 'Simplified view for checking user subscription access';


