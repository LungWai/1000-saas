-- Enable RLS on tables
ALTER TABLE grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grid policies
CREATE POLICY "Public grids are viewable by everyone"
  ON grids FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can update their own grids"
  ON grids FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Subscription policies
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can create subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- User policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Storage policies
CREATE POLICY "Anyone can view grid images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'grid-images');

CREATE POLICY "Users can upload grid images if they have an active subscription"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'grid-images'
    AND EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  ); 