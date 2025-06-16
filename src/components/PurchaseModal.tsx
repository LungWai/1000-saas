"use client"

import type React from 'react';
import { useState, useEffect } from 'react';
import { PurchaseModalProps } from '@/types';
import { PRICING } from '@/lib/constants';
import { useTheme } from '@/lib/ThemeProvider';

export default function PurchaseModal({
  gridId,
  price,
  onClose,
  onCheckout,
  gridTitle,
}: Omit<PurchaseModalProps, 'isOpen'>) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showEditInfo, setShowEditInfo] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Add modal-open class to body when modal is mounted
    document.body.classList.add('modal-open');
    
    // Remove modal-open class when component unmounts
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    console.log('PurchaseModal: Form submitted', { gridId, email, billingCycle });

    try {
      console.log('PurchaseModal: Sending request to create checkout session');
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
      console.log('PurchaseModal: Received response', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Call onCheckout if provided
      if (onCheckout) {
        onCheckout();
      }

      // Redirect to Stripe checkout
      console.log('PurchaseModal: Redirecting to', data.sessionUrl);
      window.location.href = data.sessionUrl;
    } catch (err) {
      console.error('PurchaseModal: Error during checkout', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    // Ensure price is treated as a number
    const basePrice = Number(price);
    return billingCycle === 'yearly' 
      ? basePrice * 12 * 0.85 // 15% yearly discount
      : billingCycle === 'quarterly'
      ? basePrice * 3 * 0.95 // 5% quarterly discount
      : basePrice;
  };

  const isDarkMode = theme === 'dark';

  // Display title with fallback to ID
  const displayTitle = gridTitle || `Grid Space #${gridId}`;

  return (
    <div className="purchase-modal-overlay">
      <div className="purchase-modal bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Lease {displayTitle}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Billing Cycle
            </label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="monthly"
                  checked={billingCycle === 'monthly'}
                  onChange={(e) => setBillingCycle(e.target.value as 'monthly')}
                  className="mr-2 text-primary"
                />
                <span className="text-gray-900 dark:text-gray-100">Monthly (${price.toFixed(2)}/month)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="quarterly"
                  checked={billingCycle === 'quarterly'}
                  onChange={(e) => setBillingCycle(e.target.value as 'quarterly')}
                  className="mr-2 text-primary"
                />
                <span className="text-gray-900 dark:text-gray-100">Quarterly (${(price * 3 * 0.95).toFixed(2)}/quarter - Save 5%)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="yearly"
                  checked={billingCycle === 'yearly'}
                  onChange={(e) => setBillingCycle(e.target.value as 'yearly')}
                  className="mr-2 text-primary"
                />
                <span className="text-gray-900 dark:text-gray-100">Yearly (${(price * 12 * 0.85).toFixed(2)}/year - Save 15%)</span>
              </label>
            </div>
          </div>
          
          {/* Collapsible section about editing capabilities */}
          <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-200 dark:border-gray-600">
            <button
              type="button"
              className="flex justify-between items-center w-full text-left text-sm font-medium text-gray-900 dark:text-gray-100"
              onClick={() => setShowEditInfo(!showEditInfo)}
            >
              <span>What can I customize after purchase?</span>
              <svg
                className={`h-5 w-5 transition-transform ${showEditInfo ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showEditInfo && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-2">After purchasing, you'll be able to customize your grid with:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Custom title (up to 50 characters)</li>
                  <li>Detailed description (up to 250 characters)</li>
                  <li>Upload images (JPG, PNG, GIF up to 2MB)</li>
                  <li>Add external URLs to your website or socials</li>
                </ul>
                <p className="mt-2">
                  You'll receive editing instructions and access details via email after purchase.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 