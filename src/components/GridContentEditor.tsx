import { useState } from 'react';
import { Grid, ContentEditorProps } from '@/types';
import { CONTENT_LIMITS } from '@/lib/constants';

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setLoading(true);

      const isValid = await validateImage(file);
      if (!isValid) {
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('gridId', grid.id.toString());

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await response.json();
      setImageUrl(url);
      await onSave({ image_url: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setLoading(false);
    }
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

      await onSave({
        title,
        description,
        external_url: externalUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">
            {title.length}/{CONTENT_LIMITS.TEXT.TITLE_MAX_LENGTH} characters
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH}
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">
            {description.length}/{CONTENT_LIMITS.TEXT.DESCRIPTION_MAX_LENGTH} characters
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor="image"
          className="block text-sm font-medium text-gray-700"
        >
          Image
        </label>
        <div className="mt-1">
          <input
            type="file"
            id="image"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <p className="mt-1 text-sm text-gray-500">
            Max size: {CONTENT_LIMITS.IMAGE.MAX_SIZE_MB}MB. Supported formats: JPG, PNG, GIF
          </p>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Grid content"
              className="mt-2 h-32 w-32 object-cover rounded-md"
            />
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="externalUrl"
          className="block text-sm font-medium text-gray-700"
        >
          External URL
        </label>
        <div className="mt-1">
          <input
            type="url"
            id="externalUrl"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            pattern="https://.*"
            placeholder="https://"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">
            Must start with https://
          </p>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
} 