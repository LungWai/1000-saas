-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'trialing', 'past_due', 'canceled', 'unpaid')) NOT NULL DEFAULT 'inactive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE public.grids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    subscription_id TEXT UNIQUE,
    title TEXT NOT NULL CHECK (char_length(title) <= 50),
    description TEXT CHECK (char_length(description) <= 250),
    content JSONB NOT NULL DEFAULT '{}',
    price NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    status TEXT CHECK (status IN ('active', 'inactive', 'pending')) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE public.subscriptions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    grid_id UUID REFERENCES public.grids(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')) NOT NULL DEFAULT 'monthly',
    stripe_subscription_id TEXT UNIQUE,
    status TEXT CHECK (status IN ('active', 'inactive', 'trialing', 'past_due', 'canceled', 'unpaid')) NOT NULL DEFAULT 'inactive',
    next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_grids_user_id ON public.grids(user_id);
CREATE INDEX idx_grids_subscription_id ON public.grids(subscription_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_grid_id ON public.subscriptions(grid_id);
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_grids_updated_at
    BEFORE UPDATE ON public.grids
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users policies
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Grids policies
CREATE POLICY "Public grids are viewable by everyone"
    ON public.grids FOR SELECT
    USING (status = 'active');

CREATE POLICY "Users can view their purchased grids"
    ON public.grids FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their purchased grids"
    ON public.grids FOR UPDATE
    USING (user_id = auth.uid());

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage subscriptions"
    ON public.subscriptions 
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Storage policies
CREATE POLICY "Anyone can view grid images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'grid-images');

CREATE POLICY "Users can upload grid images if they have an active subscription"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'grid-images'
        AND EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    );

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_grid_by_subscription(subscription_id TEXT)
RETURNS SETOF public.grids
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT g.*
    FROM public.grids g
    WHERE g.subscription_id = subscription_id;
$$; 