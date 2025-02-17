import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const getStripeSession = async (priceId: string, customerId: string, gridId: string) => {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/grid/${gridId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/grid/${gridId}`,
    metadata: {
      gridId,
    },
  });

  return session;
};

export const createCustomer = async (email: string) => {
  const customer = await stripe.customers.create({
    email,
  });

  return customer;
}; 