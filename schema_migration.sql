-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create users table
create table public.users (
    id uuid primary key default uuid_generate_v4(),
    email text unique not null,
    stripe_customer_id text unique,
    subscription_status text check (subscription_status in ('active', 'inactive', 'trialing', 'past_due', 'canceled', 'unpaid')) not null default 'inactive',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create grids table
create table public.grids (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.users(id) on delete cascade not null,
    subscription_id text unique,
    title text not null,
    description text,
    content jsonb not null default '{}',
    price numeric(10,2) not null default 10.00,
    status text check (status in ('available', 'reserved', 'purchased')) not null default 'available',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create subscriptions table
create table public.subscriptions (
    id text primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    grid_id uuid references public.grids(id) on delete cascade not null,
    status text check (status in ('active', 'inactive', 'trialing', 'past_due', 'canceled', 'unpaid')) not null default 'inactive',
    current_period_start timestamp with time zone not null,
    current_period_end timestamp with time zone not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for efficient querying
create index idx_grids_user_id on public.grids(user_id);
create index idx_grids_subscription_id on public.grids(subscription_id);
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_grid_id on public.subscriptions(grid_id);

-- Create function to get grids by subscription ID
create or replace function public.get_grid_by_subscription(subscription_id text)
returns setof public.grids
language sql
security definer
as $$
    select g.*
    from public.grids g
    where g.subscription_id = subscription_id;
$$;

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.grids enable row level security;
alter table public.subscriptions enable row level security;

-- Create policies
-- Users can only read and update their own data
create policy "Users can view own data"
    on public.users for select
    using (auth.uid() = id);

create policy "Users can update own data"
    on public.users for update
    using (auth.uid() = id);

-- Grids policies
create policy "Anyone can view available grids"
    on public.grids for select
    using (status = 'available');

create policy "Users can view their purchased grids"
    on public.grids for select
    using (user_id = auth.uid());

create policy "Users can update their purchased grids"
    on public.grids for update
    using (user_id = auth.uid());

-- Subscriptions policies
create policy "Users can view own subscriptions"
    on public.subscriptions for select
    using (user_id = auth.uid());

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

-- Create triggers for updated_at
create trigger handle_grids_updated_at
    before update on public.grids
    for each row
    execute function public.handle_updated_at();

create trigger handle_subscriptions_updated_at
    before update on public.subscriptions
    for each row
    execute function public.handle_updated_at(); 