// src/components/common/OptimizedImage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { classNames } from '../../utils/helpers';
import { PRODUCT_IMAGE_PLACEHOLDER, API_BASE_URL } from '../../utils/constants';
// import logger from '../../utils/logger';

const OptimizedImage = ({
  src,
  alt,
  className = '', // Custom classes for the <img /> tag itself
  imageClassName = '', // Thêm prop này để truyền class riêng cho thẻ img
  containerClassName = '', // Custom classes for the container div
  aspectRatioClass = null, // Bỏ, vì parent sẽ kiểm soát aspect ratio
  objectFitClass = 'object-cover',
  onLoad,
  onError,
  lazyLoad = true,
  threshold = 0.01,
  placeholderSrcOverride = null,
  ...rest
}) => {
  const effectivePlaceholderSrc = placeholderSrcOverride || PRODUCT_IMAGE_PLACEHOLDER;

  const initialImageSrcToTry = useCallback((s) => {
    if (!s) return null;
    if (s === PRODUCT_IMAGE_PLACEHOLDER || (placeholderSrcOverride && s === placeholderSrcOverride)) {
        return s;
    }
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) {
      return s;
    }
    return `${API_BASE_URL}${s.startsWith('/') ? s : `/${s}`}`;
  }, [API_BASE_URL, placeholderSrcOverride, PRODUCT_IMAGE_PLACEHOLDER]);

  const [currentImageSrc, setCurrentImageSrc] = useState(lazyLoad ? effectivePlaceholderSrc : initialImageSrcToTry(src));
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);
  const prevSrc = useRef(src);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    if (onLoad) onLoad();
    // logger.debug(`OptimizedImage: Loaded ${currentImageSrc}`);
  }, [onLoad]);

  const handleError = useCallback(() => {
    // logger.warn(`OptimizedImage: Error loading ${currentImageSrc}. Main <img> will now attempt placeholder: ${effectivePlaceholderSrc}`);
    setHasError(true);
    setIsLoaded(false);
    if (currentImageSrc !== effectivePlaceholderSrc) {
        setCurrentImageSrc(effectivePlaceholderSrc);
    }
    if (onError) onError();
  }, [onError, effectivePlaceholderSrc, currentImageSrc]);

  useEffect(() => {
    if (src !== prevSrc.current) {
      // logger.debug(`OptimizedImage: src prop changed from "${prevSrc.current}" to "${src}".`);
      prevSrc.current = src;
      setIsLoaded(false);
      setHasError(false);
      if (lazyLoad) {
        if (currentImageSrc !== effectivePlaceholderSrc) {
             setCurrentImageSrc(effectivePlaceholderSrc);
        }
      } else {
        setCurrentImageSrc(initialImageSrcToTry(src));
      }
    } else if (!lazyLoad && src && currentImageSrc !== initialImageSrcToTry(src) && !isLoaded && !hasError) {
      // logger.debug(`OptimizedImage: src unchanged, but re-trying for non-lazy: ${src}`);
      setCurrentImageSrc(initialImageSrcToTry(src));
    }
  }, [src, lazyLoad, initialImageSrcToTry, currentImageSrc, isLoaded, hasError, effectivePlaceholderSrc]);

  useEffect(() => {
    if (!lazyLoad || !containerRef.current) {
      return;
    }
    if ((isLoaded && !hasError) || (hasError && currentImageSrc === effectivePlaceholderSrc)) {
        return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isLoaded && !hasError) {
              // logger.debug(`OptimizedImage: Intersecting, attempting to load src: ${src}`);
              setCurrentImageSrc(initialImageSrcToTry(src));
            }
            if (containerRef.current) {
                 observer.unobserve(containerRef.current);
            }
          }
        });
      },
      { threshold, rootMargin: '0px' }
    );
    observer.observe(containerRef.current);
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [lazyLoad, src, threshold, isLoaded, hasError, initialImageSrcToTry, effectivePlaceholderSrc, currentImageSrc]);

  // Container của OptimizedImage sẽ lấp đầy parent của nó (là div có aspect ratio)
  // Không cần aspect ratio class ở đây nữa
  const finalContainerClasses = classNames(
    'optimized-image-container', // Class để CSS có thể target nếu cần
    'position-relative w-100 h-100', // Bootstrap classes để lấp đầy parent
    containerClassName // Class tùy chỉnh từ props
  );

  const showDedicatedPlaceholder = !isLoaded || hasError;

  // Class cho thẻ img chính
  const finalImageClasses = classNames(
    'position-absolute top-0 start-0 w-100 h-100', // Bootstrap classes để img lấp đầy container
    objectFitClass, // object-cover hoặc object-contain
    'transition-opacity duration-300 ease-in-out', // Tailwind class cho transition (nếu bạn vẫn dùng Tailwind cho phần này)
                                                    // Hoặc định nghĩa transition trong CSS
    isLoaded && !hasError ? 'opacity-100' : 'opacity-0',
    className, // class tùy chỉnh cho img từ props (ví dụ: 'img-fluid')
    imageClassName // class riêng cho img từ props (ví dụ: 'product-card-actual-image')
  );

  // Class cho thẻ img placeholder
  const placeholderImageClasses = classNames(
    'position-absolute top-0 start-0 w-100 h-100',
    objectFitClass,
    className,
    imageClassName // Áp dụng cả imageClassName cho placeholder nếu cần style nhất quán
  );

  return (
    <div ref={containerRef} className={finalContainerClasses}>
      {showDedicatedPlaceholder && (
        <img
          src={effectivePlaceholderSrc}
          alt={alt ? `${alt} (placeholder)` : "Loading image..."}
          className={placeholderImageClasses}
          aria-hidden="true"
        />
      )}
      <img
        src={currentImageSrc || ''}
        alt={alt || ''}
        onLoad={handleLoad}
        onError={handleError}
        className={finalImageClasses}
        loading={lazyLoad && typeof IntersectionObserver === 'undefined' ? "lazy" : "eager"}
        {...rest}
      />
    </div>
  );
};

export default OptimizedImage;