"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Grid, ContentEditorProps } from '@/types';
import { CONTENT_LIMITS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GridContentEditor({
  grid,
  onSave,
  subscriptionId,
  email,
}: ContentEditorProps) {
  const [title, setTitle] = useState(grid.title || '');
  const [description, setDescription] = useState(grid.description || '');
  const [imageUrl, setImageUrl] = useState(grid.image_url || '');
  const [externalUrl, setExternalUrl] = useState(grid.external_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // New state for image preview and file to upload
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // Set initial preview image from grid data
  useEffect(() => {
    if (grid.image_url) {
      setPreviewImage(grid.image_url);
    }
  }, [grid.image_url]);

  const validateImage = async (file: File): Promise<boolean> => {
    // Check file size (max 2MB)
    if (file.size > CONTENT_LIMITS.IMAGE.MAX_SIZE_BYTES) {
      setError(`Image size must be less than ${CONTENT_LIMITS.IMAGE.MAX_SIZE_MB}MB`);
      return false;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG, and GIF images are allowed');
      return false;
    }

    return true;
  };

  const optimizeImage = async (file: File): Promise<File> => {
    try {
      // Create form data for the optimization API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', 'webp'); // Use WebP for better compression
      formData.append('quality', '80');
      formData.append('maxWidth', '1200');
      formData.append('maxHeight', '1200');

      // Call the optimization API
      const response = await fetch('/api/images/optimize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to optimize image');
      }

      // Get the optimized image as a blob
      const blob = await response.blob();
      
      // Create a new file from the blob
      const optimizedFile = new File(
        [blob],
        file.name.replace(/\.[^/.]+$/, '.webp'),
        { type: 'image/webp' }
      );

      return optimizedFile;
    } catch (error) {
      console.error('Error optimizing image:', error);
      // If optimization fails, return the original file
      return file;
    }
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    // Generate a unique file name
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${grid.id}-${timestamp}.${fileExt}`;
    const bucketName = 'grid-images';

    try {
      // Optimize the image before uploading
      const optimizedFile = await optimizeImage(file);
      
      // Set subscription ID in headers for storage policy verification
      const headers = subscriptionId ? {
        'x-subscription-id': subscriptionId
      } : undefined;

      // Upload the file with subscription ID in headers
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, optimizedFile, {
          cacheControl: '3600',
          upsert: false,
          ...(headers && { headers })
        });

      if (error) {
        throw new Error(`Failed to upload to Supabase: ${error.message}`);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      // Update the grid with the new image URL
      const { data: updateData, error: updateError } = await supabase
        .rpc('update_grid_content_secure', {
          p_grid_id: grid.id,
          p_title: title || null,
          p_description: description || null,
          p_external_url: externalUrl || null,
          p_image_url: publicUrl,
          p_subscription_id: subscriptionId || null,
          p_email: email || null
        });

      if (updateError) {
        throw new Error(`Failed to update grid with image URL: ${updateError.message}`);
      }

      return publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      throw err;
    }
  };

  const handleImageSelect = async (file: File) => {
    try {
      setError(null);
      
      const isValid = await validateImage(file);
      if (!isValid) {
        return;
      }
      
      // Create a local preview URL
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewImage(localPreviewUrl);
      
      // Store the file for later upload
      setFileToUpload(file);
      
      toast({
        title: "Image Selected",
        description: "Your image will be uploaded when you save changes.",
        variant: "default",
        duration: 3000,
      });
    } catch (err) {
      console.error("Image selection error:", err);
      setError(err instanceof Error ? err.message : 'Failed to select image');
      toast({
        title: "Selection Failed",
        description: err instanceof Error ? err.message : 'Failed to select image',
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleImageSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await handleImageSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate external URL
      if (externalUrl && !externalUrl.startsWith('https://')) {
        throw new Error('External URL must start with https://');
      }

      let finalImageUrl = imageUrl;
      
      // If there's a new file to upload, upload it first
      if (fileToUpload) {
        finalImageUrl = await uploadToSupabase(fileToUpload);
        // Update the image URL state with the final URL
        setImageUrl(finalImageUrl);
        // Clear the file to upload since it's been processed
        setFileToUpload(null);
      }
      
      // Call the secure function to update grid content
      const { data, error: updateError } = await supabase
        .rpc('update_grid_content_secure', {
          p_grid_id: grid.id,
          p_title: title || null,
          p_description: description || null,
          p_external_url: externalUrl || null,
          p_image_url: finalImageUrl || null,
          p_subscription_id: subscriptionId || null,
          p_email: email || null
        });

      if (updateError) {
        throw new Error(`Failed to save changes: ${updateError.message}`);
      }
      
      // Call onSave with the updated data for client-side state updates
      if (data && data.length > 0) {
        await onSave(data[0]);
      }
      
      toast({
        title: "Changes Saved",
        description: "Your grid information has been updated successfully.",
        variant: "default",
        duration: 3000,
      });
    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      toast({
        title: "Save Failed",
        description: err instanceof Error ? err.message : 'Failed to save changes',
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Clean up object URLs when component unmounts or when preview changes
  useEffect(() => {
    return () => {
      // Only revoke if it's a blob URL (not a remote URL)
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row md:gap-8">
        {/* Left Column - Text Fields */}
        <div className="w-full md:w-1/2 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {title.length}/{CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH} characters
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {description.length}/{CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH} characters
            </p>
          </div>

          <div>
            <label htmlFor="externalUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              External URL
            </label>
            <input
              type="url"
              id="externalUrl"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              pattern="https://.*"
              placeholder="https://"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must start with https://
            </p>
          </div>
        </div>

        {/* Right Column - Image Upload */}
        <div className="w-full md:w-1/2 mt-6 md:mt-0">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Image
          </label>
          <div 
            className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer h-48 ${
              isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-400'
            } bg-white dark:bg-gray-800`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="image"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {previewImage ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <img
                  src={previewImage}
                  alt="Grid content"
                  className="max-h-32 max-w-full object-contain rounded-md mb-2"
                  key={previewImage}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">Click or drag to replace</p>
                {fileToUpload && (
                  <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    New
                  </span>
                )}
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {loading ? 'Uploading...' : 'Drag & drop or click to upload'}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Max size: {CONTENT_LIMITS.IMAGE.MAX_SIZE_MB}MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>
            )}
          </div>
          
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {fileToUpload ? 'Image will be uploaded when you save changes.' : 'Your image will be stored in a secure Supabase bucket.'}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 dark:bg-indigo-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
} 