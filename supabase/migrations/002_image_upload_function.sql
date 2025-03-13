-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.update_grid_content_secure;
DROP FUNCTION IF EXISTS public.handle_grid_image_upload;
DROP FUNCTION IF EXISTS public.verify_grid_edit_access;

-- Function to handle image uploads with subscription ID and email verification
CREATE OR REPLACE FUNCTION public.handle_grid_image_upload(
    p_subscription_id TEXT,
    p_email TEXT,
    p_grid_id UUID,
    p_file_path TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_access BOOLEAN;
    v_storage_url TEXT;
BEGIN
    -- Verify access
    SELECT public.verify_grid_edit_access(p_subscription_id, p_email, p_grid_id) INTO v_has_access;
    
    IF v_has_access THEN
        -- Construct storage URL
        v_storage_url := 'https://supabase.co/storage/v1/object/public/grid-images/' || p_file_path;
        
        -- Update grid with new image URL
        UPDATE public.grids
        SET 
            image_url = v_storage_url,
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = p_grid_id;
        
        -- Return the storage URL
        RETURN v_storage_url;
    ELSE
        RAISE EXCEPTION 'Invalid access credentials';
    END IF;
END;
$$;

-- Function to securely update grid content with access verification
CREATE OR REPLACE FUNCTION public.update_grid_content_secure(
    p_grid_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_external_url TEXT,
    p_image_url TEXT,
    p_subscription_id TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS SETOF grids
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_access BOOLEAN;
BEGIN
    -- If subscription ID and email are provided, verify access
    IF p_subscription_id IS NOT NULL AND p_email IS NOT NULL THEN
        SELECT public.verify_grid_edit_access(p_subscription_id, p_email, p_grid_id) INTO v_has_access;
        
        IF NOT v_has_access THEN
            RAISE EXCEPTION 'Invalid access credentials';
        END IF;
    END IF;
    
    -- Update grid content
    RETURN QUERY
    UPDATE public.grids
    SET 
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        external_url = COALESCE(p_external_url, external_url),
        image_url = COALESCE(p_image_url, image_url),
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = p_grid_id
    RETURNING *;
END;
$$;

-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Upload grid images with subscription ID verification" ON storage.objects;
DROP POLICY IF EXISTS "Update grid images with subscription ID verification" ON storage.objects;
DROP POLICY IF EXISTS "Delete grid images with subscription ID verification" ON storage.objects;

-- Create storage policy for image uploads with subscription ID verification
CREATE POLICY "Upload grid images with subscription ID verification"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'grid-images'
        AND (
            -- Allow upload if header contains valid subscription ID
            EXISTS (
                SELECT 1 
                FROM public.grids g
                WHERE g.subscription_id = current_setting('request.headers')::json->>'x-subscription-id'
                AND g.status = 'active'
            )
        )
    );

-- Create storage policy for updating images
CREATE POLICY "Update grid images with subscription ID verification"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'grid-images'
        AND (
            -- Allow update if header contains valid subscription ID
            EXISTS (
                SELECT 1 
                FROM public.grids g
                WHERE g.subscription_id = current_setting('request.headers')::json->>'x-subscription-id'
                AND g.status = 'active'
            )
        )
    );

-- Create storage policy for deleting images
CREATE POLICY "Delete grid images with subscription ID verification"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'grid-images'
        AND (
            -- Allow delete if header contains valid subscription ID
            EXISTS (
                SELECT 1 
                FROM public.grids g
                WHERE g.subscription_id = current_setting('request.headers')::json->>'x-subscription-id'
                AND g.status = 'active'
            )
        )
    );

-- Helper function to verify grid edit access
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
    v_has_access BOOLEAN := FALSE;
    v_is_customer_id BOOLEAN;
    v_is_subscription_id BOOLEAN;
    v_user_id UUID;
BEGIN
    -- Check if the provided ID is a customer ID or subscription ID
    v_is_customer_id := p_subscription_id LIKE 'cus_%';
    v_is_subscription_id := p_subscription_id LIKE 'sub_%';
    
    IF v_is_customer_id THEN
        -- Verify customer ID and email
        SELECT id INTO v_user_id
        FROM public.users
        WHERE stripe_customer_id = p_subscription_id
        AND email = p_email
        AND subscription_status = 'active';
        
        IF v_user_id IS NOT NULL THEN
            -- Check if this user owns the grid
            SELECT TRUE INTO v_has_access
            FROM public.grids
            WHERE id = p_grid_id
            AND user_id = v_user_id;
        END IF;
    ELSIF v_is_subscription_id THEN
        -- Verify subscription ID
        SELECT TRUE INTO v_has_access
        FROM public.subscriptions s
        JOIN public.users u ON s.user_id = u.id
        WHERE s.stripe_subscription_id = p_subscription_id
        AND s.grid_id = p_grid_id
        AND s.status = 'active'
        AND u.email = p_email;
    END IF;
    
    RETURN COALESCE(v_has_access, FALSE);
END;
$$; 