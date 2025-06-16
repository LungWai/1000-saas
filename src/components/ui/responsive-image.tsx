import React from 'react';
import Image, { ImageProps } from 'next/image';

interface ResponsiveImageProps extends Omit<ImageProps, 'src' | 'alt' | 'sizes'> {
  src: string;
  alt: string;
  aspectRatio?: string;
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  fadeIn?: boolean;
}

/**
 * A responsive image component that uses next/image with optimized defaults
 */
export function ResponsiveImage({
  src,
  alt,
  aspectRatio = '1/1',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  objectFit = 'cover',
  fadeIn = true,
  className = '',
  ...props
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  // Default blur data URL for empty images
  const defaultBlurDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  
  // Get CSS object-fit property based on prop
  const getObjectFit = () => {
    switch (objectFit) {
      case 'contain': return 'object-contain';
      case 'fill': return 'object-fill';
      case 'none': return 'object-none';
      case 'scale-down': return 'object-scale-down';
      case 'cover':
      default: return 'object-cover';
    }
  };
  
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={`${getObjectFit()} ${fadeIn ? 'transition-opacity duration-500' : ''} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        placeholder="blur"
        blurDataURL={defaultBlurDataURL}
        {...props}
      />
    </div>
  );
} 