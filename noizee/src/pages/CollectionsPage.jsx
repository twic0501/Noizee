import React, { useState, useEffect } from 'react';
// import ProductGrid from '../components/product/ProductGrid';
// import ProductFilterEnhanced from '../components/product/ProductFilterEnhanced';
// import SortDropdown from '../components/product/SortDropdown';
// import LoadingSpinner from '../components/common/LoadingSpinner';
// import AlertMessage from '../components/common/AlertMessage';
// import { useQuery } from '@apollo/client';
// import { GET_PRODUCTS, GET_FILTER_OPTIONS } from '../api/graphql/queries/productQueries';
// import { useTranslation } from 'react-i18next';

const CollectionsPage = () => {
    // const { t } = useTranslation();
    // State cho filters, sort, pagination, products, loading, error
    // Gọi query GET_PRODUCTS và GET_FILTER_OPTIONS

    return (
        <div className="container-fluid py-4"> {/* container-fluid để filter bar chiếm full width */}
            <div className="container"> {/* Container cho tiêu đề */}
                <div className="text-center mb-4">
                    <h1 className="h3 text-uppercase fw-bold text-dark">
                        {/* {t('nav.collections', 'Collections')} */}
                        Collections (Placeholder)
                    </h1>
                    {/* <p className="small text-muted">{t('productListing.productsFound', { count: 0 })}</p> */}
                </div>
            </div>
            {/* Filter Bar (SortDropdown, Filter Button) */}
            {/* ProductGrid */}
            {/* ProductFilterEnhanced Panel */}
             <p className="text-center">Danh sách sản phẩm, bộ lọc, sắp xếp sẽ ở đây.</p>
        </div>
    );
};

export default CollectionsPage;