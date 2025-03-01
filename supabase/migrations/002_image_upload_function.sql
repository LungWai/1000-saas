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