-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    subscription_status TEXT CHECK (subscription_status IN ('active', 'past_due', 'canceled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS grids (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- Stores Stripe customer ID
    title TEXT CHECK (char_length(title) <= 50),
    description TEXT CHECK (char_length(description) <= 250),
    image_url TEXT,
    external_url TEXT,
    content TEXT,
    subscription_id TEXT,
    status TEXT CHECK (status IN ('pending', 'active', 'inactive')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grid_id INTEGER REFERENCES grids(id),
    amount INTEGER NOT NULL, -- Amount in cents
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    stripe_subscription_id TEXT UNIQUE,
    status TEXT CHECK (status IN ('active', 'canceled', 'past_due')),
    next_billing_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_grids_user_id ON grids(user_id);
CREATE INDEX IF NOT EXISTS idx_grids_subscription_id ON grids(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Create update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_grids_updated_at
    BEFORE UPDATE ON grids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read their own data"
    ON users FOR SELECT
    USING (auth.uid()::text = id::text);

-- Grids policies
CREATE POLICY "Anyone can view grids"
    ON grids FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Users can update their own grids"
    ON grids FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM grids
        WHERE grids.id = grid_id
        AND grids.user_id = auth.uid()::text
    ));

-- Create functions
CREATE OR REPLACE FUNCTION get_grid_by_subscription(p_subscription_id TEXT)
RETURNS grids
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM grids
    WHERE subscription_id = p_subscription_id
    LIMIT 1;
$$; 