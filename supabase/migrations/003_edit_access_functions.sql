-- Function to get grid details by ID (public access)
CREATE OR REPLACE FUNCTION public.get_grid_details(p_grid_id UUID)
RETURNS SETOF public.grids
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.grids WHERE id = p_grid_id;
$$;

-- Function to verify edit access and return grid details
CREATE OR REPLACE FUNCTION public.verify_and_get_grid(
    p_subscription_id TEXT,
    p_email TEXT,
    p_grid_id UUID
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
        -- Return grid details
        RETURN QUERY SELECT * FROM public.grids WHERE id = p_grid_id;
    ELSE
        RAISE EXCEPTION 'Invalid access credentials';
    END IF;
END;
$$;

-- Function to list all active grids with pagination
CREATE OR REPLACE FUNCTION public.list_active_grids(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.grids
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * 
    FROM public.grids 
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
$$;

-- Function to count total active grids
CREATE OR REPLACE FUNCTION public.count_active_grids()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.grids 
    WHERE status = 'active';
$$;

-- Function to search grids by title or description
CREATE OR REPLACE FUNCTION public.search_grids(
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.grids
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * 
    FROM public.grids 
    WHERE 
        status = 'active' AND
        (
            title ILIKE '%' || p_search_term || '%' OR
            description ILIKE '%' || p_search_term || '%'
        )
    ORDER BY created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
$$; 