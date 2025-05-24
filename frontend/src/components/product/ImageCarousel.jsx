// src/components/product/ImageCarousel.jsx
import React from 'react';
import { Carousel, Button } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom'; // Thêm useParams
import { getFullImageUrl } from '../../utils/formatters';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../../utils/constants';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './ImageCarousel.css';

function ImageCarousel({
  images = [],
  showControls = true,
  showIndicators = true,
  interval = 5000,
  className = "",
  slideHeight = "70vh",
  objectFit = "cover"
}) {
  const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
  const params = useParams();
  const currentLang = params.lang || i18n.language || 'vi';

  // Helper để tạo link với prefix ngôn ngữ
  const langLink = (path) => {
    if (!path) return `/${currentLang}`;
    return `/${currentLang}/${path.startsWith('/') ? path.substring(1) : path}`.replace(/\/+/g, '/');
  };

  if (!images || images.length === 0) {
    return (
      <div className={`image-carousel-placeholder ${className}`} style={{ height: slideHeight, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Sử dụng key dịch */}
        <p className="text-muted">{t('imageCarousel.noImages')}</p>
      </div>
    );
  }

  const handleImageError = (e) => {
      e.target.onerror = null;
      e.target.src = getFullImageUrl(null); // Fallback về placeholder chung
  };

  return (
    <Carousel
      controls={showControls && images.length > 1}
      indicators={showIndicators && images.length > 1}
      interval={interval}
      className={`image-carousel ${className}`}
      fade
    >
      {images.map((image, index) => {
        // Giả sử image object có thể chứa các trường đa ngôn ngữ cho caption
        // Ví dụ: image.captionTitle_vi, image.captionTitle_en
        // Hoặc bạn có thể truyền key dịch vào image object: image.captionTitleKey
        const captionTitle = (i18n.language === 'en' && image.captionTitle_en) ? image.captionTitle_en : image.captionTitle_vi || image.captionTitle;
        const captionText = (i18n.language === 'en' && image.captionText_en) ? image.captionText_en : image.captionText_vi || image.captionText;
        const buttonText = (i18n.language === 'en' && image.buttonText_en) ? image.buttonText_en : image.buttonText_vi || image.buttonText || t('imageCarousel.defaultButtonText');
        const altText = (i18n.language === 'en' && image.alt_en) ? image.alt_en : image.alt_vi || image.alt || t('imageCarousel.defaultSlideAlt', { index: index + 1 });

        return (
            <Carousel.Item key={image.src || index} style={{ height: slideHeight }}> {/* Sử dụng image.src hoặc index làm key */}
            <img
                className="d-block w-100 carousel-image"
                src={getFullImageUrl(image.src)}
                alt={altText}
                style={{ objectFit: objectFit, height: '100%' }}
                onError={handleImageError}
            />
            {(captionTitle || captionText || image.linkTo) && (
                <Carousel.Caption className="carousel-custom-caption text-start">
                {captionTitle && <h2 className="carousel-caption-title">{captionTitle}</h2>}
                {captionText && <p className="carousel-caption-text d-none d-md-block">{captionText}</p>}
                {image.linkTo && (
                    <Button
                    as={Link}
                    to={langLink(image.linkTo)} // Sử dụng langLink
                    variant="light"
                    size="lg"
                    className="mt-2 carousel-caption-button"
                    >
                    {buttonText}
                    </Button>
                )}
                </Carousel.Caption>
            )}
            </Carousel.Item>
        );
      })}
    </Carousel>
  );
}

export default ImageCarousel;