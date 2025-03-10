import { supabase } from './supabase';
import { Grid, User, Subscription } from '@/types';

// Remove all mock data - we're using real database data now

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
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
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

/**
 * Update grid content with customer verification
 * This ensures only the grid owner can update the content
 */
export const updateGridContentWithVerification = async (
  id: string,
  customerId: string,
  updates: {
    title?: string;
    description?: string;
    image_url?: string;
    content?: string | null;
    external_url?: string;
  }
) => {
  try {
    // First verify the grid belongs to this customer
    const { data: gridData, error: gridError } = await supabase
      .from('grids')
      .select('*')
      .eq('id', id)
      .eq('user_id', customerId)
      .single();
    
    if (gridError) {
      console.error('Grid verification error:', gridError);
      throw new Error('Grid not found or not owned by this customer');
    }
    
    // Then update the grid
    const { data, error } = await supabase
      .from('grids')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', customerId)
      .select()
      .single();

    if (error) throw error;

    return data as Grid;
  } catch (error) {
    console.error('Error updating grid content with verification:', error);
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

/**
 * Create or update a subscription record in the database
 * Uses the security definer function to bypass RLS policies
 */
export const createOrUpdateSubscription = async (data: {
  id: string;
  user_id: string;
  grid_id?: string;
  amount?: number;
  billing_cycle?: 'monthly' | 'quarterly' | 'yearly';
  stripe_subscription_id?: string;
  status?: 'active' | 'canceled' | 'past_due';
  next_billing_date?: Date;
  current_period_start?: Date;
  current_period_end?: Date;
}) => {
  try {
    console.log('Creating/updating subscription:', data.id);
    
    // If grid_id is null, use the special function that handles subscriptions without grids
    if (!data.grid_id) {
      console.log('Using create_subscription_without_grid because grid_id is null');
      const { error } = await supabase
        .rpc('create_subscription_without_grid', {
          p_id: data.id,
          p_user_id: data.user_id,
          p_amount: data.amount,
          p_billing_cycle: data.billing_cycle,
          p_stripe_subscription_id: data.stripe_subscription_id,
          p_status: data.status,
          p_next_billing_date: data.next_billing_date,
          p_current_period_start: data.current_period_start,
          p_current_period_end: data.current_period_end || data.next_billing_date // Fallback to next_billing_date
        });
      
      if (error) throw error;
      
      // Just return a basic subscription since we don't have the full object
      return {
        id: data.id,
        user_id: data.user_id,
        status: data.status || 'active'
      } as Subscription;
    }
    
    // Use the security definer function to bypass RLS
    const { data: result, error } = await supabase
      .rpc('create_or_update_subscription_from_webhook', {
        p_id: data.id,
        p_user_id: data.user_id,
        p_grid_id: data.grid_id,
        p_amount: data.amount,
        p_billing_cycle: data.billing_cycle,
        p_stripe_subscription_id: data.stripe_subscription_id,
        p_status: data.status,
        p_next_billing_date: data.next_billing_date,
        p_current_period_start: data.current_period_start,
        p_current_period_end: data.current_period_end || data.next_billing_date // Fallback to next_billing_date
      });
    
    if (error) throw error;
    
    return result as Subscription;
  } catch (error) {
    console.error('Error creating/updating subscription:', error);
    throw error;
  }
}; 