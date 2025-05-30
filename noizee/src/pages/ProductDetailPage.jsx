import React, { useState, useEffect } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { useQuery } from '@apollo/client';
// import { GET_PRODUCT_DETAIL } from '../api/graphql/queries/productQueries';
// import { useCart } from '../contexts/CartContext';
// import LoadingSpinner from '../components/common/LoadingSpinner';
// import AlertMessage from '../components/common/AlertMessage';
// import ImageCarousel from '../components/product/ImageCarousel'; // Hoặc logic image gallery trực tiếp
// import ColorSelector from '../components/product/ColorSelector';
// import SizeSelector from '../components/product/SizeSelector';
// import QuantityInput from '../components/common/QuantityInput'; // Component này có thể cần tạo
// import { ArrowLeft, Heart, Share2, Maximize } from 'lucide-react';
// import { useTranslation } from 'react-i18next';

const ProductDetailPage = () => {
    // const { t } = useTranslation();
    // const { slugOrId } = useParams(); // Lấy slug hoặc ID từ URL
    // const { addToCart } = useCart();
    // State cho selectedColor, selectedSize, quantity
    // Query GET_PRODUCT_DETAIL

    return (
        <div className="container py-4 py-md-5">
            {/* Breadcrumbs hoặc link "Back to collections" */}
            {/* Layout 2 cột: Image Gallery và Product Info */}
            <h1 className="text-center">Chi Tiết Sản Phẩm (ProductDetailPage Placeholder)</h1>
            <p className="text-center">Hình ảnh, thông tin, lựa chọn màu/size, nút thêm vào giỏ hàng sẽ ở đây.</p>
        </div>
    );
};

export default ProductDetailPage;