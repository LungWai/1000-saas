"use client"

import React, { useState, useRef } from 'react';
import { Grid, ContentEditorProps } from '@/types';
import { CONTENT_LIMITS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GridContentEditor({
  grid,
  onSave,
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

  const uploadToSupabase = async (file: File): Promise<string> => {
    // Generate a unique file name
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${grid.id}-${timestamp}.${fileExt}`;
    const bucketName = 'grid-images';

    // Upload file to Supabase bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleImageUpload = async (file: File) => {
    try {
      setError(null);
      setLoading(true);

      const isValid = await validateImage(file);
      if (!isValid) {
        setLoading(false);
        return;
      }

      // Upload to Supabase and get public URL
      const publicUrl = await uploadToSupabase(file);
      
      // Update state with the new image URL
      setImageUrl(publicUrl);
      
      toast({
        title: "Image Uploaded",
        description: "Your image has been successfully uploaded.",
        variant: "default",
        duration: 3000,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      toast({
        title: "Upload Failed",
        description: err instanceof Error ? err.message : 'Failed to upload image',
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleImageUpload(file);
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
    await handleImageUpload(file);
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

      // Save all changes including the image URL
      await onSave({
        title,
        description,
        external_url: externalUrl,
        image_url: imageUrl,
      });
      
      toast({
        title: "Changes Saved",
        description: "Your grid information has been updated successfully.",
        variant: "default",
        duration: 3000,
      });
    } catch (err) {
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

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row md:gap-8">
        {/* Left Column - Text Fields */}
        <div className="w-full md:w-1/2 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              {title.length}/{CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH} characters
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              {description.length}/{CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH} characters
            </p>
          </div>

          <div>
            <label htmlFor="externalUrl" className="block text-sm font-medium text-gray-700">
              External URL
            </label>
            <input
              type="url"
              id="externalUrl"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              pattern="https://.*"
              placeholder="https://"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Must start with https://
            </p>
          </div>
        </div>

        {/* Right Column - Image Upload */}
        <div className="w-full md:w-1/2 mt-6 md:mt-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image
          </label>
          <div 
            className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer h-48 ${
              isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
            }`}
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
            
            {imageUrl ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Grid content"
                  className="max-h-32 max-w-full object-contain rounded-md mb-2"
                />
                <p className="text-sm text-gray-500">Click or drag to replace</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm font-medium">
                  {loading ? 'Uploading...' : 'Drag & drop or click to upload'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Max size: {CONTENT_LIMITS.IMAGE.MAX_SIZE_MB}MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>
            )}
          </div>
          
          <p className="mt-1 text-xs text-gray-500">
            Your image will be stored in a secure Supabase bucket.
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
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
} 