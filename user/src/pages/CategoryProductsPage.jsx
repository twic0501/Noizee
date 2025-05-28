// user/src/pages/CategoryProductsPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductListingPage from './ProductListingPage'; // Import the main listing page
// import { useQuery } from '@apollo/client';
// import { GET_CATEGORY_DETAILS_QUERY } from '../../api/graphql/categoryQueries'; // If you need category name

const CategoryProductsPage = () => {
  const { categorySlug } = useParams();
  const { t, i18n } = useTranslation();

  // Optional: Fetch category details to get the actual name from slug
  // const { data: categoryData } = useQuery(GET_CATEGORY_DETAILS_QUERY, { variables: { slug: categorySlug, lang: i18n.language }});
  // const categoryName = categoryData?.categoryBySlug?.name || categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  // const categoryId = categoryData?.categoryBySlug?.category_id;

  // For now, derive name from slug if not fetching details
  const categoryName = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  // IMPORTANT: You need a way to get category_id from categorySlug if your GQL filter uses category_id.
  // This might involve another query or having slugs as unique identifiers in your filter.
  // For this example, I'll assume 'slug' can be passed to the filter or you'll fetch the ID.
  // If GET_PRODUCTS_QUERY filter needs 'category_id', you MUST fetch it first.
  // Let's assume for now your `buildGraphQLFilter` in ProductListingPage can handle `category_slug`.
  // If not, you'd pass `filterId={categoryId}` once you fetch it.

  return (
    <ProductListingPage
      pageType="category"
      slug={categorySlug} // Used for display title or breadcrumbs
      // filterId={categoryId} // Pass the actual ID if your GQL filter needs category_id
      pageTitleKey="products.productsInCategory"
      pageTitleDefault={t('products.productsInCategory', 'Sản phẩm trong: {{name}}', { name: categoryName })}
    />
  );
};

export default CategoryProductsPage;