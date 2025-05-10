import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useQuery } from '@apollo/client';
import { useLocation, useParams } from 'react-router-dom';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilter from '../components/product/ProductFilter';
import { AlertMessage, LoadingSpinner, Pagination } from '@noizee/ui-components';
import { GET_PRODUCTS_QUERY } from '../api/graphql/queries/productQueries';
import useDataTable from '../hooks/useDataTable';

const PAGE_LIMIT = 12;

function CollectionsPage() {
    const [activeFilters, setActiveFilters] = useState({});
    const location = useLocation();
    const params = useParams();

    const {
        currentPage,
        limit,
        offset,
        handlePageChange,
        setTotalItems,
        totalPages,
    } = useDataTable({ initialLimit: PAGE_LIMIT });

    const { loading, error, data } = useQuery(GET_PRODUCTS_QUERY, {
        variables: { filter: activeFilters, limit: limit, offset: offset },
        fetchPolicy: 'cache-and-network', // Đổi lại để tận dụng cache
        notifyOnNetworkStatusChange: true,
        onCompleted: (queryData) => {
            const count = queryData?.products?.count;
            if (typeof count === 'number') {
                setTotalItems(count);
            } else {
                setTotalItems(0);
            }
        },
        onError: (err) => {
            console.error("Error fetching products query:", err);
        }
    });

    const products = data?.products?.products || [];
    const totalProducts = data?.products?.count || 0;

    const handleFilterChange = useCallback((newFiltersFromComponent) => {
        setActiveFilters(newFiltersFromComponent);
        handlePageChange(1); // Reset page, triggers useQuery via offset change
    }, [handlePageChange]);

    useEffect(() => {
        // --- BẠN CẦN ĐIỀU CHỈNH LOGIC Ở ĐÂY CHO PHÙ HỢP ---
        const newFiltersFromUrl = {};
        // Ví dụ logic:
        if (location.pathname.startsWith('/accessories')) {
             newFiltersFromUrl.categoryId = '3'; // ID thực tế
         } else if (location.pathname.startsWith('/new-arrivals')) {
             newFiltersFromUrl.isNewArrival = true;
         } else if (location.pathname.startsWith('/collections')) {
              const searchParams = new URLSearchParams(location.search);
              const categoryId = searchParams.get('category');
              const sizeId = searchParams.get('size');
              const colorId = searchParams.get('color');
              if (categoryId) newFiltersFromUrl.categoryId = categoryId;
              if (sizeId) newFiltersFromUrl.sizeId = sizeId;
              if (colorId) newFiltersFromUrl.colorId = colorId;
          }
         // ... thêm logic khác nếu cần ...

        // Chỉ cập nhật state nếu filter mới từ URL khác filter hiện tại
        if (JSON.stringify(newFiltersFromUrl) !== JSON.stringify(activeFilters)) {
            setActiveFilters(newFiltersFromUrl);
            handlePageChange(1); // Reset page, triggers useQuery via offset change
        }
    // Chỉ re-run effect khi location thay đổi (hoặc params nếu dùng)
    }, [location.pathname, location.search, params, handlePageChange]); // Bỏ activeFilters khỏi đây


    return (
        <Container className="my-4 my-md-5">
            <div className="collection-hero mb-4" style={{ height: '300px', backgroundImage: `url('https://via.placeholder.com/1920x400/333333/FFFFFF?text=Collections+Banner')`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '0.25rem' }}>
            </div>

            <Row>
                <Col lg={3} className="mb-4 mb-lg-0">
                    <ProductFilter initialFilters={activeFilters} onFilterChange={handleFilterChange} />
                </Col>

                <Col lg={9}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="h4 mb-0">All Products</h2>
                        <small className="text-muted">{totalProducts} results</small>
                    </div>

                    {loading && <LoadingSpinner />}
                    {error && <AlertMessage variant="danger">Error loading products: {error.message}</AlertMessage>}
                    {!loading && !error && products.length === 0 && (
                        <AlertMessage variant="info">No products found matching your criteria.</AlertMessage>
                    )}
                    {!loading && !error && products.length > 0 && (
                        <>
                            <ProductGrid products={products} loading={loading} />
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default CollectionsPage;