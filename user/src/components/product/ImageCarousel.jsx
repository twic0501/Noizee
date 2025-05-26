import React from 'react';
import ImageGallery from 'react-image-gallery';
import OptimizedImage from '../common/OptimizedImage'; // Để custom renderItem
import { PRODUCT_IMAGE_PLACEHOLDER } from '../../utils/constants';
// import "react-image-gallery/styles/css/image-gallery.css"; // Đã import ở main.jsx hoặc global css

const ImageCarousel = ({ images = [], productName = "Product" }) => {
  if (!images || images.length === 0) {
    // Hiển thị placeholder nếu không có ảnh
    return (
      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center rounded-lg shadow">
        <OptimizedImage
          src={PRODUCT_IMAGE_PLACEHOLDER}
          alt={`${productName} placeholder`}
          containerClassName="w-full h-full"
          objectFit="object-contain"
        />
      </div>
    );
  }

  const galleryItems = images.map(image => ({
    original: image.imageUrl || PRODUCT_IMAGE_PLACEHOLDER,
    thumbnail: image.thumbnailUrl || image.imageUrl || PRODUCT_IMAGE_PLACEHOLDER, // Thumbnail có thể khác
    originalAlt: image.altText || `${productName} image`,
    thumbnailAlt: image.altText || `${productName} thumbnail`,
    // originalTitle: image.altText, // Tùy chọn
    // thumbnailTitle: image.altText, // Tùy chọn
    // description: image.description, // Tùy chọn
    // renderItem: (item) => <CustomRenderItem item={item} />, // Nếu muốn custom render item
    // renderThumbInner: (item) => <CustomRenderThumbInner item={item} />, // Nếu muốn custom render thumb
  }));

  // Custom render function để sử dụng OptimizedImage (tùy chọn)
  // const CustomRenderItem = ({ item }) => (
  //   <div className="image-gallery-image h-full w-full">
  //     <OptimizedImage
  //       src={item.original}
  //       alt={item.originalAlt}
  //       containerClassName="w-full h-full" // Hoặc kích thước cụ thể
  //       aspectRatio={null} // Để image gallery kiểm soát
  //       objectFit="object-contain" // Hoặc object-cover
  //       className="w-full h-full"
  //     />
  //   </div>
  // );

  // const CustomRenderThumbInner = ({ item }) => (
  //   <div className="image-gallery-thumbnail-inner h-full w-full">
  //     <OptimizedImage
  //       src={item.thumbnail}
  //       alt={item.thumbnailAlt}
  //       containerClassName="w-full h-full"
  //       aspectRatio={null}
  //       objectFit="object-cover"
  //       className="w-full h-full"
  //     />
  //   </div>
  // );


  return (
    <div className="product-image-gallery w-full">
      <ImageGallery
        items={galleryItems}
        showPlayButton={false} // Tắt nút play slideshow
        showFullscreenButton={true}
        showNav={images.length > 1} // Chỉ hiện nút prev/next nếu có nhiều hơn 1 ảnh
        showThumbnails={images.length > 1} // Chỉ hiện thumbnail nếu có nhiều hơn 1 ảnh
        thumbnailPosition="bottom" // "bottom", "top", "left", "right"
        lazyLoad={true}
        // renderItem={CustomRenderItem} // Bỏ comment nếu dùng custom render
        // renderThumbInner={CustomRenderThumbInner} // Bỏ comment nếu dùng custom render
        // Thêm các props khác của react-image-gallery nếu cần
        // slideDuration={450}
        // useBrowserFullscreen={true}
        // additionalClass="my-custom-gallery-class" // Nếu cần thêm class CSS tùy chỉnh
      />
    </div>
  );
};

export default ImageCarousel;