import { supabase } from './supabase';
import { Grid, User, Subscription } from '@/types';
import { captureException } from './sentry';

export const getGrids = async (page = 1, limit = 50) => {
  try {
    const { data, error, count } = await supabase
      .from('grids')
      .select('*', { count: 'exact' })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return { grids: data as Grid[], total: count || 0 };
  } catch (error) {
    captureException(error as Error);
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
    captureException(error as Error);
    throw error;
  }
};

export const updateGridContent = async (
  id: string,
  customerId: string,
  updates: Partial<Grid>
) => {
  try {
    const { data, error } = await supabase
      .from('grids')
      .update(updates)
      .eq('id', id)
      .eq('user_id', customerId)
      .select()
      .single();

    if (error) throw error;

    return data as Grid;
  } catch (error) {
    captureException(error as Error);
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
    captureException(error as Error);
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
    captureException(error as Error);
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
    captureException(error as Error);
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
    captureException(error as Error);
    throw error;
  }
}; 