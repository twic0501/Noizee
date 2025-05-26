import React, { useState, useEffect, useRef, useCallback } from 'react';
import { classNames } from '../../utils/helpers';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../../utils/constants'; // Đường dẫn placeholder

const OptimizedImage = ({
  src,
  alt,
  className = '', // Classes for the <img> tag
  containerClassName = 'relative overflow-hidden', // Classes for the container div
  placeholderSrc = PRODUCT_IMAGE_PLACEHOLDER, // Default placeholder
  aspectRatio = 'aspect-square', // Tailwind aspect ratio class e.g., 'aspect-video', 'aspect-square', or null
  objectFit = 'object-cover',   // Tailwind object-fit class e.g., 'object-contain'
  onLoad,
  onError,
  lazyLoad = true,
  threshold = 0.1, // Intersection Observer threshold
  ...rest // Other img attributes like width, height (though aspect ratio is preferred)
}) => {
  const [imageSrc, setImageSrc] = useState(lazyLoad ? placeholderSrc : src);
  const [imageLoaded, setImageLoaded] = useState(!lazyLoad);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const containerRef = useRef(null); // Ref for the container for Intersection Observer

  const handleImageLoad = (e) => {
    setImageLoaded(true);
    if (onLoad) {
      onLoad(e);
    }
  };

  const handleImageError = useCallback((e) => {
    console.warn(`Failed to load image: ${src}`);
    setHasError(true);
    setImageLoaded(true); // Consider it "loaded" to stop showing placeholder/spinner
    setImageSrc(placeholderSrc); // Fallback to placeholder on error
    if (onError) {
      onError(e);
    }
  }, [src, placeholderSrc, onError]);

  useEffect(() => {
    if (!lazyLoad) {
      setImageSrc(src);
      setImageLoaded(false); // Reset loaded state to allow onload to fire
      setHasError(false);
      return;
    }

    // Lazy loading logic
    let observer;
    const currentImgRef = containerRef.current; // Use container for observing

    if (currentImgRef && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // console.log('Image in view:', src);
              setImageSrc(src); // Start loading the actual image
              setImageLoaded(false); // Reset to trigger load animation
              setHasError(false);
              observer.unobserve(currentImgRef); // Stop observing once triggered
            }
          });
        },
        { rootMargin: '0px', threshold: threshold }
      );
      observer.observe(currentImgRef);
    } else {
      // Fallback for browsers that don't support IntersectionObserver or if ref is not ready
      // console.log('IntersectionObserver not supported or ref not ready, loading image directly:', src);
      setImageSrc(src);
      setImageLoaded(false);
      setHasError(false);
    }

    return () => {
      if (observer && currentImgRef) {
        observer.unobserve(currentImgRef);
      }
    };
  }, [src, lazyLoad, threshold, placeholderSrc]); // Re-run if src or lazyLoad changes

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
    if (!lazyLoad){ // If not lazy loading, set image directly and trigger load
        setImageSrc(src);
        setImageLoaded(false);
    } else if (imageSrc !== placeholderSrc && imageSrc !== src) { // If src changed and was lazy loaded before
        setImageSrc(placeholderSrc); // Revert to placeholder for new src if lazy
        setImageLoaded(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const showPlaceholder = !imageLoaded && !hasError && imageSrc === placeholderSrc;
  const showActualImage = imageLoaded && !hasError && imageSrc !== placeholderSrc;

  return (
    <div
      ref={containerRef}
      className={classNames(
        containerClassName,
        aspectRatio,
        'bg-gray-100' // Default background for placeholder area
      )}
    >
      {/* Placeholder/Spinner while loading actual image or if error and using placeholder */}
      {(showPlaceholder || (!imageLoaded && imageSrc !== placeholderSrc && !hasError)) && (
        <img
          src={placeholderSrc}
          alt={alt ? `${alt} placeholder` : "Loading image..."}
          className={classNames(
            "absolute inset-0 w-full h-full",
            objectFit,
            "opacity-50 blur-sm" // Example placeholder style
          )}
        />
        // Or a spinner:
        // <div className="absolute inset-0 flex items-center justify-center">
        //   <LoadingSpinner size="sm" />
        // </div>
      )}

      {/* Actual Image - Rendered on top or replaces placeholder */}
      {/* We always render the img tag for src to load, but control its visibility/opacity */}
      <img
        ref={imgRef}
        src={hasError ? placeholderSrc : imageSrc} // Use placeholder if error, otherwise current imageSrc
        alt={alt || ''}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={classNames(
          "absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out",
          objectFit,
          (showActualImage || hasError) ? "opacity-100" : "opacity-0", // Fade in
          className
        )}
        loading={lazyLoad ? "lazy" : "eager"} // Native browser lazy loading as a fallback/enhancement
        {...rest}
      />
    </div>
  );
};

export default OptimizedImage;