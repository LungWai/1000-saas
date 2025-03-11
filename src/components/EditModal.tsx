'use client';

import React, { useState, useEffect } from 'react';
import { EditAccess, EditModalProps, Grid } from '@/types';
import { useTheme } from '@/lib/ThemeProvider';
import { CONTENT_LIMITS } from '@/lib/constants';
import { useToast } from "@/components/ui/use-toast";

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
  
  // Content editing state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [contentText, setContentText] = useState('');

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
        
        // Set the content form fields with the current grid data
        setGridData(grid);
        setTitle(grid.title || '');
        setDescription(grid.description || '');
        setImageUrl(grid.image_url || '');
        setExternalUrl(grid.external_url || '');
        setContentText(grid.content || '');
        
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

  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Add credentials to the content update
      const data = {
        ...credentials,
        title,
        description,
        image_url: imageUrl,
        external_url: externalUrl,
        content: contentText
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      setIsLoading(true);

      // Validate file size (max 2MB)
      if (file.size > CONTENT_LIMITS.IMAGE.MAX_SIZE_BYTES) {
        throw new Error(`Image size must be less than ${CONTENT_LIMITS.IMAGE.MAX_SIZE_MB}MB`);
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Only JPG, PNG, and GIF images are allowed');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('gridId', gridId || '');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await response.json();
      setImageUrl(url);
      toast({
        title: "Image uploaded",
        description: "Image uploaded successfully!",
        variant: "success",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      toast({
        title: "Upload error",
        description: err instanceof Error ? err.message : 'Failed to upload image',
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
        className={`rounded-lg p-6 w-full max-w-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
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
            
            <form onSubmit={handleContentSubmit} className="space-y-5">
              {/* Title Input */}
              <div>
                <label htmlFor="title" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 bg-white'
                  } px-3 py-2 text-sm`}
                  placeholder="Enter a title for your grid"
                />
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {title.length}/{CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH} characters
                </p>
              </div>
              
              {/* Description Textarea */}
              <div>
                <label htmlFor="description" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH}
                  rows={3}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 bg-white'
                  } px-3 py-2 text-sm resize-none`}
                  placeholder="Describe your grid content"
                />
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {description.length}/{CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH} characters
                </p>
              </div>
              
              {/* Content Text */}
              <div>
                <label htmlFor="content" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Content
                </label>
                <textarea
                  id="content"
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  maxLength={CONTENT_LIMITS.TEXT.CONTENT_MAX_LENGTH}
                  rows={3}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 bg-white'
                  } px-3 py-2 text-sm resize-none`}
                  placeholder="Additional content (optional)"
                />
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {contentText.length}/{CONTENT_LIMITS.TEXT.CONTENT_MAX_LENGTH} characters
                </p>
              </div>
              
              {/* Image Upload */}
              <div>
                <label htmlFor="image" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Image
                </label>
                <div className={`mt-1 ${imageUrl ? 'flex items-center space-x-4' : ''}`}>
                  <input
                    type="file"
                    id="image"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageUpload}
                    className={`block text-sm ${
                      isDarkMode 
                        ? 'text-gray-300 file:bg-gray-700 file:text-gray-200 file:border-gray-600' 
                        : 'text-gray-500 file:bg-blue-50 file:text-blue-700 file:border-blue-100'
                    } file:text-sm file:font-medium file:py-2 file:px-4 file:rounded-md file:border-0 hover:file:bg-opacity-80 file:mr-4`}
                  />
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Grid content"
                      className="h-24 w-24 object-cover rounded-md border"
                    />
                  )}
                </div>
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Max size: {CONTENT_LIMITS.IMAGE.MAX_SIZE_MB}MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>
              
              {/* External URL */}
              <div>
                <label htmlFor="externalUrl" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  External URL
                </label>
                <input
                  type="url"
                  id="externalUrl"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  pattern="https://.*"
                  placeholder="https://"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 bg-white'
                  } px-3 py-2 text-sm`}
                />
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Must start with https://
                </p>
              </div>
              
              {error && (
                <div className={`p-3 rounded-md ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'} ${isDarkMode ? 'text-red-200' : 'text-red-500'} text-sm`}>
                  {error}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-2">
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
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    isLoading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  } transition-colors`}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EditModal; 