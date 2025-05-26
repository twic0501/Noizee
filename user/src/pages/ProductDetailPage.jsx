// user/src/pages/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FiShoppingCart, FiHeart, FiMinus, FiPlus, FiShare2, FiCheckCircle } from 'react-icons/fi'; // Thêm icon

import { GET_PRODUCT_DETAILS_QUERY } from '../../api/graphql/productQueries';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext'; // Nếu có wishlist
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import ImageCarousel from '../../components/product/ImageCarousel'; // Đã tạo/đề xuất
import ColorSelector from '../../components/product/ColorSelector'; // Đã tạo/đề xuất
import SizeSelector from '../../components/product/SizeSelector';   // Đã tạo/đề xuất
// import Breadcrumbs from '../../components/common/Breadcrumbs'; // Nếu có
// import ProductReviews from '../../components/product/ProductReviews'; // Nếu có
// import RelatedProducts from '../../components/product/RelatedProducts'; // Nếu có
import { formatPrice } from '../../utils/formatters';
import { classNames } from '../../utils/helpers';
import OptimizedImage from '../../components/common/OptimizedImage'; // Cho ảnh variant (nếu có)

const ProductDetailPage = () => {
  const { t } = useTranslation();
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const { addToCart, isLoading: cartLoading } = useCart();
  const { authState } = useAuth(); // Ví dụ cho wishlist

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageSet, setCurrentImageSet] = useState([]); // Mảng ảnh cho màu/variant được chọn
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);


  const { data, loading, error } = useQuery(GET_PRODUCT_DETAILS_QUERY, {
    variables: { slug: productSlug }, // Hoặc id nếu dùng ID
    fetchPolicy: 'cache-and-network',
    onCompleted: (queryData) => {
      if (queryData && queryData.product) {
        const product = queryData.product;
        // Set màu mặc định (nếu có)
        if (product.colors && product.colors.length > 0) {
          setSelectedColor(product.colors[0]);
          setCurrentImageSet(product.colors[0].images || product.images || []);
        } else {
          setCurrentImageSet(product.images || []);
        }
        // Set size mặc định (nếu có và available)
        if (product.sizes && product.sizes.length > 0) {
          const availableSize = product.sizes.find(s => s.available !== false); // Ưu tiên size available
          if (availableSize) setSelectedSize(availableSize);
          else setSelectedSize(product.sizes[0]); // Hoặc size đầu tiên nếu không có available
        }
      }
    }
  });

  const product = data?.product;

  // Cập nhật bộ ảnh khi màu thay đổi
  useEffect(() => {
    if (selectedColor && selectedColor.images && selectedColor.images.length > 0) {
      setCurrentImageSet(selectedColor.images);
    } else if (product && product.images && product.images.length > 0) {
      // Fallback về ảnh chính của sản phẩm nếu màu không có ảnh riêng hoặc không chọn màu
      setCurrentImageSet(product.images);
    } else {
        setCurrentImageSet([]);
    }
  }, [selectedColor, product]);


  const handleColorSelect = (color) => {
    setSelectedColor(color);
    // Reset size nếu logic variant phụ thuộc vào màu
    // setSelectedSize(null); 
    // Reset quantity về 1
    setQuantity(1);
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  const handleQuantityChange = (amount) => {
    setQuantity((prev) => {
      const newQuantity = prev + amount;
      // Logic kiểm tra stock của variant cụ thể nếu có
      // const currentVariantStock = product.variants?.find(v => v.colorId === selectedColor?.id && v.sizeId === selectedSize?.id)?.stockQuantity || product.stockQuantity || 99;
      const maxStock = product?.stockQuantity || 99; // Tạm dùng stock chung
      if (newQuantity >= 1 && newQuantity <= maxStock) {
        return newQuantity;
      }
      return prev;
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    // Kiểm tra xem đã chọn đủ các tùy chọn bắt buộc chưa (ví dụ size)
    if (product.sizes?.length > 0 && !selectedSize) {
        alert(t('productDetail.selectSizePrompt', 'Vui lòng chọn kích thước.'));
        return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
        alert(t('productDetail.selectColorPrompt', 'Vui lòng chọn màu sắc.'));
        return;
    }

    setAddToCartSuccess(false);
    const itemToAdd = {
      productId: product.id,
      quantity: quantity,
      // productVariantId: selectedVariant?.id, // Nếu bạn có hệ thống variant hoàn chỉnh
      // Gửi thêm selectedColor.id, selectedSize.id nếu backend cần để xác định variant
    };
    try {
      await addToCart(itemToAdd);
      setAddToCartSuccess(true);
      setTimeout(() => setAddToCartSuccess(false), 3000); // Ẩn thông báo sau 3s
    } catch (err) {
      console.error("Failed to add to cart from detail page:", err);
      // Hiển thị lỗi cho người dùng
    }
  };
  
  // const handleWishlistToggle = () => { /* ... logic wishlist ... */ };

  if (loading) return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner size="xl" /></div>;
  if (error) return <div className="container mx-auto px-4 py-8"><AlertMessage type="error" title={t('productDetail.errorLoadingTitle')} message={error.message} /></div>;
  if (!product) return <div className="container mx-auto px-4 py-8"><AlertMessage type="info" message={t('productDetail.notFound')} /></div>;

  const displayPrice = product.salePrice || product.price;
  const originalPrice = product.price;
  const hasSale = product.salePrice && product.salePrice < product.price;
  const stockAvailable = (product.stockQuantity !== undefined && product.stockQuantity > 0) || product.variants?.some(v => v.stockQuantity > 0);


  // const breadcrumbItems = [
  //   { name: t('header.home'), path: '/' },
  //   { name: t('header.products'), path: '/products' },
  //   product.category ? { name: product.category.name, path: `/categories/${product.category.slug}` } : null,
  //   { name: product.name, path: `/product/${product.slug}` }
  // ].filter(Boolean);


  return (
    <div className="container mx-auto px-4 py-8">
      {/* <Breadcrumbs items={breadcrumbItems} className="mb-6" /> */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Carousel */}
        <div className="product-gallery md:sticky md:top-24 self-start"> {/* Sticky gallery */}
          <ImageCarousel images={currentImageSet.length > 0 ? currentImageSet : product.images} productName={product.name} />
        </div>

        {/* Product Info, Options, Actions */}
        <div className="product-details">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          {/* SKU, Brand, Availability (optional) */}
          {/* <div className="text-sm text-gray-500 mb-3">
            <span>SKU: {product.sku || 'N/A'}</span> | <span>{t('productDetail.brand', 'Thương hiệu')}: <Link to={`/brand/${product.brand?.slug}`} className="text-indigo-600">{product.brand?.name || 'N/A'}</Link></span>
          </div> */}

          {/* Price */}
          <div className="mb-4">
            <span className="text-3xl font-bold text-indigo-600">{formatPrice(displayPrice)}</span>
            {hasSale && originalPrice && (
              <span className="ml-3 text-lg text-gray-400 line-through">{formatPrice(originalPrice)}</span>
            )}
            {hasSale && (
              <span className="ml-3 bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded">
                -{Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
              </span>
            )}
          </div>
          
          {/* Short Description (excerpt) */}
          {/* {product.excerpt && <p className="text-gray-600 mb-4 text-sm">{product.excerpt}</p>} */}

          {/* Color Selector */}
          {product.colors && product.colors.length > 0 && (
            <ColorSelector
              colors={product.colors}
              selectedColor={selectedColor}
              onColorSelect={handleColorSelect}
              className="mb-5"
            />
          )}

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <SizeSelector
              sizes={product.sizes} // Cần có thông tin `available` cho từng size
              selectedSize={selectedSize}
              onSizeSelect={handleSizeSelect}
              className="mb-5"
            />
          )}

          {/* Quantity Selector & Add to Cart */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-md w-max">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="p-2.5 text-gray-500 hover:text-indigo-600 disabled:opacity-50"
                aria-label={t('productDetail.decreaseQuantity', "Giảm số lượng")}
              >
                <FiMinus size={16} />
              </button>
              <input
                type="number"
                value={quantity}
                readOnly // Hoặc onChange={(e) => setQuantity(Number(e.target.value))} với validation
                className="w-12 text-center border-l border-r border-gray-300 text-sm focus:outline-none"
                aria-label={t('productDetail.quantity', "Số lượng")}
              />
              <button
                onClick={() => handleQuantityChange(1)}
                // disabled={quantity >= (selectedVariantStock || product.stockQuantity || 99)}
                className="p-2.5 text-gray-500 hover:text-indigo-600 disabled:opacity-50"
                aria-label={t('productDetail.increaseQuantity', "Tăng số lượng")}
              >
                <FiPlus size={16} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={cartLoading || !stockAvailable}
              className={classNames(
                "flex-grow sm:flex-none py-3 px-8 border border-transparent rounded-md shadow-sm text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 flex items-center justify-center",
                !stockAvailable ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              {cartLoading ? (
                <LoadingSpinner size="sm" color="text-white" className="mr-2"/>
              ) : (
                <FiShoppingCart className="mr-2 h-5 w-5" />
              )}
              {!stockAvailable ? t('productDetail.outOfStock', 'Hết hàng') : t('productDetail.addToCartButton', 'Thêm vào giỏ hàng')}
            </button>
          </div>
          {addToCartSuccess && (
            <div className="mt-3 flex items-center text-sm text-green-600">
                <FiCheckCircle className="w-5 h-5 mr-1.5"/>
                {t('productDetail.addedToCartSuccess', 'Đã thêm vào giỏ hàng thành công!')}
            </div>
          )}


          {/* Wishlist & Share (optional) */}
          {/* <div className="mt-6 flex items-center space-x-4">
            <button
              onClick={handleWishlistToggle}
              className="flex items-center text-sm text-gray-600 hover:text-indigo-600"
            >
              <FiHeart className={`mr-1.5 h-5 w-5 ${isInWishlist(product.id) ? 'text-red-500 fill-red-500' : ''}`} />
              {isInWishlist(product.id) ? t('productDetail.removeFromWishlist', 'Bỏ yêu thích') : t('productDetail.addToWishlist', 'Thêm vào yêu thích')}
            </button>
            <button className="flex items-center text-sm text-gray-600 hover:text-indigo-600">
              <FiShare2 className="mr-1.5 h-5 w-5" />
              {t('productDetail.share', 'Chia sẻ')}
            </button>
          </div> */}

          {/* Product Description (Full) */}
          {product.description && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">
                {t('productDetail.descriptionTitle', 'Mô tả sản phẩm')}
              </h4>
              <div
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: product.description }} // CẨN THẬN XSS
              />
            </div>
          )}

          {/* Additional Info / Specifications (Optional) */}
          {/* <div className="mt-8 pt-6 border-t border-gray-200"> ... </div> */}
        </div>
      </div>

      {/* Related Products (Optional) */}
      {/* <RelatedProducts productId={product.id} categoryId={product.category?.id} /> */}

      {/* Product Reviews (Optional) */}
      {/* <ProductReviews productId={product.id} reviews={product.reviews || []} averageRating={product.averageRating} /> */}
    </div>
  );
};

export default ProductDetailPage;