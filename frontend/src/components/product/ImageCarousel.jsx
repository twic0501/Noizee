// src/components/product/ImageCarousel.jsx
import React from 'react';
import { Carousel, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Nếu caption có link
import { getFullImageUrl } from '../../utils/formatters'; // Để xử lý ảnh
import { PLACEHOLDER_PRODUCT_IMAGE } from '../../utils/constants';
import './ImageCarousel.css'; // File CSS riêng

// images là mảng các object ví dụ:
// {
//   src: 'url/to/image.jpg',
//   alt: 'Mô tả ảnh',
//   captionTitle: 'Tiêu đề Caption',
//   captionText: 'Nội dung caption.',
//   linkTo: '/some/path', // Optional link for the slide
//   buttonText: 'Shop Now' // Optional button text
// }

function ImageCarousel({
  images = [],
  showControls = true,
  showIndicators = true,
  interval = 5000,
  className = "",
  slideHeight = "70vh", // Thêm prop để kiểm soát chiều cao
  objectFit = "cover" // Thêm prop để kiểm soát object-fit
}) {
  if (!images || images.length === 0) {
    // Có thể hiển thị một placeholder tĩnh nếu không có ảnh
    return (
      <div className={`image-carousel-placeholder ${className}`} style={{ height: slideHeight, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted">No images to display</p>
      </div>
    );
  }

  const handleImageError = (e) => {
      e.target.onerror = null;
      e.target.src = getFullImageUrl(null); // Fallback về placeholder chung
  };

  return (
    <Carousel
      controls={showControls && images.length > 1} // Chỉ hiện control nếu có nhiều hơn 1 ảnh
      indicators={showIndicators && images.length > 1} // Chỉ hiện indicator nếu có nhiều hơn 1 ảnh
      interval={interval}
      className={`image-carousel ${className}`}
      fade // Thêm hiệu ứng fade
    >
      {images.map((image, index) => (
        <Carousel.Item key={index} style={{ height: slideHeight }}>
          <img
            className="d-block w-100 carousel-image"
            src={getFullImageUrl(image.src)} // Xử lý URL ảnh
            alt={image.alt || `Slide ${index + 1}`}
            style={{ objectFit: objectFit, height: '100%' }}
            onError={handleImageError}
          />
          {(image.captionTitle || image.captionText || image.linkTo) && (
            <Carousel.Caption className="carousel-custom-caption text-start"> {/* CSS: Style caption, text-start để căn trái */}
              {image.captionTitle && <h2 className="carousel-caption-title">{image.captionTitle}</h2>}
              {image.captionText && <p className="carousel-caption-text d-none d-md-block">{image.captionText}</p>}
              {image.linkTo && (
                <Button
                  as={Link}
                  to={image.linkTo}
                  variant="light" /* Hoặc "dark", "outline-light" */
                  size="lg"
                  className="mt-2 carousel-caption-button"
                >
                  {image.buttonText || 'Explore Now'}
                </Button>
              )}
            </Carousel.Caption>
          )}
        </Carousel.Item>
      ))}
    </Carousel>
  );
}

export default ImageCarousel;