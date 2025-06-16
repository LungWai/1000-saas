import { NextRequest } from 'next/server';
import { GET, POST, PUT } from '../grids/[id]/content/route';
import { GET as getVerifyAccess } from '../grids/verify-access/route';
import { createClient } from '@supabase/supabase-js';

// Mock supabase
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    data: null,
    error: null,
  }));
  
  return {
    createClient: jest.fn(() => ({
      from: mockFrom,
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
    })),
  };
});

// Mock stripe
jest.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptions: {
      retrieve: jest.fn().mockResolvedValue({
        status: 'active',
        customer: 'cus_123',
      }),
    },
    customers: {
      retrieve: jest.fn().mockResolvedValue({
        email: 'test@example.com',
      }),
    },
  },
}));

describe('Grid API Routes', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      data: null,
      error: null,
    })),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockReturnThis(),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.jpg' } }),
      }),
    },
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('GET /api/grids/[id]/content', () => {
    it('returns 404 when grid not found', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Resource not found' },
      });
      
      const req = new NextRequest('http://localhost/api/grids/123/content');
      const context = { params: { id: '123' } };
      
      const response = await GET(req, context);
      
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Grid not found' });
    });

    it('returns grid content when found', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: {
          id: '123',
          content: 'Test content',
          status: 'leased',
          imageUrl: 'https://test.com/image.jpg',
        },
        error: null,
      });
      
      const req = new NextRequest('http://localhost/api/grids/123/content');
      const context = { params: { id: '123' } };
      
      const response = await GET(req, context);
      
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        id: '123',
        content: 'Test content',
        status: 'leased',
        imageUrl: 'https://test.com/image.jpg',
      });
    });

    it('handles database errors', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      });
      
      const req = new NextRequest('http://localhost/api/grids/123/content');
      const context = { params: { id: '123' } };
      
      const response = await GET(req, context);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Failed to fetch grid content' });
    });
  });

  describe('PUT /api/grids/[id]/content', () => {
    it('returns 400 when missing required fields', async () => {
      const req = new NextRequest('http://localhost/api/grids/123/content', {
        method: 'PUT',
        body: JSON.stringify({ content: 'New content' }), // Missing subscriptionId and email
      });
      const context = { params: { id: '123' } };
      
      const response = await PUT(req, context);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Missing required fields' });
    });

    it('returns 403 when subscription verification fails', async () => {
      const stripeModule = require('@/lib/stripe');
      stripeModule.stripe.subscriptions.retrieve.mockRejectedValueOnce(
        new Error('Invalid subscription')
      );
      
      const req = new NextRequest('http://localhost/api/grids/123/content', {
        method: 'PUT',
        body: JSON.stringify({
          content: 'New content',
          subscriptionId: 'sub_123',
          email: 'test@example.com',
        }),
      });
      const context = { params: { id: '123' } };
      
      const response = await PUT(req, context);
      
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'Invalid subscription' });
    });

    it('returns 403 when email verification fails', async () => {
      const stripeModule = require('@/lib/stripe');
      stripeModule.stripe.customers.retrieve.mockResolvedValueOnce({
        email: 'different@example.com', // Different from the provided email
      });
      
      const req = new NextRequest('http://localhost/api/grids/123/content', {
        method: 'PUT',
        body: JSON.stringify({
          content: 'New content',
          subscriptionId: 'sub_123',
          email: 'test@example.com',
        }),
      });
      const context = { params: { id: '123' } };
      
      const response = await PUT(req, context);
      
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'Email verification failed' });
    });

    it('returns 200 when content update succeeds', async () => {
      // Mock the stripe functions for success
      const stripeModule = require('@/lib/stripe');
      stripeModule.stripe.subscriptions.retrieve.mockResolvedValueOnce({
        status: 'active',
        customer: 'cus_123',
      });
      stripeModule.stripe.customers.retrieve.mockResolvedValueOnce({
        email: 'test@example.com',
      });
      
      // Mock supabase update for success
      mockSupabase.from().update.mockReturnThis();
      mockSupabase.from().update().eq.mockReturnThis();
      mockSupabase.from().update().eq.mockResolvedValue({
        data: { id: '123', content: 'New content' },
        error: null,
      });
      
      const req = new NextRequest('http://localhost/api/grids/123/content', {
        method: 'PUT',
        body: JSON.stringify({
          content: 'New content',
          subscriptionId: 'sub_123',
          email: 'test@example.com',
        }),
      });
      const context = { params: { id: '123' } };
      
      const response = await PUT(req, context);
      
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
    });

    it('handles database update errors', async () => {
      // Mock the stripe functions for success
      const stripeModule = require('@/lib/stripe');
      stripeModule.stripe.subscriptions.retrieve.mockResolvedValueOnce({
        status: 'active',
        customer: 'cus_123',
      });
      stripeModule.stripe.customers.retrieve.mockResolvedValueOnce({
        email: 'test@example.com',
      });
      
      // Mock supabase update for failure
      mockSupabase.from().update.mockReturnThis();
      mockSupabase.from().update().eq.mockReturnThis();
      mockSupabase.from().update().eq.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      
      const req = new NextRequest('http://localhost/api/grids/123/content', {
        method: 'PUT',
        body: JSON.stringify({
          content: 'New content',
          subscriptionId: 'sub_123',
          email: 'test@example.com',
        }),
      });
      const context = { params: { id: '123' } };
      
      const response = await PUT(req, context);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Failed to update grid content' });
    });
  });

  describe('GET /api/grids/verify-access', () => {
    it('returns 400 when missing required parameters', async () => {
      const req = new NextRequest('http://localhost/api/grids/verify-access?gridId=123');
      // Missing subscriptionId
      
      const response = await getVerifyAccess(req);
      
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Missing required parameters' });
    });

    it('returns 403 when subscription is invalid', async () => {
      const stripeModule = require('@/lib/stripe');
      stripeModule.stripe.subscriptions.retrieve.mockRejectedValueOnce(
        new Error('Invalid subscription')
      );
      
      const req = new NextRequest(
        'http://localhost/api/grids/verify-access?gridId=123&subscriptionId=sub_123'
      );
      
      const response = await getVerifyAccess(req);
      
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'Invalid subscription' });
    });

    it('returns 200 when subscription is valid and user has access to the grid', async () => {
      // Mock the stripe functions for success
      const stripeModule = require('@/lib/stripe');
      stripeModule.stripe.subscriptions.retrieve.mockResolvedValueOnce({
        status: 'active',
        customer: 'cus_123',
        metadata: { gridId: '123' },
      });
      
      const req = new NextRequest(
        'http://localhost/api/grids/verify-access?gridId=123&subscriptionId=sub_123'
      );
      
      const response = await getVerifyAccess(req);
      
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ hasAccess: true });
    });
    
    it('returns 403 when subscription is valid but user does not have access to the grid', async () => {
      // Mock the stripe functions for success with different gridId
      const stripeModule = require('@/lib/stripe');
      stripeModule.stripe.subscriptions.retrieve.mockResolvedValueOnce({
        status: 'active',
        customer: 'cus_123',
        metadata: { gridId: '456' }, // Different grid ID
      });
      
      const req = new NextRequest(
        'http://localhost/api/grids/verify-access?gridId=123&subscriptionId=sub_123'
      );
      
      const response = await getVerifyAccess(req);
      
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ hasAccess: false });
    });
  });
}); 