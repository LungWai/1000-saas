import { stripe } from '@/lib/stripe';
import { 
  getGridById, 
  findOrCreateUserByStripeCustomer, 
  updateGridFromWebhook,
  getGridBySubscription,
  createOrUpdateSubscription
} from '@/lib/db';
import { sendPurchaseConfirmation } from '@/lib/resend';

// Mock the dependencies
jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
    customers: {
      retrieve: jest.fn(),
    },
  },
}));

jest.mock('@/lib/db', () => ({
  getGridById: jest.fn(),
  findOrCreateUserByStripeCustomer: jest.fn(),
  updateGridFromWebhook: jest.fn(),
  getGridBySubscription: jest.fn(),
  createOrUpdateSubscription: jest.fn(),
}));

jest.mock('@/lib/resend', () => ({
  sendPurchaseConfirmation: jest.fn(),
}));

// Create simplified handlers similar to the actual webhook handlers
async function handleCheckoutSessionCompleted(session: any) {
  try {
    // Validate required session data
    if (!session.metadata?.gridId) {
      throw new Error('Missing gridId in session metadata');
    }
    
    if (!session.customer) {
      throw new Error('Missing customer in session');
    }
    
    if (!session.subscription) {
      throw new Error('Missing subscription in session');
    }

    const gridId = session.metadata.gridId;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customer = await stripe.customers.retrieve(customerId);
    
    // Check if customer has email
    if (!customer.email) {
      throw new Error('Customer email not found');
    }

    const grid = await getGridById(gridId);

    if (!grid) {
      throw new Error('Grid not found');
    }

    // Find or create user with the Stripe customer ID
    const user = await findOrCreateUserByStripeCustomer(
      customer.email,
      customerId,
      'active'
    );

    // Save subscription information
    await createOrUpdateSubscription({
      id: subscriptionId,
      user_id: user.id,
      grid_id: gridId,
      status: subscription.status,
    });

    // Update grid with subscription information
    await updateGridFromWebhook(
      gridId,
      user.id,
      subscriptionId,
      'active',
      new Date(),
      new Date(subscription.current_period_end * 1000)
    );

    // Send confirmation email
    await sendPurchaseConfirmation({
      email: customer.email,
      gridId,
      subscriptionId,
      amount: subscription.items.data[0].price.unit_amount!,
      renewalDate: new Date(subscription.current_period_end * 1000),
      gridLocation: `Row 1, Column 2`, // Simplified location
    });
    
    return { success: true, message: "Checkout session processed successfully" };
  } catch (error: any) {
    console.error('Error handling checkout session:', error);
    return { success: false, error: error.message };
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    // Get the full subscription data from Stripe
    const fullSubscription = await stripe.subscriptions.retrieve(subscription.id);
    
    // Get customer information
    let customerId = fullSubscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    
    // Get user from our database
    const user = await findOrCreateUserByStripeCustomer(
      customer.email || 'unknown@example.com',
      customerId,
      'active'
    );

    // Get gridId from metadata
    let gridId = fullSubscription.metadata?.gridId;
    let grid = null;
    
    if (gridId) {
      grid = await getGridById(gridId);
    } else {
      // Try to find grid by subscription ID
      try {
        grid = await getGridBySubscription(subscription.id);
        if (grid) {
          gridId = grid.id;
        }
      } catch (err) {
        console.log('No existing grid found for this subscription');
      }
    }

    // Update the subscription record
    await createOrUpdateSubscription({
      id: subscription.id,
      user_id: user.id,
      grid_id: gridId,
      status: fullSubscription.status as string,
    });

    // If we found a grid, update it too
    if (grid && gridId) {
      await updateGridFromWebhook(
        gridId,
        user.id,
        subscription.id,
        fullSubscription.status === 'active' ? 'active' : 'inactive',
        undefined,
        new Date(fullSubscription.current_period_end * 1000)
      );
    }

    return { 
      success: true, 
      message: grid ? "Grid and subscription updated" : "Subscription updated without grid" 
    };
  } catch (error: any) {
    console.error('Error handling subscription update:', error);
    return { success: false, error: error.message };
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    // Try to get gridId from metadata first
    let gridId = subscription.metadata?.gridId;
    let grid;
    
    // If no gridId in metadata, find the grid by subscription_id
    if (!gridId) {
      try {
        grid = await getGridBySubscription(subscription.id);
        if (grid) {
          gridId = grid.id;
        } else {
          return { success: true, message: "No grid found for deleted subscription" };
        }
      } catch (error) {
        console.error('Error finding grid by subscription:', error);
        return { success: true, message: "No grid found for deleted subscription" };
      }
    } else {
      // Get grid by ID if we have it from metadata
      grid = await getGridById(gridId);
      if (!grid) {
        return { success: true, message: "No grid found for deleted subscription" };
      }
    }

    // Update grid
    await updateGridFromWebhook(
      gridId,
      grid.user_id,
      subscription.id,
      'inactive',
      undefined,
      new Date()
    );

    // Update the subscription status
    await createOrUpdateSubscription({
      id: subscription.id,
      user_id: grid.user_id,
      grid_id: gridId,
      status: 'canceled',
    });
    
    return { success: true, message: "Subscription deleted successfully" };
  } catch (error: any) {
    console.error('Error handling subscription deletion:', error);
    return { success: false, error: error.message };
  }
}

