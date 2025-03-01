-- Create a function to generate initial grids
CREATE OR REPLACE FUNCTION generate_initial_grids()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..1000 LOOP
        INSERT INTO public.grids (
            title,
            description,
            content,
            image_url,
            external_url,
            price,
            status,
            user_id
        ) VALUES (
            'Grid ' || i,
            'Available grid space ' || i,
            '{}',
            NULL,  -- No image initially
            NULL,  -- No external URL initially
            10.00,  -- Default price
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