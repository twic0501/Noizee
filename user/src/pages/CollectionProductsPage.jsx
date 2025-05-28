// src/pages/CollectionProductsPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductListingPageLayout from './ProductListingPageLayout'; // Nếu bạn tạo layout này
// import ProductListingPage from './ProductListingPage'; // Hoặc dùng trực tiếp

// Giả sử bạn sẽ có query để lấy collection details (bao gồm ID) từ slug
// import { useQuery } from '@apollo/client';
// import { GET_COLLECTION_DETAILS_BY_SLUG_QUERY } from '../api/graphql/collectionQueries'; // Ví dụ

const CollectionProductsPage = () => {
  const { collectionSlug } = useParams();
  const { t } = useTranslation();

  // Bước 1: Lấy collection ID từ slug (ví dụ, bạn cần tạo query này)
  // const { data: collectionData, loading: collectionLoading, error: collectionError } = useQuery(
  //   GET_COLLECTION_DETAILS_BY_SLUG_QUERY, // Query này cần trả về collection_id
  //   { variables: { slug: collectionSlug } }
  // );

  // if (collectionLoading) return <LoadingSpinner />;
  // if (collectionError) return <AlertMessage type="error" message="Could not load collection details." />;
  // const collectionId = collectionData?.collectionBySlug?.collection_id;
  // const collectionName = collectionData?.collectionBySlug?.name(lang: i18n.language);


  // === GIẢ LẬP LẤY ID (BẠN CẦN THAY BẰNG LOGIC THỰC TẾ) ===
  // Đây chỉ là placeholder, bạn cần một query thực sự để lấy ID từ slug
  const collectionId = null; // Thay thế bằng logic lấy ID từ slug
  let collectionName = collectionSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  if (collectionId === "some-known-id-for-bst-he") collectionName = "Bộ Sưu Tập Hè";
  // =======================================================


  // Sử dụng ProductListingPageLayout hoặc ProductListingPage trực tiếp
  // Nếu dùng ProductListingPage, bạn sẽ truyền filterId vào đó
  return (
    <ProductListingPageLayout // Hoặc <ProductListingPage ... />
      pageType="collection"
      slug={collectionSlug} // Vẫn truyền slug để có thể dùng cho breadcrumbs hoặc tiêu đề
      filterId={collectionId} // Truyền ID đã lấy được vào đây
      pageTitleKey="products.productsInCollection" // Ví dụ key i18n
      pageTitleDefault={`Bộ sưu tập: ${collectionName}`}
    />
  );
};
export default CollectionProductsPage;