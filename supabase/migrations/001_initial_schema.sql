-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'trialing', 'past_due', 'canceled', 'unpaid')) NOT NULL DEFAULT 'inactive',
    role TEXT CHECK (role IN ('user', 'admin')) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE public.grids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    subscription_id TEXT UNIQUE,
    title TEXT NOT NULL CHECK (char_length(title) <= 50),
    description TEXT CHECK (char_length(description) <= 250),
    image_url TEXT,
    external_url TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    price NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    status TEXT CHECK (status IN ('active', 'inactive', 'pending')) NOT NULL DEFAULT 'pending',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
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
-- Allow public viewing of all grids without authentication
CREATE POLICY "All grids are viewable by everyone"
    ON public.grids FOR SELECT
    USING (true);

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

-- Helper functions
-- Function to get grid by subscription ID
CREATE OR REPLACE FUNCTION public.get_grid_by_subscription(subscription_id TEXT)
RETURNS SETOF public.grids
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT g.*
    FROM public.grids g
    WHERE g.subscription_id = subscription_id;
$$;

-- Function to verify edit access using subscription ID and email
CREATE OR REPLACE FUNCTION public.verify_grid_edit_access(
    p_subscription_id TEXT,
    p_email TEXT,
    p_grid_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_valid BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.subscriptions s
        JOIN public.users u ON s.user_id = u.id
        JOIN public.grids g ON s.grid_id = g.id
        WHERE s.id = p_subscription_id
        AND u.email = p_email
        AND g.id = p_grid_id
        AND s.status IN ('active', 'trialing')
    ) INTO v_valid;
    
    RETURN v_valid;
END;
$$;

-- Function to update grid content with verification
CREATE OR REPLACE FUNCTION public.update_grid_content(
    p_subscription_id TEXT,
    p_email TEXT,
    p_grid_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_external_url TEXT,
    p_image_url TEXT
)
RETURNS SETOF public.grids
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_access BOOLEAN;
BEGIN
    -- Verify access
    SELECT public.verify_grid_edit_access(p_subscription_id, p_email, p_grid_id) INTO v_has_access;
    
    IF v_has_access THEN
        -- Update grid content
        UPDATE public.grids
        SET 
            title = COALESCE(p_title, title),
            description = COALESCE(p_description, description),
            external_url = COALESCE(p_external_url, external_url),
            image_url = COALESCE(p_image_url, image_url),
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = p_grid_id;
        
        -- Return updated grid
        RETURN QUERY SELECT * FROM public.grids WHERE id = p_grid_id;
    ELSE
        RAISE EXCEPTION 'Invalid access credentials';
    END IF;
END;
$$; 