// src/pages/CollectionsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useQuery } from '@apollo/client';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilter from '../components/product/ProductFilter'; // ProductFilter đã được dịch
import Pagination from '../components/common/Pagination';     // Pagination đã được dịch
import LoadingSpinner from '../components/common/LoadingSpinner'; // LoadingSpinner đã được dịch
import AlertMessage from '../components/common/AlertMessage';   // AlertMessage không cần dịch nội bộ
import { GET_PRODUCTS_QUERY, GET_FILTER_OPTIONS_QUERY } from '../api/graphql/queries/productQueries';
import useDataTable from '../hooks/useDataTable';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation
import './CollectionsPage.css';

const PAGE_LIMIT = 12;

function CollectionsPage() {
    const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams(); // Lấy lang từ URL
    const { categorySlug: slugFromParams } = params;
    const currentLang = params.lang || i18n.language || 'vi';

    const [pageTitle, setPageTitle] = useState(t('collectionsPage.defaultTitle'));
    const [pageDescription, setPageDescription] = useState(''); // Thêm state cho mô tả trang

    const { data: filterOptionsData, loading: filterOptionsLoading } = useQuery(GET_FILTER_OPTIONS_QUERY, {
        variables: { lang: currentLang } // Truyền ngôn ngữ hiện tại
    });

    const parseFiltersFromQuery = useCallback(() => {
        const searchParams = new URLSearchParams(location.search);
        const filters = {};
        let dynamicPageTitle = t('collectionsPage.defaultTitle');
        let dynamicPageDescription = '';

        if (slugFromParams && filterOptionsData?.categories) {
            const foundCategory = filterOptionsData.categories.find(
                cat => (cat.slug && cat.slug.toLowerCase() === slugFromParams.toLowerCase()) ||
                       (cat.category_name_vi && cat.category_name_vi.toLowerCase().replace(/\s+/g, '-') === slugFromParams.toLowerCase()) ||
                       (cat.category_name_en && cat.category_name_en.toLowerCase().replace(/\s+/g, '-') === slugFromParams.toLowerCase()) ||
                       String(cat.category_id) === slugFromParams
            );
            if (foundCategory) {
                filters.categoryId = foundCategory.category_id;
                dynamicPageTitle = (currentLang === 'en' && foundCategory.category_name_en) ? foundCategory.category_name_en : foundCategory.category_name_vi;
                // Giả sử category có trường description_vi, description_en
                dynamicPageDescription = (currentLang === 'en' && foundCategory.description_en) ? foundCategory.description_en : foundCategory.description_vi || '';
            } else {
                dynamicPageTitle = t('collectionsPage.collectionTitle', { name: slugFromParams.replace(/-/g, ' ') });
            }
        }
        
        if (searchParams.get('categoryId') && !filters.categoryId) {
            filters.categoryId = searchParams.get('categoryId');
            // Cập nhật title nếu categoryId từ query string
            if (filterOptionsData?.categories) {
                 const catFromQuery = filterOptionsData.categories.find(c => String(c.category_id) === filters.categoryId);
                 if(catFromQuery) dynamicPageTitle = (currentLang === 'en' && catFromQuery.category_name_en) ? catFromQuery.category_name_en : catFromQuery.category_name_vi;
            }
        }

        if (searchParams.get('sizeId')) filters.sizeId = searchParams.get('sizeId');
        if (searchParams.get('colorId')) filters.colorId = searchParams.get('colorId');
        if (searchParams.get('minPrice')) filters.minPrice = parseFloat(searchParams.get('minPrice'));
        if (searchParams.get('maxPrice')) filters.maxPrice = parseFloat(searchParams.get('maxPrice'));
        if (searchParams.get('searchTerm')) {
            filters.searchTerm = searchParams.get('searchTerm');
            dynamicPageTitle = t('collectionsPage.searchResultsTitle', { term: filters.searchTerm });
        }
        if (searchParams.get('isNewArrival') === 'true') {
            filters.is_new_arrival = true; // Khớp với backend resolver
            dynamicPageTitle = t('collectionsPage.newArrivalsTitle');
        }
        
        setPageTitle(dynamicPageTitle);
        setPageDescription(dynamicPageDescription);
        return filters;
    }, [location.search, slugFromParams, filterOptionsData?.categories, t, currentLang]);

    const {
        currentPage,
        limit,
        offset,
        handlePageChange,
        setTotalItems,
        totalPages,
        filters: currentAppliedFilters,
        applyFilters,
    } = useDataTable({
        initialLimit: PAGE_LIMIT,
        initialFilters: useMemo(() => parseFiltersFromQuery(), [parseFiltersFromQuery]) // Chạy một lần khi mount
    });
    
    useEffect(() => {
        if (filterOptionsLoading) return;
        const newFiltersBasedOnUrl = parseFiltersFromQuery();
        if (JSON.stringify(newFiltersBasedOnUrl) !== JSON.stringify(currentAppliedFilters)) {
            applyFilters(newFiltersBasedOnUrl);
        }
    }, [slugFromParams, location.search, filterOptionsData, applyFilters, parseFiltersFromQuery, currentAppliedFilters, filterOptionsLoading]);


    const { loading: productsLoading, error: productsError, data: productsData } = useQuery(GET_PRODUCTS_QUERY, {
        variables: { 
            filter: currentAppliedFilters, 
            limit: limit, 
            offset: offset,
            lang: currentLang // Truyền ngôn ngữ cho query sản phẩm
        },
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        onCompleted: (queryData) => {
            setTotalItems(queryData?.products?.count || 0);
        },
        onError: (err) => {
            console.error("Error fetching products (GET_PRODUCTS_QUERY):", err.message, "Variables:", currentAppliedFilters);
        }
    });

    const products = productsData?.products?.products || [];
    const totalProducts = productsData?.products?.count || 0;

    const handleFilterChangeFromComponent = useCallback((newFiltersFromComponent) => {
        const searchParams = new URLSearchParams();
        let newPathSlug = slugFromParams;

        for (const key in newFiltersFromComponent) {
            const value = newFiltersFromComponent[key];
            if (value !== '' && value !== null && value !== undefined) {
                if (key === 'categoryId') {
                    const cat = filterOptionsData?.categories.find(c => String(c.category_id) === String(value));
                    newPathSlug = cat?.slug || (currentLang === 'en' && cat?.category_name_en ? cat.category_name_en.toLowerCase().replace(/\s+/g, '-') : cat?.category_name_vi.toLowerCase().replace(/\s+/g, '-')) || value;
                    // Không thêm categoryId vào searchParams nếu đã dùng slug
                    // navigate sẽ cập nhật path, useEffect sẽ parse lại slug/categoryId
                    continue; 
                } else if (key !== 'categorySlug') {
                    searchParams.set(key, String(value));
                }
            }
        }
        
        const basePath = newPathSlug ? `/${currentLang}/collections/${newPathSlug}` : `/${currentLang}/collections`;
        const queryString = searchParams.toString();
        const finalUrl = `${basePath.replace(/\/+/g, '/')}${queryString ? `?${queryString}` : ''}`;
        
        navigate(finalUrl, { replace: true });

    }, [navigate, slugFromParams, filterOptionsData?.categories, currentLang]);

    const handleResetAllFilters = useCallback(() => {
         const basePath = `/${currentLang}/collections`;
         setPageTitle(t('collectionsPage.defaultTitle'));
         setPageDescription('');
         navigate(basePath, { replace: true });
    }, [navigate, currentLang, t]);

    const isLoading = filterOptionsLoading || (productsLoading && products.length === 0 && !productsData); // Điều chỉnh logic loading

    return (
        <Container fluid className="my-4 my-md-5 collections-page">
            <div className="collection-hero mb-4">
                <div className="collection-hero-content text-center">
                    <h1 className="collection-page-title">{pageTitle}</h1>
                    {pageDescription && <p className="text-muted">{pageDescription}</p>}
                    {totalProducts > 0 && !isLoading && (
                        <p className="text-muted">{t('collectionsPage.productsCount', { count: totalProducts })}</p>
                    )}
                    {isLoading && totalProducts === 0 && <p className="text-muted">{t('collectionsPage.findingProducts')}</p>}
                </div>
            </div>

            <Row>
                <Col lg={3} className="mb-4 mb-lg-0 filter-sidebar-col">
                    <ProductFilter
                        initialFilters={currentAppliedFilters}
                        onFilterChange={handleFilterChangeFromComponent}
                        isLoadingExternally={filterOptionsLoading || (productsLoading && !productsData)}
                    />
                     <Button variant="outline-secondary" size="sm" className="w-100 mt-3 d-lg-none" onClick={handleResetAllFilters}>
                        {t('productFilter.resetAll')} {/* Key đã có */}
                    </Button>
                </Col>
                <Col lg={9} className="product-grid-col">
                    {isLoading && products.length === 0 && <LoadingSpinner message={t('loadingSpinner.loading')} />}
                    {productsError && <AlertMessage variant="danger">{t('collectionsPage.productsLoadError', { message: productsError.message })}</AlertMessage>}
                    {!isLoading && !productsError && products.length === 0 && totalProducts === 0 && (
                        <AlertMessage variant="info">{t('productGrid.noProductsFound')}</AlertMessage> 
                    )}

                    {products.length > 0 && <ProductGrid products={products} loading={false} />}

                    {totalPages > 1 && !isLoading && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default CollectionsPage;