import { supabase } from './supabase';
import { Grid, User, Subscription } from '@/types';

// Mock data for frontend development
const mockGrids: Grid[] = Array.from({ length: 1000 }, (_, index) => ({
  id: (index + 1).toString(),
  content: null,
  customerId: null,
  url: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  user_id: '',
  image_url: '',
  title: '',
  description: '',
  external_url: '',
  start_date: new Date(),
  end_date: new Date(),
  status: 'pending',
  subscription_id: '',
}));

export const getGrids = async (page = 1, limit = 200) => {
  try {
    const { data, error, count } = await supabase
      .from('grids')
      .select('*', { count: 'exact' })
      .order('title')
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw error;
    }

    return { grids: data as Grid[], total: count || 0 };
  } catch (error) {
    console.error('Error fetching grids:', error);
    throw error;
  }
};

export const getGridById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('grids')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data as Grid;
  } catch (error) {
    console.error('Error fetching grid:', error);
    throw error;
  }
};

export const updateGridContent = async (
  id: string,
  updates: Partial<Grid>
) => {
  try {
    const { data, error } = await supabase
      .from('grids')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as Grid;
  } catch (error) {
    console.error('Error updating grid content:', error);
    throw error;
  }
};

export const createGrid = async (grid: Omit<Grid, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('grids')
      .insert([grid])
      .select()
      .single();

    if (error) throw error;

    return data as Grid;
  } catch (error) {
    console.error('Error creating grid:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;

    return data as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const createUser = async (user: Omit<User, 'id' | 'created_at'>) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) throw error;

    return data as User;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getGridBySubscription = async (subscriptionId: string) => {
  try {
    const { data, error } = await supabase
      .from('grids')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .single();

    if (error) throw error;

    return data as Grid;
  } catch (error) {
    console.error('Error fetching grid by subscription:', error);
    throw error;
  }
};

export const updateGridUrl = async (
  id: string,
  userId: string,
  external_url: string
) => {
  try {
    const { data, error } = await supabase
      .from('grids')
      .update({ 
        external_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating grid URL:', error);
    throw error;
  }
};

export const getUserByStripeCustomerId = async (stripeCustomerId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', stripeCustomerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, return null
        return null;
      }
      throw error;
    }

    return data as User;
  } catch (error) {
    console.error('Error fetching user by Stripe customer ID:', error);
    throw error;
  }
};

/**
 * Find or create a user via the security definer function
 * This bypasses RLS for webhook operations
 */
export const findOrCreateUserByStripeCustomer = async (
  email: string,
  stripeCustomerId: string,
  subscriptionStatus: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' = 'active'
) => {
  try {
    const { data, error } = await supabase
      .rpc('find_or_create_user_by_stripe_customer', {
        p_email: email,
        p_stripe_customer_id: stripeCustomerId,
        p_subscription_status: subscriptionStatus
      });

    if (error) throw error;

    return data as User;
  } catch (error) {
    console.error('Error finding or creating user by Stripe customer ID:', error);
    throw error;
  }
};

/**
 * Update grid with subscription information via the security definer function
 * This bypasses RLS for webhook operations
 */
export const updateGridFromWebhook = async (
  gridId: string,
  userId: string,
  subscriptionId: string,
  status: 'active' | 'inactive' | 'pending' = 'active',
  startDate?: Date,
  endDate?: Date
) => {
  try {
    const { data, error } = await supabase
      .rpc('update_grid_from_webhook', {
        p_grid_id: gridId,
        p_user_id: userId,
        p_subscription_id: subscriptionId,
        p_status: status,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) throw error;

    return data as Grid;
  } catch (error) {
    console.error('Error updating grid from webhook:', error);
    throw error;
  }
}; 