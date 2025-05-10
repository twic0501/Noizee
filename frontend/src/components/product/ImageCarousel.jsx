// src/components/products/ImageCarousel.jsx
import React from 'react';
import { Carousel, Button } from 'react-bootstrap';
import './ImageCarousel.css'; // CSS riêng

// images là mảng các object { src, alt, captionTitle?, captionText? }
function ImageCarousel({ images = [], showControls = true, showIndicators = true, interval = 5000, className = "" }) {
  if (!images || images.length === 0) {
    return null; // Hoặc hiển thị placeholder
  }

  return (
    <Carousel
        controls={showControls}
        indicators={showIndicators}
        interval={interval}
        className={`image-carousel ${className}`} /* CSS */
        // Thêm fade={true} nếu muốn hiệu ứng fade thay vì slide
    >
      {images.map((image, index) => (
        <Carousel.Item key={index}>
          <img
            className="d-block w-100 carousel-image" /* CSS: Đảm bảo ảnh chiếm đúng kích thước */
            src={image.src}
            alt={image.alt || `Slide ${index + 1}`}
          />
          {(image.captionTitle || image.captionText) && (
            <Carousel.Caption className="carousel-custom-caption"> {/* CSS: Style caption */}
              {image.captionTitle && <h3>{image.captionTitle}</h3>}
              {image.captionText && <p>{image.captionText}</p>}
              {/* Thêm nút bấm nếu cần */}
              {/* <Button variant="light" size="sm">Shop Now</Button> */}
            </Carousel.Caption>
          )}
        </Carousel.Item>
      ))}
    </Carousel>
  );
}

export default ImageCarousel;