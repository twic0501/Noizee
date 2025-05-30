// src/pages/ProductListingPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// import { SlidersHorizontal } from 'lucide-react'; // Hoặc icon từ react-bootstrap-icons
import { Sliders } from 'react-bootstrap-icons';


import { GET_PRODUCTS_QUERY } from '../api/graphql/productQueries';
import {
    GET_FILTER_CATEGORIES_QUERY,
    GET_FILTER_COLORS_QUERY,
    GET_FILTER_SIZES_QUERY,
    GET_PRICE_RANGE_QUERY // Query để lấy khoảng giá min/max
} from '../api/graphql/filterQueries';

// Các components đã được Bootstrap hóa hoặc sẽ được Bootstrap hóa
import ProductFilterEnhanced from '../components/product/ProductFilterEnhanced';
import SortDropdown from '../components/product/SortDropdown';
import ProductGrid from '../components/product/ProductGrid'; // Cần đảm bảo ProductGrid cũng dùng Bootstrap
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import { ITEMS_PER_PAGE_DEFAULT } from '../utils/constants';
import { useCart } from '../contexts/CartContext'; // Để xử lý addToCart từ ProductCard

const ProductListingPage = ({
    pageType = 'all', // 'all', 'category', 'collection'
    // slug, // categorySlug hoặc collectionSlug (nếu pageType is category/collection) - sẽ lấy từ params nếu cần
    pageTitleKey, // i18n key for page title
    pageTitleDefault, // Default title if key not found or not provided
    // filterId, // category_id or collection_id to pre-filter by - sẽ lấy từ params nếu cần
}) => {
    const { t, i18n } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation(); // Để lấy slug từ pathname nếu cần
    const navigate = useNavigate(); // Để điều hướng chi tiết sản phẩm
    const { addToCart, isLoading: cartLoading } = useCart(); // Lấy hàm addToCart

    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const currentLang = i18n.language || 'vi';

    // Trích xuất slug và filterId từ location.pathname nếu cần (cho trang category/collection)
    const pathSegments = location.pathname.split('/').filter(Boolean); // ['categories', 'ao-thun'] hoặc ['collections', 'summer-vibes']
    let derivedPageType = pageType;
    let slugFromPath = null;
    let staticFilter = {}; // Filter cố định dựa trên URL (ví dụ: category_id)

    if (pathSegments.length >= 2) {
        if (pathSegments[0] === 'categories' && pathSegments[1]) {
            derivedPageType = 'category';
            slugFromPath = pathSegments[1];
            // Giả sử bạn có một cách để map slugFromPath sang category_id nếu backend yêu cầu ID
            // staticFilter = { categorySlug: slugFromPath }; // Hoặc categoryId nếu có
        } else if (pathSegments[0] === 'collections' && pathSegments[1]) {
            derivedPageType = 'collection';
            slugFromPath = pathSegments[1];
            // staticFilter = { collectionSlug: slugFromPath }; // Hoặc collectionId nếu có
        }
    }


    // Đọc filters từ URL params
    const initialFilters = useMemo(() => {
        const params = {
            inStock: searchParams.get('inStock') ? searchParams.get('inStock') === 'true' : true,
            categories: searchParams.get('categories')?.split(',') || [],
            colors: searchParams.get('colors')?.split(',') || [],
            sizes: searchParams.get('sizes')?.split(',') || [],
            minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice'), 10) : undefined,
            maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice'), 10) : undefined,
        };
        return params;
    }, [searchParams]);

    const [activeFilters, setActiveFilters] = useState(initialFilters);

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const itemsPerPage = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE_DEFAULT), 10);
    const currentSortBy = searchParams.get('sortBy') || 'createdAt'; // Mặc định là 'createdAt' (mới nhất)
    const currentSortOrder = searchParams.get('sortOrder') || 'DESC';


    // Fetch filter options
    const { data: categoriesData, loading: categoriesLoading } = useQuery(GET_FILTER_CATEGORIES_QUERY, { variables: { lang: currentLang } });
    const { data: colorsData, loading: colorsLoading } = useQuery(GET_FILTER_COLORS_QUERY, { variables: { lang: currentLang } });
    const { data: sizesData, loading: sizesLoading } = useQuery(GET_FILTER_SIZES_QUERY);
    const { data: priceRangeData, loading: priceRangeLoading } = useQuery(GET_PRICE_RANGE_QUERY); // Lấy min/max price
    const loadingFilterOptions = categoriesLoading || colorsLoading || sizesLoading || priceRangeLoading;

    const availableCategories = categoriesData?.categories || [];
    const availableColors = colorsData?.publicGetAllColors || [];
    const availableSizes = sizesData?.sizes || [];
    const globalMinPrice = priceRangeData?.productPriceRange?.min ?? 0;
    const globalMaxPrice = priceRangeData?.productPriceRange?.max ?? 10000000; // Cần giá trị mặc định hợp lý

    // Cập nhật activeFilters khi initialFilters (từ URL) thay đổi
    useEffect(() => {
        setActiveFilters(initialFilters);
    }, [initialFilters]);


    const buildGraphQLFilter = useCallback(() => {
        const gqlFilter = { ...staticFilter }; // Bắt đầu với filter cố định từ URL

        if (activeFilters.categories?.length > 0) {
            // Giả sử backend filter theo mảng category_ids
            // Nếu pageType là 'category' và staticFilter đã có categorySlug/Id, bạn có thể không cần thêm ở đây
            // hoặc đây là filter con trong category đó.
            // gqlFilter.categoryIds = activeFilters.categories;
            // Hiện tại GET_PRODUCTS_QUERY của bạn nhận filter.category_id (số ít)
            // Nếu bạn muốn filter theo nhiều category, backend cần hỗ trợ mảng ID.
            // Tạm thời lấy category đầu tiên nếu có nhiều:
            if (activeFilters.categories[0]) {
                 gqlFilter.category_id = activeFilters.categories[0];
            }
        }
        if (activeFilters.colors?.length > 0) {
            gqlFilter.color_ids = activeFilters.colors; // Giả sử backend hỗ trợ mảng color_ids
        }
        if (activeFilters.sizes?.length > 0) {
            gqlFilter.size_ids = activeFilters.sizes; // Giả sử backend hỗ trợ mảng size_ids
        }
        if (activeFilters.inStock !== undefined) {
            gqlFilter.in_stock = activeFilters.inStock;
        }
        if (activeFilters.minPrice !== undefined) {
            gqlFilter.min_price = activeFilters.minPrice;
        }
        if (activeFilters.maxPrice !== undefined) {
            gqlFilter.max_price = activeFilters.maxPrice;
        }
        // Thêm các filter khác như searchTerm nếu có
        return gqlFilter;
    }, [activeFilters, staticFilter]);

    const queryVariables = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        lang: currentLang,
        filter: buildGraphQLFilter(),
        sortBy: currentSortBy, // Truyền biến sắp xếp
        sortOrder: currentSortOrder, // Truyền thứ tự sắp xếp
    };

    const { data, loading, error, refetch } = useQuery(GET_PRODUCTS_QUERY, {
        variables: queryVariables,
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
    });

    const products = data?.products?.products || [];
    const totalProducts = data?.products?.count || 0;

    // Hàm cập nhật URL search params
    const updateSearchParams = useCallback((newParams, resetPage = false) => {
        const allParams = new URLSearchParams(searchParams);
        Object.keys(newParams).forEach(key => {
            if (newParams[key] === null || newParams[key] === undefined || (Array.isArray(newParams[key]) && newParams[key].length === 0)) {
                allParams.delete(key);
            } else {
                allParams.set(key, Array.isArray(newParams[key]) ? newParams[key].join(',') : String(newParams[key]));
            }
        });
        if (resetPage) {
            allParams.set('page', '1');
        }
        setSearchParams(allParams, { replace: true });
    }, [searchParams, setSearchParams]);


    const handleApplyPanelFilters = useCallback((newPanelFilters) => {
        setActiveFilters(newPanelFilters); // Cập nhật state ngay lập tức để UI phản hồi
        updateSearchParams({
            categories: newPanelFilters.categories,
            colors: newPanelFilters.colors,
            sizes: newPanelFilters.sizes,
            inStock: newPanelFilters.inStock, // Không cần toString vì updateSearchParams sẽ xử lý
            minPrice: newPanelFilters.minPrice,
            maxPrice: newPanelFilters.maxPrice,
        }, true); // Reset về trang 1 khi áp dụng filter mới
        setShowFilterPanel(false);
    }, [updateSearchParams]);

    const handleClearPanelFilters = useCallback(() => {
        const clearedFilters = { inStock: true, categories: [], colors: [], sizes: [], minPrice: undefined, maxPrice: undefined };
        setActiveFilters(clearedFilters);
        updateSearchParams({
            categories: null, colors: null, sizes: null, inStock: 'true', minPrice: null, maxPrice: null
        }, true);
        setShowFilterPanel(false);
    }, [updateSearchParams]);

    const handleSortChange = useCallback((sortByValue, sortOrderValue) => {
        updateSearchParams({
            sortBy: sortByValue,
            sortOrder: sortOrderValue,
        }, true);
    }, [updateSearchParams]);

    const handlePriceRangeChangeFromSortDropdown = useCallback((priceRange) => {
        // SortDropdown giờ chỉ xử lý maxPrice, nên ta giữ minPrice từ activeFilters hoặc globalMinPrice
        const newMin = activeFilters.minPrice ?? globalMinPrice;
        updateSearchParams({
            minPrice: newMin, // Giữ lại minPrice hiện tại hoặc default
            maxPrice: priceRange.max,
        }, true);
    }, [updateSearchParams, activeFilters.minPrice, globalMinPrice]);


    const handlePageChange = (newPage) => {
        updateSearchParams({ page: newPage.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (activeFilters.inStock === false) count++;
        if (activeFilters.categories?.length > 0) count++; // Đếm là 1 nếu có bất kỳ category nào được chọn
        if (activeFilters.colors?.length > 0) count++;
        if (activeFilters.sizes?.length > 0) count++;
        if (activeFilters.minPrice !== undefined || activeFilters.maxPrice !== undefined) {
            // Chỉ đếm là 1 nếu khoảng giá khác với khoảng giá toàn cục
            if (activeFilters.minPrice !== globalMinPrice || activeFilters.maxPrice !== globalMaxPrice) {
                count++;
            }
        }
        return count;
    }, [activeFilters, globalMinPrice, globalMaxPrice]);

    // Xác định tiêu đề trang
    let title = pageTitleDefault || t('products.allProductsTitle', "Tất cả sản phẩm");
    if (derivedPageType === 'category' && slugFromPath) {
        const category = availableCategories.find(cat => cat.slug === slugFromPath || cat.category_id === slugFromPath);
        title = category ? t('products.productsInCategory', { name: category.name }) : t('products.loadingCategory', 'Đang tải danh mục...');
    } else if (derivedPageType === 'collection' && slugFromPath) {
        // Tương tự, bạn có thể fetch tên collection nếu cần
        title = t('products.productsInCollection', { name: slugFromPath.replace(/-/g, ' ') });
    }
    if (pageTitleKey) {
        title = t(pageTitleKey, { name: slugFromPath || '', defaultValue: title });
    }

    // Xử lý thêm sản phẩm vào giỏ hàng từ ProductCard
    const handleAddToCartFromCard = useCallback(async (product, selectedColorId, selectedSizeId, inventoryId) => {
        if (cartLoading) return;
        // Logic tương tự như trong ProductDetailPage, nhưng ngắn gọn hơn
        const itemToAdd = {
            productId: product.product_id,
            quantity: 1, // Mặc định thêm 1 từ card
            productVariantId: inventoryId, // inventoryId là ID của biến thể cụ thể
        };
        try {
            await addToCart(itemToAdd);
            // Hiển thị toast thành công (ví dụ)
            // toast.success(`${product.name} đã được thêm vào giỏ hàng!`);
            console.log(`${product.name} đã được thêm vào giỏ hàng!`);
        } catch (err) {
            // toast.error("Lỗi khi thêm vào giỏ: " + err.message);
            console.error("Lỗi khi thêm vào giỏ:", err.message);
        }
    }, [addToCart, cartLoading]);

    const handleNavigateToDetail = useCallback((productIdOrSlug) => {
        navigate(`/product/${productIdOrSlug}`);
    }, [navigate]);


    return (
        <div className="bg-white text-dark"> {/* Nền trắng, chữ đen */}
            <div className="container py-4">
                <div className="text-center mb-4">
                    <h1 className="h3 text-uppercase fw-bold text-dark mb-1">
                        {title}
                    </h1>
                    <p className="small text-muted">
                        {(!loading && products.length === 0 && totalProducts === 0 && !error) ? "" :
                          loading && products.length === 0 ? t('products.loadingProducts') :
                            t('products.showingResults', { count: totalProducts, total: totalProducts })
                            // Backend cần trả về totalCount chính xác cho filter hiện tại
                        }
                    </p>
                </div>

                <div className="mb-3 py-3 border-top border-bottom sticky-top bg-white" style={{ top: '70px', zIndex: 1010 }}> {/* Giả sử header cao 70px */}
                    <div className="d-flex justify-content-between align-items-center">
                        <button
                            onClick={() => setShowFilterPanel(true)}
                            className="btn btn-outline-dark btn-sm d-flex align-items-center text-uppercase small"
                        >
                            <Sliders size={14} className="me-2" />
                            {t('filter.title', 'Bộ lọc')}
                            {activeFilterCount > 0 && (
                                 <span className="badge bg-dark text-white rounded-pill ms-2">{activeFilterCount}</span>
                            )}
                        </button>
                        <SortDropdown
                            onSortChange={handleSortChange}
                            onPriceRangeChange={handlePriceRangeChangeFromSortDropdown} // Chỉ xử lý maxPrice từ đây
                            initialSortBy={currentSortBy}
                            initialSortOrder={currentSortOrder}
                            initialPriceRange={{ min: activeFilters.minPrice ?? globalMinPrice, max: activeFilters.maxPrice ?? globalMaxPrice }}
                            availableSortOptions={[
                                { id: 'featured', label: t('products.sort.popularity', 'Phổ biến nhất'), sortBy: 'popularity', sortOrder: 'DESC' },
                                { id: 'newest', label: t('products.sort.newest', 'Mới nhất'), sortBy: 'createdAt', sortOrder: 'DESC' },
                                { id: 'price_asc', label: t('products.sort.priceLowToHigh', 'Giá: Thấp đến Cao'), sortBy: 'price', sortOrder: 'ASC' },
                                { id: 'price_desc', label: t('products.sort.priceHighToLow', 'Giá: Cao đến Thấp'), sortBy: 'price', sortOrder: 'DESC' },
                                // { id: 'name_asc', label: t('products.sort.nameAZ', 'Tên: A-Z'), sortBy: 'name', sortOrder: 'ASC' },
                            ]}
                        />
                    </div>
                </div>

                <main className="w-100">
                    {error && (
                        <AlertMessage type="error" title={t('products.errorLoadingTitle')} message={error.message} className="mb-4"/>
                    )}
                    <ProductGrid
                        products={products}
                        loading={loading}
                        error={null} // Lỗi đã được xử lý ở trên
                        onAddToCart={handleAddToCartFromCard} // Truyền hàm addToCart
                        onNavigateToDetail={handleNavigateToDetail} // Truyền hàm điều hướng
                    />
                    {/* Thông báo không có sản phẩm được ProductGrid xử lý */}

                    {totalProducts > itemsPerPage && !loading && products.length > 0 && (
                        <div className="mt-4 pt-4 border-top">
                           <Pagination
                                currentPage={currentPage}
                                totalItems={totalProducts}
                                itemsPerPage={itemsPerPage}
                                onPageChange={handlePageChange}
                                className="justify-content-center"
                            />
                        </div>
                    )}
                </main>
            </div>

            <ProductFilterEnhanced
                isOpen={showFilterPanel}
                onClose={() => setShowFilterPanel(false)}
                onApplyFilters={handleApplyPanelFilters}
                onClearFilters={handleClearPanelFilters}
                initialFilters={activeFilters} // Truyền activeFilters để panel biết trạng thái hiện tại
                availableCategories={availableCategories}
                availableColors={availableColors}
                availableSizes={availableSizes}
                priceRange={{ min: globalMinPrice, max: globalMaxPrice }} // Truyền khoảng giá min/max toàn cục
                loadingOptions={loadingFilterOptions}
            />
        </div>
    );
};

export default ProductListingPage;
