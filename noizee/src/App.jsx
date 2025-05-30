import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import AppRoutes from './routes/AppRoutes';
import LoadingSpinner from './components/common/LoadingSpinner';

// Các component toàn cục có thể được render ở đây
// Ví dụ: CartSliderPanel sẽ lấy state isCartPanelOpen từ CartContext
import CartSliderPanel from './components/cart/CartSliderPanel';
// ProductFilterEnhanced cũng có thể là một panel toàn cục nếu bạn muốn
// import ProductFilterEnhanced from './components/product/ProductFilterEnhanced';
// import { GET_FILTER_OPTIONS } from './api/graphql/queries/productQueries'; // Ví dụ
// import { useQuery } from '@apollo/client'; // Ví dụ

function App() {
    // State cho ProductFilterEnhanced panel (nếu nó là panel toàn cục và không dùng context riêng)
    // const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    // const [filterOptions, setFilterOptions] = useState({ categories: [], colors: [], sizes: [] });
    // const [appliedFiltersForPanel, setAppliedFiltersForPanel] = useState({}); // Để truyền vào ProductFilterEnhanced

    // Ví dụ: Lấy các tùy chọn filter toàn cục (nếu cần)
    // const { data: optionsData, loading: optionsLoading, error: optionsError } = useQuery(GET_FILTER_OPTIONS);
    // useEffect(() => {
    //     if (optionsData) {
    //         setFilterOptions({
    //             categories: optionsData.categories?.items || [],
    //             colors: optionsData.colors || [],
    //             sizes: optionsData.sizes || [],
    //         });
    //     }
    // }, [optionsData]);


    // useEffect để khởi tạo các component Bootstrap JS (Dropdown, Modal, Offcanvas)
    // Điều này tương tự như trong code mẫu của bạn.
    useEffect(() => {
        const initializeBootstrapComponents = () => {
            if (typeof window.bootstrap !== 'undefined') {
                // Khởi tạo Dropdowns
                const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
                dropdownElementList.forEach(function (dropdownToggleEl) {
                    // Chỉ khởi tạo nếu chưa có instance
                    if (!window.bootstrap.Dropdown.getInstance(dropdownToggleEl)) {
                        new window.bootstrap.Dropdown(dropdownToggleEl);
                    }
                });

                // Khởi tạo Modals (nếu bạn dùng Modal của Bootstrap trực tiếp)
                // document.querySelectorAll('.modal').forEach(modalEl => {
                //     if (!window.bootstrap.Modal.getInstance(modalEl)) {
                //         new window.bootstrap.Modal(modalEl);
                //     }
                // });

                // Khởi tạo Offcanvas (ví dụ: CartSliderPanel, ProductFilterEnhanced nếu chúng dùng Bootstrap Offcanvas class)
                // document.querySelectorAll('.offcanvas').forEach(offcanvasEl => {
                //    if (!window.bootstrap.Offcanvas.getInstance(offcanvasEl)) {
                //        new window.bootstrap.Offcanvas(offcanvasEl);
                //    }
                // });
                console.log("Bootstrap components re-initialized if needed.");
            } else {
                // Thử lại nếu Bootstrap JS chưa load kịp
                // console.warn("Bootstrap JS not available yet, retrying init...");
                // setTimeout(initializeBootstrapComponents, 300);
            }
        };

        // Chạy một lần sau khi mount và có thể chạy lại khi một số điều kiện thay đổi nếu cần
        // Tuy nhiên, thường chỉ cần chạy một lần.
        // Nếu các component Bootstrap được thêm/xóa động, bạn có thể cần một cơ chế phức tạp hơn
        // hoặc gọi lại hàm này khi có thay đổi lớn trong DOM.
        const timerId = setTimeout(initializeBootstrapComponents, 200); // Chờ một chút để đảm bảo DOM sẵn sàng

        return () => clearTimeout(timerId);
    }, []); // Chạy một lần sau khi App component mount


    // Hàm này từ code mẫu của bạn, dùng để áp dụng filter từ ProductFilterEnhanced panel
    // Nó sẽ cần được điều chỉnh để cập nhật state filter (có thể nằm trong context hoặc CollectionsPage)
    // const handleApplyPanelFilters = (panelFilters) => {
    //     console.log("Filters to apply from panel:", panelFilters);
    //     // setAppliedFiltersForPanel(panelFilters); // Cập nhật state filter ở đây
    //     // setIsFilterPanelOpen(false);
    // };

    return (
        <Suspense fallback={<LoadingSpinner fullPage />}> {/* Cho i18next và lazy loading pages */}
            <AuthProvider>
                <CartProvider> {/* CartProvider bao gồm cả isCartPanelOpen */}
                    <Router>
                        <AppRoutes /> {/* AppRoutes sẽ render MainLayout và các Pages */}

                        {/* Các Panel Toàn Cục */}
                        <CartSliderPanel
                        // isOpen, onClose, cartItems, etc. sẽ được lấy từ useCart() bên trong component này
                        />

                        {/* Nếu ProductFilterEnhanced là panel toàn cục: */}
                        {/*
                        <ProductFilterEnhanced
                            isOpen={isFilterPanelOpen}
                            onClose={() => setIsFilterPanelOpen(false)}
                            onApplyFilters={handleApplyPanelFilters}
                            availableCategories={filterOptions.categories}
                            availableColors={filterOptions.colors}
                            availableSizes={filterOptions.sizes}
                            initialFilters={appliedFiltersForPanel} // Hoặc state filter hiện tại
                        />
                        */}
                    </Router>
                </CartProvider>
            </AuthProvider>
        </Suspense>
    );
}

export default App;