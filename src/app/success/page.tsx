'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import EditModal from '@/components/EditModal';
import GridContentEditor from '@/components/GridContentEditor';
import { Grid } from '@/types';
import { useToast } from "@/components/ui/use-toast";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const sessionId = searchParams.get('session_id');
  const gridId = searchParams.get('grid_id');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContentEditorOpen, setIsContentEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gridData, setGridData] = useState<Grid | null>(null);

  useEffect(() => {
    // If we have both session ID and grid ID, load the grid data
    // and show content editor directly
    if (sessionId && gridId) {
      // Fetch the grid data directly from our API
      const fetchGridData = async () => {
        try {
          const response = await fetch(`/api/grids/${gridId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch grid data');
          }
          
          const data = await response.json();
          setGridData(data.grid);
          // Show the content editor directly after purchase
          setIsContentEditorOpen(true);
          setIsLoading(false);
          
          // Show verification toast
          toast({
            title: "Subscription Active",
            description: "You can now use your subscription ID and email to verify access to this grid.",
            variant: "default",
            duration: 5000,
          });
        } catch (err) {
          console.error('Error fetching grid:', err);
          setError(err instanceof Error ? err.message : 'Failed to load grid data');
          setIsLoading(false);
        }
      };
      
      fetchGridData();
    } else {
      setIsLoading(false);
    }
  }, [sessionId, gridId, toast]);

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setIsContentEditorOpen(false);
    // Redirect to home after editing
    router.push('/');
  };

  const handleSaveContent = async (updates: Partial<Grid>) => {
    try {
      if (!gridId) {
        throw new Error('Missing grid ID');
      }
      
      // Submit content updates directly without verification
      const response = await fetch(`/api/grids/${gridId}/update-content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          sessionId  // Include session ID for server-side verification
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update grid content');
      }
      
      // Success - show confirmation and redirect
      toast({
        title: "Success",
        description: "Your grid content has been updated successfully!",
        variant: "success",
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error('Error saving content:', err);
      setError(err instanceof Error ? err.message : 'Failed to save grid content');
      // Show error to user
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'An error occurred while saving grid content',
        variant: "destructive",
      });
    }
  };

  // Fallback to original edit modal if we want to support that flow too
  const handleEditModalSubmit = async (data: any) => {
    try {
      // Submit the edit data
      const response = await fetch(`/api/grids/${gridId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Try to parse the response data
      let responseData;
      try {
        responseData = await response.json();
      } catch (err) {
        // If response can't be parsed as JSON, create default error
        responseData = { error: 'Failed to update grid content' };
      }
      
      if (!response.ok) {
        const errorMessage = responseData.error || 'Failed to update grid content';
        console.error('Grid update error:', errorMessage);
        
        // Show specific user-friendly error messages based on error type
        let userMessage = errorMessage;
        if (errorMessage.includes('Invalid credentials') || 
            errorMessage.includes('Invalid subscription ID') ||
            errorMessage.includes('Invalid ID format')) {
          userMessage = 'The ID you entered was not recognized. Please check and try again.';
        } else if (errorMessage.includes('Email does not match')) {
          userMessage = 'The email address does not match our records for this subscription.';
        } else if (errorMessage.includes('subscription is not active')) {
          userMessage = 'Your subscription is not active. Please renew to edit this grid.';
        } else if (errorMessage.includes('permission')) {
          userMessage = 'You do not have permission to edit this grid.';
        }
        
        setError(userMessage);
        throw new Error(userMessage);
      }

      // Success - close modal and redirect
      setIsEditModalOpen(false);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      // Show the error to the user
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'An error occurred while updating the grid',
        variant: "destructive",
      });
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
          {isLoading ? ' Loading editor...' : ''}
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-sm text-blue-800 font-medium">Important Information</p>
          <p className="mt-1 text-sm text-blue-600">
            Save your subscription ID and email. You'll need these to verify access to your grid in the future.
          </p>
        </div>
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
      
      {/* Content Editor Modal */}
      {isContentEditorOpen && gridData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">Customize Your Grid Space</h2>
            <GridContentEditor 
              grid={gridData}
              onSave={handleSaveContent}
            />
            <div className="mt-4 text-right">
              <button
                onClick={handleEditModalClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Original Edit Modal as fallback */}
      {isEditModalOpen && gridId && !isContentEditorOpen && (
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