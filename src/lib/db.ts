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
  customerId: string,
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
      .eq('customer_id', customerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating grid URL:', error);
    throw error;
  }
}; 