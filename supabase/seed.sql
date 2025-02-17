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
            price,
            status
        ) VALUES (
            'Grid ' || i,
            'Available grid space ' || i,
            '{}',
            10.00,  -- Default price from PRICING.BASE_PRICE
            'pending'
        );
    END LOOP;
END;
$$;

-- Clear existing grids if any
TRUNCATE public.grids CASCADE;

-- Generate 1000 initial grids
SELECT generate_initial_grids();

-- Drop the function after use
DROP FUNCTION generate_initial_grids(); 