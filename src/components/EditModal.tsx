'use client';

import React, { useState, useEffect } from 'react';
import { EditAccess, EditModalProps, Grid } from '@/types';
import { useTheme } from '@/lib/ThemeProvider';
import { useToast } from "@/components/ui/use-toast";
import GridContentEditor from '@/components/GridContentEditor';

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  gridId
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { toast } = useToast(); // Use shadcn toast hook
  
  const [credentials, setCredentials] = useState<EditAccess>({
    subscriptionId: '',
    email: '',
    gridId: gridId || '',
  });

  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [gridData, setGridData] = useState<Grid | null>(null);

  // Update gridId in credentials when prop changes
  useEffect(() => {
    if (gridId) {
      setCredentials(prev => ({ ...prev, gridId }));
    }
  }, [gridId]);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // First verify the credentials
      const verifyResponse = await fetch(`/api/grids/verify-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: credentials.subscriptionId,
          email: credentials.email,
          gridId: credentials.gridId
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Failed to verify credentials');
      }

      // After verification succeeds, then fetch grid data
      try {
        // Use a string literal for the gridId to avoid API route issues
        const gridResponse = await fetch(`/api/grids/${credentials.gridId || gridId}/data`);
        
        if (!gridResponse.ok) {
          throw new Error('Failed to fetch grid data');
        }
        
        const gridResult = await gridResponse.json();
        const grid = gridResult.grid;
        
        // Set the grid data
        setGridData(grid);
        
        // Mark as verified - will show the content editor
        setIsVerified(true);
        
        // Show verification success toast
        toast({
          title: "Verification successful",
          description: `You are the verified Grid ${credentials.gridId || gridId} owner!`,
          variant: "success",
        });
      } catch (fetchError) {
        console.error('Error fetching grid:', fetchError);
        // Even if we can't get grid data, we can still show the editor with empty data
        setIsVerified(true);
        toast({
          title: "Verification successful",
          description: "Verified, but couldn't load existing content",
          variant: "warning",
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to verify credentials';
      setError(errorMsg);
      toast({
        title: "Verification failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentSave = async (updates: Partial<Grid>) => {
    setError('');
    setIsLoading(true);

    try {
      // Add credentials to the content update
      const data = {
        ...credentials,
        ...updates
      };
      
      await onSubmit(data);
      toast({
        title: "Success",
        description: "Grid content updated successfully!",
        variant: "success",
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update content');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update content',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div 
        className={`rounded-lg p-6 w-full max-w-3xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
        style={{ 
          boxShadow: isDarkMode ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
        }}
      >
        {!isVerified ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Verify Grid Ownership</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              Please enter your ID and email to verify your grid ownership.
            </p>
            
            <form onSubmit={handleVerification} className="space-y-4">
              <div>
                <label htmlFor="subscriptionId" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Subscription or Customer ID
                </label>
                <input
                  type="text"
                  id="subscriptionId"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  value={credentials.subscriptionId}
                  onChange={(e) => setCredentials(prev => ({ ...prev, subscriptionId: e.target.value }))}
                  required
                />
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Enter your Subscription ID (starts with "sub_") or Customer ID (starts with "cus_"). 
                  This information was sent to your email after purchase.
                </p>
              </div>

              <div>
                <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Purchase Email
                </label>
                <input
                  type="email"
                  id="email"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  The email address you used during purchase.
                </p>
              </div>

              {/* Grid ID field is hidden but still included in form submission */}
              <input type="hidden" value={credentials.gridId} />

              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    isLoading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isLoading ? 'Verifying...' : 'Verify & Edit'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Edit Grid Content</h2>
              <div className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-green-700' : 'bg-green-100'} ${isDarkMode ? 'text-green-100' : 'text-green-700'}`}>
                Verified ✓
              </div>
            </div>
            
            {gridData && (
              <div className="space-y-4">
                <GridContentEditor 
                  grid={gridData}
                  onSave={handleContentSave}
                />
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EditModal; 