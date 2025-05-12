// src/pages/CollectionsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col,Button } from 'react-bootstrap';
import { useQuery } from '@apollo/client';  
import { useLocation, useParams, useNavigate } from 'react-router-dom'; // Thêm useNavigate
import ProductGrid from '../components/product/ProductGrid';
import ProductFilter from '../components/product/ProductFilter';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import { GET_PRODUCTS_QUERY, GET_FILTER_OPTIONS_QUERY } from '../api/graphql/queries/productQueries'; // Giả sử có query lấy category details by slug
import useDataTable from '../hooks/useDataTable';
import './CollectionsPage.css'; // Tạo file CSS riêng

const PAGE_LIMIT = 12; // Số sản phẩm mỗi trang

function CollectionsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { categorySlug: slugFromParams } = useParams(); // Lấy category slug từ URL path
    const [pageTitle, setPageTitle] = useState('Tất cả sản phẩm');

    // Query lấy các options cho filter, bao gồm categories
    const { data: filterOptionsData, loading: filterOptionsLoading } = useQuery(GET_FILTER_OPTIONS_QUERY);

    const parseFiltersFromQuery = useCallback(() => {
        const searchParams = new URLSearchParams(location.search);
        const filters = {};

        if (slugFromParams && filterOptionsData?.categories) {
            const foundCategory = filterOptionsData.categories.find(
                cat => (cat.slug && cat.slug.toLowerCase() === slugFromParams.toLowerCase()) ||
                       cat.category_name.toLowerCase().replace(/\s+/g, '-') === slugFromParams.toLowerCase() ||
                       String(cat.category_id) === slugFromParams
            );
            if (foundCategory) {
                filters.categoryId = foundCategory.category_id; // QUAN TRỌNG: dùng categoryId
            }
        }
        // Lấy các filter khác từ query string
        if (searchParams.get('categoryId') && !filters.categoryId) filters.categoryId = searchParams.get('categoryId'); // Nếu có categoryId từ query
        if (searchParams.get('sizeId')) filters.sizeId = searchParams.get('sizeId');
        if (searchParams.get('colorId')) filters.colorId = searchParams.get('colorId');
        if (searchParams.get('minPrice')) filters.minPrice = parseFloat(searchParams.get('minPrice'));
        if (searchParams.get('maxPrice')) filters.maxPrice = parseFloat(searchParams.get('maxPrice'));
        if (searchParams.get('searchTerm')) filters.searchTerm = searchParams.get('searchTerm');
        if (searchParams.get('isNewArrival') === 'true') filters.isNewArrival = true;

        return filters;
    }, [location.search, slugFromParams, filterOptionsData?.categories]);


    const {
        currentPage,
        limit,
        offset,
        handlePageChange,
        setTotalItems,
        totalPages,
        filters: currentAppliedFilters,
        applyFilters, // Hàm từ useDataTable để set filter và reset page
    } = useDataTable({
        initialLimit: PAGE_LIMIT,
        // Khởi tạo filter lần đầu dựa trên URL, nhưng sẽ được cập nhật bởi useEffect bên dưới
        initialFilters: useMemo(() => parseFiltersFromQuery(), [parseFiltersFromQuery])
    });

    // useEffect này sẽ chạy khi filterOptionsData (chứa categories) có sẵn hoặc slugFromParams thay đổi
    // để đảm bảo applyFilters được gọi với categoryId đúng.
    useEffect(() => {
        if (filterOptionsLoading) return; // Chờ options load xong

        const newFiltersBasedOnUrl = parseFiltersFromQuery();
        // Chỉ gọi applyFilters nếu filter mới khác filter hiện tại để tránh vòng lặp
        if (JSON.stringify(newFiltersBasedOnUrl) !== JSON.stringify(currentAppliedFilters)) {
            applyFilters(newFiltersBasedOnUrl);
        }

        // Cập nhật pageTitle
        if (slugFromParams && filterOptionsData?.categories) {
             const category = filterOptionsData.categories.find(
                cat => (cat.slug && cat.slug.toLowerCase() === slugFromParams.toLowerCase()) ||
                       cat.category_name.toLowerCase().replace(/\s+/g, '-') === slugFromParams.toLowerCase() ||
                       String(cat.category_id) === slugFromParams
            );
            if (category) {
                setPageTitle(category.category_name);
            } else {
                setPageTitle(`Collection: ${slugFromParams.replace(/-/g, ' ')}`);
            }
        } else if (newFiltersBasedOnUrl.isNewArrival) { // Sử dụng filter đã được parse
            setPageTitle('Sản phẩm mới');
        } else {
            setPageTitle('Tất cả sản phẩm');
        }

    }, [slugFromParams, filterOptionsData, applyFilters, parseFiltersFromQuery, currentAppliedFilters, filterOptionsLoading]);


    const { loading: productsLoading, error: productsError, data: productsData } = useQuery(GET_PRODUCTS_QUERY, {
        variables: { filter: currentAppliedFilters, limit: limit, offset: offset },
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        onCompleted: (queryData) => {
            setTotalItems(queryData?.products?.count || 0);
        },
        onError: (err) => {
            // Lỗi này sẽ được hiển thị bên dưới
            console.error("Error fetching products (GET_PRODUCTS_QUERY):", err.message, "Variables:", currentAppliedFilters);
        }
    });

    const products = productsData?.products?.products || [];
    const totalProducts = productsData?.products?.count || 0;

    const handleFilterChangeFromComponent = useCallback((newFiltersFromComponent) => {
        const searchParams = new URLSearchParams();
        let newPathSlug = slugFromParams; // Giữ slug từ path nếu có

        console.log("Filters received from component:", newFiltersFromComponent); // DEBUG

        for (const key in newFiltersFromComponent) {
            const value = newFiltersFromComponent[key];
            if (value !== '' && value !== null && value !== undefined) {
                // Xử lý logic cho categorySlug và categoryId
                if (key === 'categoryId') {
                    if (slugFromParams) { // Nếu URL đang có slug, ưu tiên giữ cấu trúc slug
                        const cat = filterOptionsData?.categories.find(c => String(c.category_id) === String(value));
                        newPathSlug = cat?.slug || cat?.category_name.toLowerCase().replace(/\s+/g, '-') || value;
                        // Không thêm categoryId vào searchParams nếu đã dùng slug trong path
                        continue;
                    } else {
                        // Nếu URL không có slug, thêm categoryId vào searchParams
                        searchParams.set(key, String(value));
                    }
                } else if (key !== 'categorySlug') { // Bỏ qua categorySlug nếu nó vô tình được truyền vào
                    searchParams.set(key, String(value));
                }
            }
        }

        // Tạo basePath dựa trên newPathSlug (nếu có)
        const basePath = newPathSlug ? `/collections/${newPathSlug}` : '/collections';
        const queryString = searchParams.toString();
        const finalUrl = `${basePath}${queryString ? `?${queryString}` : ''}`;

        console.log("Navigating to URL:", finalUrl); // DEBUG
        navigate(finalUrl, { replace: true });

    }, [navigate, slugFromParams, filterOptionsData?.categories]);


    const handleResetAllFilters = useCallback(() => {
        // applyFilters({}); // useDataTable sẽ reset page
        // navigate(slugFromParams ? `/collections/${slugFromParams}` : '/collections', { replace: true });
         const basePath = '/collections'; // Luôn reset về trang collections gốc không có slug
         setPageTitle('Tất cả sản phẩm');
         navigate(basePath, { replace: true }); // Điều hướng sẽ trigger useEffect để parse filter rỗng
    }, [navigate]);


    // Quyết định loading state tổng thể
    const isLoading = filterOptionsLoading || (productsLoading && products.length === 0);


    return (
        <Container fluid className="my-4 my-md-5 collections-page">
            <div className="collection-hero mb-4">
                <div className="collection-hero-content text-center">
                    <h1 className="collection-page-title">{pageTitle}</h1>
                    {totalProducts > 0 && !isLoading && (
                        <p className="text-muted">{totalProducts} sản phẩm</p>
                    )}
                    {isLoading && totalProducts === 0 && <p className="text-muted">Đang tìm sản phẩm...</p>}
                </div>
            </div>

            <Row>
                <Col lg={3} className="mb-4 mb-lg-0 filter-sidebar-col">
                    <ProductFilter
                        initialFilters={currentAppliedFilters}
                        onFilterChange={handleFilterChangeFromComponent} // Hàm này đã được sửa
                        isLoadingExternally={filterOptionsLoading || (productsLoading && products.length === 0)} // Filter chờ options load
                    />
                     <Button variant="outline-secondary" size="sm" className="w-100 mt-3 d-lg-none" onClick={handleResetAllFilters}>
                        Xóa bộ lọc
                    </Button>
                </Col>
                <Col lg={9} className="product-grid-col">
                    {/* ... (phần hiển thị loading, error, grid, pagination giữ nguyên) ... */}
                    {isLoading && products.length === 0 && <LoadingSpinner message="Đang tải sản phẩm..." />}
                    {productsError && <AlertMessage variant="danger">Lỗi: {productsError.message}. Vui lòng thử lại.</AlertMessage>}
                    {!isLoading && !productsError && products.length === 0 && totalProducts === 0 && (
                        <AlertMessage variant="info">Không tìm thấy sản phẩm nào phù hợp với lựa chọn của bạn.</AlertMessage>
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