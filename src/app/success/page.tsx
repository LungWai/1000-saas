'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import EditModal from '@/components/EditModal';
import { getGridById } from '@/lib/db';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const gridId = searchParams.get('grid_id');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have both session ID and grid ID, show the edit modal automatically
    if (sessionId && gridId) {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        setIsEditModalOpen(true);
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [sessionId, gridId]);

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    // Redirect to home after editing
    router.push('/');
  };

  const handleEditModalSubmit = async (data: any) => {
    try {
      // Submit the edit data
      const response = await fetch(`/api/grids/${gridId}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update grid content');
      }

      // Close modal and redirect
      setIsEditModalOpen(false);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="rounded-full bg-green-100 p-3 mx-auto w-16 h-16 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Payment Successful!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Thank you for your purchase. Your grid space has been reserved.
          {isLoading ? ' Opening editor...' : ''}
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="mt-5">
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Return Home
          </a>
        </div>
      </div>
      
      {/* Edit Modal */}
      {isEditModalOpen && gridId && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          onSubmit={handleEditModalSubmit}
          gridId={gridId}
        />
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
} 