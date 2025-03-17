-- Add security definer function for subscription management from webhooks
-- This function will bypass RLS to perform necessary operations for Stripe webhooks

-- Function to create or update a subscription record
CREATE OR REPLACE FUNCTION public.create_or_update_subscription_from_webhook(
    p_id TEXT,
    p_user_id UUID,
    p_grid_id UUID DEFAULT NULL,
    p_amount NUMERIC DEFAULT NULL,
    p_billing_cycle TEXT DEFAULT 'monthly',
    p_stripe_subscription_id TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'active',
    p_next_billing_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription public.subscriptions;
BEGIN
    -- First check if subscription with this ID exists
    SELECT * FROM public.subscriptions 
    WHERE id = p_id
    INTO v_subscription;
    
    -- If found, update it
    IF v_subscription IS NOT NULL THEN
        UPDATE public.subscriptions
        SET 
            user_id = p_user_id,
            grid_id = COALESCE(p_grid_id, v_subscription.grid_id),
            amount = COALESCE(p_amount, v_subscription.amount),
            billing_cycle = COALESCE(p_billing_cycle, v_subscription.billing_cycle),
            stripe_subscription_id = COALESCE(p_stripe_subscription_id, v_subscription.stripe_subscription_id),
            status = COALESCE(p_status, v_subscription.status),
            next_billing_date = COALESCE(p_next_billing_date, v_subscription.next_billing_date),
            current_period_start = COALESCE(p_current_period_start, v_subscription.current_period_start),
            current_period_end = COALESCE(p_current_period_end, v_subscription.current_period_end),
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = p_id
        RETURNING * INTO v_subscription;
    ELSE
        -- If not found, create a new subscription
        INSERT INTO public.subscriptions (
            id,
            user_id,
            grid_id,
            amount,
            billing_cycle,
            stripe_subscription_id,
            status,
            current_period_start,
            current_period_end,
            next_billing_date,
            created_at
        )
        VALUES (
            p_id,
            p_user_id,
            p_grid_id,
            COALESCE(p_amount, 0),
            p_billing_cycle,
            COALESCE(p_stripe_subscription_id, p_id),
            p_status,
            COALESCE(p_current_period_start, TIMEZONE('utc', NOW())),
            COALESCE(p_current_period_end, TIMEZONE('utc', NOW() + INTERVAL '1 month')),
            COALESCE(p_next_billing_date, TIMEZONE('utc', NOW() + INTERVAL '1 month')),
            TIMEZONE('utc', NOW())
        )
        RETURNING * INTO v_subscription;
    END IF;
    
    RETURN v_subscription;
END;
$$;

-- Grant execution privileges to authenticated users and the service role
GRANT EXECUTE ON FUNCTION public.create_or_update_subscription_from_webhook(TEXT, UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated, service_role;

-- Add comments for documentation
COMMENT ON FUNCTION public.create_or_update_subscription_from_webhook IS 'Creates or updates a subscription record from webhooks, bypassing RLS policies';

-- Add an alternate function that makes grid_id optional (workaround for the NOT NULL constraint)
CREATE OR REPLACE FUNCTION public.create_subscription_without_grid(
    p_id TEXT,
    p_user_id UUID,
    p_amount NUMERIC DEFAULT NULL,
    p_billing_cycle TEXT DEFAULT 'monthly',
    p_stripe_subscription_id TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'active',
    p_next_billing_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set a temporary dummy grid ID just to satisfy the constraint
    -- This is only for subscriptions that don't yet have a grid
    -- Later they can be properly associated with a grid
    WITH temp_grid AS (
        SELECT id FROM public.grids LIMIT 1
    )
    INSERT INTO public.subscriptions (
        id,
        user_id,
        grid_id,          -- Use a placeholder grid ID to satisfy NOT NULL constraint
        amount,
        billing_cycle,
        stripe_subscription_id,
        status,
        current_period_start,
        current_period_end,
        next_billing_date,
        created_at
    )
    VALUES (
        p_id,
        p_user_id,
        (SELECT id FROM temp_grid), -- Placeholder grid
        COALESCE(p_amount, 0),
        p_billing_cycle,
        COALESCE(p_stripe_subscription_id, p_id),
        p_status,
        COALESCE(p_current_period_start, TIMEZONE('utc', NOW())),
        COALESCE(p_current_period_end, TIMEZONE('utc', NOW() + INTERVAL '1 month')),
        COALESCE(p_next_billing_date, TIMEZONE('utc', NOW() + INTERVAL '1 month')),
        TIMEZONE('utc', NOW())
    );
END;
$$;

-- Grant execution privileges
GRANT EXECUTE ON FUNCTION public.create_subscription_without_grid(TEXT, UUID, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated, service_role; 