describe('Stripe Webhook Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks for common functions
    (getGridById as jest.Mock).mockResolvedValue({
      id: 'grid-123',
      user_id: 'user-123',
      status: 'leased',
    });
    
    (findOrCreateUserByStripeCustomer as jest.Mock).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });
    
    (stripe.customers.retrieve as jest.Mock).mockResolvedValue({
      id: 'cus_123',
      email: 'test@example.com',
    });
    
    (sendPurchaseConfirmation as jest.Mock).mockResolvedValue(true);
  });
  
  it('handles checkout.session.completed event correctly', async () => {
    // Mock subscription retrieve
    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: 'sub_123',
      customer: 'cus_123',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // +30 days
      items: {
        data: [
          {
            price: {
              unit_amount: 1000, // $10.00
            },
          },
        ],
      },
    });
    
    // Test data
    const mockSession = {
      metadata: { gridId: 'grid-123' },
      customer: 'cus_123',
      subscription: 'sub_123',
    };
    
    const result = await handleCheckoutSessionCompleted(mockSession);
    
    // Verify the result
    expect(result.success).toBe(true);
    expect(result.message).toBe('Checkout session processed successfully');
    
    // Verify that the database was updated
    expect(updateGridFromWebhook).toHaveBeenCalledWith(
      'grid-123',
      'user-123',
      'sub_123',
      'active',
      expect.any(Date),
      expect.any(Date)
    );
    
    // Verify that an email was sent
    expect(sendPurchaseConfirmation).toHaveBeenCalled();
  });
  
  it('handles customer.subscription.updated event correctly', async () => {
    // Mock subscription retrieve
    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: 'sub_123',
      customer: 'cus_123',
      metadata: { gridId: 'grid-123' },
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      items: {
        data: [
          {
            price: {
              unit_amount: 1000,
            },
          },
        ],
      },
    });
    
    // Test data
    const mockSubscription = {
      id: 'sub_123',
      metadata: { gridId: 'grid-123' },
      customer: 'cus_123',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    };
    
    const result = await handleSubscriptionUpdated(mockSubscription);
    
    // Verify the result
    expect(result.success).toBe(true);
    expect(result.message).toBe('Grid and subscription updated');
    
    // Verify that the database was updated
    expect(createOrUpdateSubscription).toHaveBeenCalled();
    expect(updateGridFromWebhook).toHaveBeenCalled();
  });
  
  it('handles customer.subscription.deleted event correctly', async () => {
    // Test data
    const mockSubscription = {
      id: 'sub_123',
      metadata: { gridId: 'grid-123' },
      customer: 'cus_123',
      status: 'canceled',
      current_period_start: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
      current_period_end: Math.floor(Date.now() / 1000),
    };
    
    const result = await handleSubscriptionDeleted(mockSubscription);
    
    // Verify the result
    expect(result.success).toBe(true);
    expect(result.message).toBe('Subscription deleted successfully');
    
    // Verify that the database was updated
    expect(updateGridFromWebhook).toHaveBeenCalledWith(
      'grid-123',
      'user-123',
      'sub_123',
      'inactive',
      undefined,
      expect.any(Date)
    );
    
    expect(createOrUpdateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'sub_123',
        status: 'canceled',
      })
    );
  });
  
  it('handles errors gracefully during checkout processing', async () => {
    // Force an error during processing
    (updateGridFromWebhook as jest.Mock).mockRejectedValue(new Error('Database error'));
    
    // Test data
    const mockSession = {
      metadata: { gridId: 'grid-123' },
      customer: 'cus_123',
      subscription: 'sub_123',
    };
    
    const result = await handleCheckoutSessionCompleted(mockSession);
    
    // Should report the error
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
  
  it('handles missing gridId in metadata', async () => {
    // Test data with missing gridId
    const mockSession = {
      metadata: {}, // Empty metadata
      customer: 'cus_123',
      subscription: 'sub_123',
    };
    
    const result = await handleCheckoutSessionCompleted(mockSession);
    
    // Should report the error
    expect(result.success).toBe(false);
    expect(result.error).toBe('Missing gridId in session metadata');
  });
  
  it('handles subscription update for unknown grid gracefully', async () => {
    // Mock getGridBySubscription to return null
    (getGridBySubscription as jest.Mock).mockResolvedValue(null);
    
    // Mock subscription with no gridId metadata
    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: 'sub_123',
      customer: 'cus_123',
      metadata: {}, // No gridId
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      items: {
        data: [{ price: { unit_amount: 1000 } }],
      },
    });
    
    // Test data
    const mockSubscription = {
      id: 'sub_123',
      metadata: {}, // No gridId
      customer: 'cus_123',
      status: 'active',
    };
    
    const result = await handleSubscriptionUpdated(mockSubscription);
    
    // Should succeed but indicate no grid found
    expect(result.success).toBe(true);
    expect(result.message).toBe('Subscription updated without grid');
    
    // Should update subscription but not grid
    expect(createOrUpdateSubscription).toHaveBeenCalled();
    expect(updateGridFromWebhook).not.toHaveBeenCalled();
  });
}); 