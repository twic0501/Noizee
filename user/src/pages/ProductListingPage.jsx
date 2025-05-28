// user/src/pages/ProductListingPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal } from 'lucide-react'; // Using lucide-react icon

import { GET_PRODUCTS_QUERY } from '../api/graphql/productQueries';
import { GET_FILTER_CATEGORIES_QUERY, GET_FILTER_COLORS_QUERY, GET_FILTER_SIZES_QUERY } from '../api/graphql/filterQueries';
import ProductFilter from '../components/product/ProductFilter';
import SortDropdown from '../components/product/SortDropdown';
import ProductGrid from '../components/product/ProductGrid';
import Pagination from '../components/common/Pagination'; // Assuming this is Tailwind-styled
import AlertMessage from '../components/common/AlertMessage'; // Assuming this is Tailwind-styled
import { ITEMS_PER_PAGE_DEFAULT } from '../utils/constants';
// import logger from '../utils/logger';

const ProductListingPage = ({
    pageType = 'all', // 'all', 'category', 'collection'
    slug, // categorySlug hoặc collectionSlug (nếu pageType is category/collection)
    pageTitleKey, // i18n key for page title
    pageTitleDefault, // Default title if key not found or not provided
    filterId, // category_id or collection_id to pre-filter by
}) => {
    const { t, i18n } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    const [showFilterPanel, setShowFilterPanel] = useState(false);

    const initialMemoizedFilters = useMemo(() => {
        const params = { inStock: true, categories: [], colors: [], sizes: [] }; // Default structure
        if (searchParams.get('categories')) params.categories = searchParams.get('categories').split(',');
        if (searchParams.get('colors')) params.colors = searchParams.get('colors').split(',');
        if (searchParams.get('sizes')) params.sizes = searchParams.get('sizes').split(',');
        if (searchParams.get('inStock') !== null) params.inStock = searchParams.get('inStock') === 'true';
        return params;
    }, [searchParams]);

    const [activeFilters, setActiveFilters] = useState(initialMemoizedFilters);

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const itemsPerPage = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE_DEFAULT), 10);
    const currentSortBy = searchParams.get('sortBy') || 'createdAt';
    const currentSortOrder = searchParams.get('sortOrder') || 'DESC';
    const currentLang = i18n.language || 'vi';

    const { data: categoriesData, loading: categoriesLoading } = useQuery(GET_FILTER_CATEGORIES_QUERY, { variables: { lang: currentLang } });
    const { data: colorsData, loading: colorsLoading } = useQuery(GET_FILTER_COLORS_QUERY, { variables: { lang: currentLang } });
    const { data: sizesData, loading: sizesLoading } = useQuery(GET_FILTER_SIZES_QUERY);
    const loadingFilterOptions = categoriesLoading || colorsLoading || sizesLoading;

    const buildGraphQLFilter = useCallback(() => {
        const gqlFilter = {};
        // Apply pre-filter based on pageType and filterId
        if (pageType === 'category' && filterId) gqlFilter.category_id = filterId;
        if (pageType === 'collection' && filterId) gqlFilter.collection_id = filterId;

        // Apply active filters from user selection
        if (activeFilters.categories?.length) {
            // If pageType is category, this filter might be redundant or could be for sub-categories
            // For now, assume it overrides or adds if pageType isn't category
            if (pageType !== 'category') gqlFilter.category_id = activeFilters.categories[0]; // Example: take the first one if multi-select not supported by GQL for ID
        }
        if (activeFilters.colors?.length) gqlFilter.color_id = activeFilters.colors; // Assuming GQL filter accepts array of color_ids
        if (activeFilters.sizes?.length) gqlFilter.size_id = activeFilters.sizes;   // Assuming GQL filter accepts array of size_ids

        if (activeFilters.inStock !== undefined) gqlFilter.in_stock = activeFilters.inStock;

        // Add other filters like priceRange, searchTerm if they are part of activeFilters
        // if (activeFilters.priceRange) {
        //     gqlFilter.min_price = activeFilters.priceRange.min;
        //     gqlFilter.max_price = activeFilters.priceRange.max;
        // }
        // if (activeFilters.searchTerm) gqlFilter.search_term = activeFilters.searchTerm;

        return gqlFilter;
    }, [activeFilters, pageType, filterId]);

    const queryVariables = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        lang: currentLang,
        // sortBy: currentSortBy, // GQL schema's products query needs to support this
        // sortOrder: currentSortOrder, // GQL schema's products query needs to support this
        filter: buildGraphQLFilter(),
    };

    const { data, loading, error } = useQuery(GET_PRODUCTS_QUERY, {
        variables: queryVariables,
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
    });

    const products = data?.products?.products || []; // Adjusted path based on your GQL structure
    const totalProducts = data?.products?.count || 0; // Adjusted path

    const updateSearchParams = (newParams) => {
        const allParams = new URLSearchParams(searchParams);
        Object.keys(newParams).forEach(key => {
            if (newParams[key] === null || newParams[key] === undefined || (Array.isArray(newParams[key]) && newParams[key].length === 0)) {
                allParams.delete(key);
            } else {
                allParams.set(key, Array.isArray(newParams[key]) ? newParams[key].join(',') : newParams[key]);
            }
        });
        setSearchParams(allParams, { replace: true }); // Use replace to avoid history buildup for filters
    };

    const handleApplyPanelFilters = useCallback((newPanelFilters) => {
        setActiveFilters(newPanelFilters);
        updateSearchParams({
            categories: newPanelFilters.categories,
            colors: newPanelFilters.colors,
            sizes: newPanelFilters.sizes,
            inStock: newPanelFilters.inStock.toString(), // Ensure boolean is string for URL
            page: '1'
        });
    }, [setSearchParams]);

    const handleClearPanelFilters = useCallback(() => {
        const cleared = { inStock: true, categories: [], colors: [], sizes: [] };
        setActiveFilters(cleared);
        updateSearchParams({
            categories: null, colors: null, sizes: null, inStock: 'true', page: '1'
        });
    }, [setSearchParams]);

    const handleSortChange = useCallback((sortByValue, sortOrderValue) => {
        updateSearchParams({
            sortBy: sortByValue === 'featured' ? null : sortByValue,
            sortOrder: sortByValue === 'featured' ? null : sortOrderValue,
            page: '1'
        });
    }, [setSearchParams]);

    const handlePageChange = (newPage) => {
        updateSearchParams({ page: newPage.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const activeFilterCountVal = useMemo(() => {
        let count = 0;
        if (activeFilters.inStock === false) count++;
        if (activeFilters.categories) count += activeFilters.categories.length;
        if (activeFilters.colors) count += activeFilters.colors.length;
        if (activeFilters.sizes) count += activeFilters.sizes.length;
        return count;
    }, [activeFilters]);

    const finalPageTitle = pageTitleKey
        ? t(pageTitleKey, { defaultValue: pageTitleDefault || t('products.allProductsTitle', "Tất cả sản phẩm"), name: slug || '' })
        : pageTitleDefault || t('products.allProductsTitle', "Tất cả sản phẩm");

    return (
        <div className="min-h-screen bg-white text-black">
            {/* Header is part of MainLayout */}
            <div className="container mx-auto px-4 py-6">
                <div className="text-center mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-black">
                        {finalPageTitle}
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-600">
                        {(!loading && products.length === 0 && totalProducts === 0) ? "" :
                          loading && products.length === 0 ? t('products.loadingProducts', 'Đang tải sản phẩm...') :
                            t('products.showingResults', '{{count}} sản phẩm', { count: totalProducts })
                        }
                    </p>
                </div>

                {/* Filter and Sort Bar */}
                <div className="mb-6 border-y border-neutral-300 py-3 flex justify-between items-center sticky top-16 bg-white z-20"> {/* Adjust top value based on actual header height */}
                    <button
                        onClick={() => setShowFilterPanel(true)}
                        className="flex items-center text-xs sm:text-sm text-black hover:text-neutral-700 group border border-neutral-400 rounded-md px-3 py-2 bg-white"
                    >
                        <SlidersHorizontal size={14} className="mr-1.5 text-neutral-600 group-hover:text-black" />
                        {t('filter.title', 'Filter')}
                        {activeFilterCountVal > 0 && (
                             <span className="ml-1.5 bg-black text-white text-[10px] rounded-full px-1.5 py-0.5 font-semibold">{activeFilterCountVal}</span>
                        )}
                        <span className="ml-2 hidden sm:inline text-neutral-500 group-hover:text-neutral-700">({totalProducts} {t('products.productsLabel', 'sản phẩm')})</span>
                    </button>
                    <SortDropdown
                        onSortChange={handleSortChange}
                        initialSortBy={currentSortBy}
                        initialSortOrder={currentSortOrder}
                    />
                </div>

                <main className="w-full">
                    {/* Product Grid will be rendered here */}
                    {/* Loading state is handled by ProductGrid internally for initial load */}
                    {error && (
                        <AlertMessage type="error" title={t('products.errorLoadingTitle')} message={error.message} className="mb-6"/>
                    )}
                    <ProductGrid
                        products={products}
                        loading={loading} // Pass loading state to ProductGrid
                        error={null} // Error is handled above
                    />
                    {/* No products message handled by ProductGrid */}

                    {totalProducts > itemsPerPage && !loading && products.length > 0 && (
                        <div className="mt-10 pt-6 border-t border-gray-200">
                           <Pagination
                                currentPage={currentPage}
                                totalItems={totalProducts}
                                itemsPerPage={itemsPerPage}
                                onPageChange={handlePageChange}
                                // Ensure Pagination is Tailwind-styled or use classes for centering
                                className="flex justify-center"
                            />
                        </div>
                    )}
                </main>
            </div>

            <ProductFilter
                isOpen={showFilterPanel}
                onClose={() => setShowFilterPanel(false)}
                onApplyFilters={handleApplyPanelFilters}
                onClearFilters={handleClearPanelFilters}
                initialFilters={activeFilters}
                availableCategories={categoriesData?.categories || []} // Adjusted path to categories
                availableColors={colorsData?.publicGetAllColors || []} // Adjusted path to publicGetAllColors
                availableSizes={sizesData?.sizes || []}               // Adjusted path to sizes
                loadingOptions={loadingFilterOptions}
            />
            {/* CartSliderPanel is typically part of Header or a global layout context item */}
        </div>
    );
};

export default ProductListingPage;