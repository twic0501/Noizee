// user/src/pages/CollectionProductsPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
// Import các component và hook tương tự như ProductListingPage.jsx
// ... ProductFilter, ProductGrid, Pagination, GET_PRODUCTS_QUERY ...
import ProductListingPageLayout from './ProductListingPageLayout'; // Tạo một layout chung

const CollectionProductsPage = () => {
  const { collectionSlug } = useParams();
  // const { t } = useTranslation();
  // TODO: Fetch collection details (tên collection) để hiển thị tiêu đề
  // const {data: collectionDetailsData} = useQuery(GET_COLLECTION_DETAILS_QUERY, { variables: {slug: collectionSlug}})
  // const pageTitle = collectionDetailsData?.collection?.name || collectionSlug;

  const filterVariablesForQuery = { collectionSlug: collectionSlug };
  const pageTitle = `Bộ sưu tập: ${collectionSlug}`; // Placeholder title

  return (
    <ProductListingPageLayout
      pageType="collection"
      filterVariablesForQuery={filterVariablesForQuery}
      pageTitle={pageTitle}
      // breadcrumbItems={...}
    />
  );
};
export default CollectionProductsPage;

// user/src/pages/CategoryProductsPage.jsx
// Tương tự, nhưng với categorySlug