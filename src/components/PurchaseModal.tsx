import { useState } from 'react';
import { PurchaseModalProps } from '@/types';
import { PRICING } from '@/lib/constants';

export default function PurchaseModal({
  gridId,
  price,
  isOpen,
  onClose,
  onCheckout,
}: PurchaseModalProps) {
  const [email, setEmail] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gridId,
          email,
          billingCycle,
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.sessionUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    const basePrice = price;
    return billingCycle === 'yearly' 
      ? basePrice * 12 * 0.9 // 10% yearly discount
      : billingCycle === 'quarterly'
      ? basePrice * 3 * 0.95 // 5% quarterly discount
      : basePrice;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Lease Grid Space #{gridId}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Billing Cycle
            </label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="monthly"
                  checked={billingCycle === 'monthly'}
                  onChange={(e) => setBillingCycle(e.target.value as 'monthly')}
                  className="mr-2"
                />
                Monthly (${price}/month)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="quarterly"
                  checked={billingCycle === 'quarterly'}
                  onChange={(e) => setBillingCycle(e.target.value as 'quarterly')}
                  className="mr-2"
                />
                Quarterly (${(price * 3 * 0.95).toFixed(2)}/quarter - Save 5%)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="yearly"
                  checked={billingCycle === 'yearly'}
                  onChange={(e) => setBillingCycle(e.target.value as 'yearly')}
                  className="mr-2"
                />
                Yearly (${(price * 12 * 0.9).toFixed(2)}/year - Save 10%)
              </label>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 