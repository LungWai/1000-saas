-- Add security definer functions for webhook operations
-- These functions will bypass RLS to perform necessary operations for Stripe webhooks

-- Function to find or create a user by Stripe customer ID and email
CREATE OR REPLACE FUNCTION public.find_or_create_user_by_stripe_customer(
    p_email TEXT,
    p_stripe_customer_id TEXT,
    p_subscription_status TEXT DEFAULT 'active'
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user public.users;
BEGIN
    -- First check if user with this customer ID exists
    SELECT * FROM public.users 
    WHERE stripe_customer_id = p_stripe_customer_id
    INTO v_user;
    
    -- If not found, check by email
    IF v_user IS NULL THEN
        SELECT * FROM public.users 
        WHERE email = p_email
        INTO v_user;
    END IF;
    
    -- If still not found, create a new user
    IF v_user IS NULL THEN
        INSERT INTO public.users (
            email, 
            stripe_customer_id, 
            subscription_status
        )
        VALUES (
            p_email, 
            p_stripe_customer_id, 
            p_subscription_status
        )
        RETURNING * INTO v_user;
    ELSE
        -- If user exists but doesn't have this customer ID, update it
        IF v_user.stripe_customer_id IS NULL OR v_user.stripe_customer_id != p_stripe_customer_id THEN
            UPDATE public.users
            SET 
                stripe_customer_id = p_stripe_customer_id,
                subscription_status = p_subscription_status,
                updated_at = TIMEZONE('utc', NOW())
            WHERE id = v_user.id
            RETURNING * INTO v_user;
        END IF;
    END IF;
    
    RETURN v_user;
END;
$$;

-- Function to update grid with subscription information
CREATE OR REPLACE FUNCTION public.update_grid_from_webhook(
    p_grid_id UUID,
    p_user_id UUID,
    p_subscription_id TEXT,
    p_status TEXT DEFAULT 'active',
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS public.grids
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_grid public.grids;
BEGIN
    UPDATE public.grids
    SET 
        user_id = p_user_id,
        subscription_id = p_subscription_id,
        status = p_status,
        start_date = COALESCE(p_start_date, start_date),
        end_date = COALESCE(p_end_date, end_date),
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = p_grid_id
    RETURNING * INTO v_grid;
    
    RETURN v_grid;
END;
$$;

-- Grant execution privileges to authenticated users and the service role
GRANT EXECUTE ON FUNCTION public.find_or_create_user_by_stripe_customer(TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_grid_from_webhook(UUID, UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated, service_role;

-- Add comments for documentation
COMMENT ON FUNCTION public.find_or_create_user_by_stripe_customer IS 'Finds or creates a user by Stripe customer ID and email, bypassing RLS policies for webhook use';
COMMENT ON FUNCTION public.update_grid_from_webhook IS 'Updates a grid with subscription information from webhooks, bypassing RLS policies'; 