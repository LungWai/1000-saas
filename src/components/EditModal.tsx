'use client';

import React, { useState } from 'react';
import { EditAccess, EditModalProps } from '@/types';

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [credentials, setCredentials] = useState<EditAccess>({
    subscriptionId: '',
    email: '',
    gridId: '',
  });

  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit(credentials);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify credentials');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Verify Edit Access</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="subscriptionId" className="block text-sm font-medium text-gray-700">
              Subscription ID
            </label>
            <input
              type="text"
              id="subscriptionId"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={credentials.subscriptionId}
              onChange={(e) => setCredentials(prev => ({ ...prev, subscriptionId: e.target.value }))}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Purchase Email
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify & Edit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal; 