// src/components/common/OptimizedImage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { classNames } from '../../utils/helpers';
import { PRODUCT_IMAGE_PLACEHOLDER, API_BASE_URL } from '../../utils/constants';
// import logger from '../../utils/logger'; // Optional for debugging

const OptimizedImage = ({
  src, // Expects a server-relative path like /uploads/products/image.jpg or null/undefined
  alt,
  className = '',
  containerClassName = 'position-relative overflow-hidden',
  placeholderSrc = PRODUCT_IMAGE_PLACEHOLDER, // This should be a direct public path like /images/placeholder.webp
  aspectRatio = 'ratio-1x1', // Bootstrap ratio class
  objectFit = 'object-fit-cover', // Bootstrap object-fit class
  onLoad,
  onError,
  lazyLoad = true,
  threshold = 0.01, // Adjusted threshold slightly
  ...rest
}) => {
  // currentImageToLoad will store the full URL (with API_BASE_URL) or the placeholder path
  const [currentImageToLoad, setCurrentImageToLoad] = useState(() => {
    if (!lazyLoad && src) return `${API_BASE_URL}${src}`;
    return placeholderSrc;
  });
  const [imageActuallyLoaded, setImageActuallyLoaded] = useState(!lazyLoad && !!src);
  const [loadError, setLoadError] = useState(false);

  const imgRef = useRef(null);
  const containerRef = useRef(null); // For IntersectionObserver

  const prevSrcProp = useRef(src);

  const handleImageLoadSuccess = useCallback((event) => {
    setImageActuallyLoaded(true);
    setLoadError(false);
    if (onLoad) {
      onLoad(event);
    }
    // logger.debug(`OptimizedImage: Loaded ${currentImageToLoad}`);
  }, [onLoad]); // Removed currentImageToLoad to prevent re-creation if it's complex

  const handleImageLoadError = useCallback(() => {
    // logger.warn(`OptimizedImage: Error loading ${currentImageToLoad}. Falling back to placeholder.`);
    setLoadError(true);
    setImageActuallyLoaded(true); // Still "loaded" but with placeholder
    setCurrentImageToLoad(placeholderSrc); // Set to placeholder
    if (onError) {
      onError();
    }
  }, [onError, placeholderSrc]); // Removed currentImageToLoad

  // Effect to handle changes in the `src` prop
  useEffect(() => {
    if (prevSrcProp.current === src) {
      // logger.debug("OptimizedImage: src prop hasn't changed, skipping direct src update effect.", src);
      return; // src prop hasn't changed, no need to do anything here
    }
    // logger.debug(`OptimizedImage: src prop changed from "${prevSrcProp.current}" to "${src}".`);
    prevSrcProp.current = src;
    setImageActuallyLoaded(false); // Reset loaded state for the new image
    setLoadError(false);           // Reset error state

    if (!lazyLoad) {
      setCurrentImageToLoad(src ? `${API_BASE_URL}${src}` : placeholderSrc);
    } else {
      // If lazy loading, set to placeholder initially.
      // The IntersectionObserver effect will handle loading the new 'src' when visible.
      setCurrentImageToLoad(placeholderSrc);
      // The IntersectionObserver logic in the next useEffect will re-evaluate
      // because 'src' is a dependency there.
    }
  }, [src, lazyLoad, placeholderSrc, API_BASE_URL]);


  // Effect for IntersectionObserver (lazy loading)
  useEffect(() => {
    if (!lazyLoad) {
        // If not lazy loading, and src is already set (e.g. by above effect), just return
        if (src && currentImageToLoad === `${API_BASE_URL}${src}` && imageActuallyLoaded && !loadError) return;
        // If not lazy loading and src prop is set, ensure it's loaded
        if (src && currentImageToLoad !== `${API_BASE_URL}${src}`) {
            setCurrentImageToLoad(`${API_BASE_URL}${src}`);
            setImageActuallyLoaded(false); // Trigger loading state
            setLoadError(false);
        }
        return;
    }

    if (!containerRef.current) return;
     // If already loaded the correct image or placeholder after error, no need to observe again
    if (imageActuallyLoaded && ((!loadError && currentImageToLoad === `${API_BASE_URL}${src}`) || (loadError && currentImageToLoad === placeholderSrc))) {
      return;
    }


    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // logger.debug(`OptimizedImage: Element is intersecting. Current src: ${src}, currentImageToLoad: ${currentImageToLoad}`);
            // Check if we need to load (image not loaded yet, or error occurred, or src changed)
            if (!imageActuallyLoaded || loadError || currentImageToLoad !== `${API_BASE_URL}${src}`) {
              setImageActuallyLoaded(false); // Set to loading
              setLoadError(false);
              setCurrentImageToLoad(src ? `${API_BASE_URL}${src}` : placeholderSrc);
            }
            if (containerRef.current) { // Double check ref before unobserving
                 observer.unobserve(containerRef.current);
            }
          }
        });
      },
      { threshold, rootMargin: '0px' } // Use threshold from props
    );

    observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) { // Double check ref before unobserving
         observer.unobserve(containerRef.current);
      }
    };
  }, [lazyLoad, src, threshold, API_BASE_URL, imageActuallyLoaded, loadError, currentImageToLoad, placeholderSrc]); // Added dependencies

  const displayPlaceholder = !imageActuallyLoaded || loadError;

  const finalContainerClasses = classNames(
    containerClassName,
    aspectRatio ? 'ratio' : '',
    aspectRatio || '',
    'bg-light' // Bootstrap class for light background
  );

  const imageElementClasses = classNames(
    "position-absolute top-0 start-0 w-100 h-100",
    objectFit,
    // Opacity transition for smooth appearance
    imageActuallyLoaded && !loadError ? 'opacity-100' : 'opacity-0',
    'transition-opacity duration-300 ease-in-out', // Manual Tailwind-like classes
    className
  );

  const placeholderElementClasses = classNames(
    "position-absolute top-0 start-0 w-100 h-100",
    objectFit, // Apply object-fit to placeholder too
    "opacity-50" // Make placeholder slightly muted
  );

  return (
    <div ref={containerRef} className={finalContainerClasses}>
      {displayPlaceholder && (
        <img
          src={placeholderSrc}
          alt={alt ? `${alt} (placeholder)` : "Loading image..."}
          className={placeholderElementClasses}
        />
      )}
      <img
        ref={imgRef}
        src={currentImageToLoad} // This will be the actual image URL or placeholder if error/not loaded
        alt={alt || ''}
        onLoad={handleImageLoadSuccess}
        onError={handleImageLoadError}
        className={imageElementClasses}
        // Native lazy loading can be a fallback or primary if IntersectionObserver is not used
        loading={lazyLoad && typeof IntersectionObserver === 'undefined' ? "lazy" : "eager"}
        {...rest}
      />
    </div>
  );
};

export default OptimizedImage;
