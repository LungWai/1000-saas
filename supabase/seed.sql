-- Create a function to generate initial grids with deterministic UUIDs
CREATE OR REPLACE FUNCTION generate_initial_grids()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    i INTEGER;
    grid_price NUMERIC(10,2);
    grid_uuid UUID;
    base_uuid VARCHAR := '00000000-0000-0000-0000-';
    formatted_number VARCHAR;
BEGIN
    FOR i IN 1..1000 LOOP
        -- Set price based on grid number
        IF i <= 200 THEN
            grid_price := 4.99; -- First 200 grids
        ELSIF i <= 500 THEN
            grid_price := 3.99; -- Next 300 grids (201-500)
        ELSE
            grid_price := 2.99; -- Last 500 grids (501-1000)
        END IF;
        
        -- Format the number to ensure lexicographical ordering
        -- We pad with zeros to ensure proper string comparison
        formatted_number := LPAD(i::text, 12, '0');
        
        -- Create a deterministic UUID where the last part corresponds to the grid number
        -- This ensures UUIDs will sort in the same order as the grid titles
        grid_uuid := (base_uuid || formatted_number)::UUID;
        
        INSERT INTO public.grids (
            id,
            title,
            description,
            content,
            image_url,
            external_url,
            price,
            status,
            user_id
        ) VALUES (
            grid_uuid,
            'Grid ' || i,
            'Available grid space ' || i,
            '{}',
            NULL,  -- No image initially
            NULL,  -- No external URL initially
            grid_price,  -- Variable price based on grid number
            'pending',
            '00000000-0000-0000-0000-000000000000'  -- Placeholder admin user ID
        );
    END LOOP;
END;
$$;

-- Create admin user if not exists
INSERT INTO public.users (
    id,
    email,
    subscription_status,
    role
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'admin@example.com',
    'active',
    'admin'
) ON CONFLICT (id) DO NOTHING;

-- Clear existing grids if any
TRUNCATE public.grids CASCADE;

-- Generate 1000 initial grids
SELECT generate_initial_grids();

-- Drop the function after use
DROP FUNCTION generate_initial_grids(); 