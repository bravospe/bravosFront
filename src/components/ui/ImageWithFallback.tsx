import { useState, useCallback } from 'react';
import { ImageOff, Package } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: 'image' | 'package';
  fallbackClassName?: string;
}

/**
 * Image component with graceful error handling and fallback placeholder.
 * Shows a placeholder icon when image fails to load or src is empty.
 */
export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackIcon = 'image',
  fallbackClassName = '',
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Show fallback if no src or if error occurred
  if (!src || hasError) {
    const FallbackIcon = fallbackIcon === 'package' ? Package : ImageOff;
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-card ${fallbackClassName || className}`}
        title={alt}
      >
        <FallbackIcon className="w-1/3 h-1/3 text-gray-400 dark:text-gray-600" />
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`flex items-center justify-center bg-gray-100 dark:bg-card animate-pulse ${className}`}>
          <div className="w-1/3 h-1/3 bg-gray-200 dark:bg-[#1E2230] rounded" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </>
  );
}
