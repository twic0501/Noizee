// user/src/pages/Account/OrderHistoryPage.jsx
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom'; // Để quản lý state phân trang trên URL

import { GET_MY_ORDERS_QUERY } from '../../api/graphql/orderQueries'; // Đã tạo
import OrderHistoryTable from '../../components/orders/OrderHistoryTable'; // Đã tạo
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { ITEMS_PER_PAGE_DEFAULT } from '../../utils/constants'; // Ví dụ hằng số itemsPerPage

const OrderHistoryPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE_DEFAULT), 10);
  // Thêm state cho sort nếu cần
  // const [sortParams, setSortParams] = useState({ sortBy: 'sale_date', sortOrder: 'DESC' });

  const { data, loading, error, refetch } = useQuery(GET_MY_ORDERS_QUERY, {
    variables: {
      offset: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
      // sortBy: sortParams.sortBy,
      // sortOrder: sortParams.sortOrder,
    },
    fetchPolicy: 'cache-and-network', // Lấy từ cache trước, rồi fetch network để cập nhật
    notifyOnNetworkStatusChange: true, // Để loading state cập nhật đúng khi refetch
  });

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage.toString(), limit: itemsPerPage.toString() });
    // window.scrollTo(0, 0); // Cuộn lên đầu trang khi chuyển trang (tùy chọn)
  };

  // const orders = data?.myOrders?.orders || data?.myOrders || []; // Tùy theo cấu trúc trả về của backend
  // const totalOrders = data?.myOrders?.totalCount || 0;
  
  // GIẢ ĐỊNH backend trả về trực tiếp mảng orders cho GET_MY_ORDERS_QUERY
  // và chúng ta cần một query khác để lấy totalCount hoặc tính totalCount từ độ dài mảng (nếu không có phân trang backend thực sự)
  // Tốt nhất là backend trả về { orders: [...], totalCount: ... }
  // Dùng placeholder data nếu query chưa sẵn sàng
   const placeholderOrders = [
     { id: '1', order_number: 'NOZ-001', sale_date: new Date().toISOString(), status: 'DELIVERED', total_amount: 250000 },
     { id: '2', order_number: 'NOZ-002', sale_date: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'SHIPPED', total_amount: 180000 },
     { id: '3', order_number: 'NOZ-003', sale_date: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'PROCESSING', total_amount: 320000 },
   ];
   const orders = data?.myOrders || placeholderOrders; // Sử dụng placeholder nếu data chưa có
   // Nếu không có totalCount từ backend, và chỉ hiển thị data hiện tại
   // const totalOrders = orders.length; // Sẽ không chính xác cho phân trang thực sự
   // Giả sử backend có totalCount (hoặc một query riêng để lấy)
   const totalOrders = data?.myOrdersTotalCount || placeholderOrders.length * 3; // Placeholder totalCount

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {t('orderHistory.title', 'Lịch sử đơn hàng')}
      </h2>
      {loading && !data && ( // Chỉ hiển thị loading ban đầu
        <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
      )}
      {error && <AlertMessage type="error" message={t('orderHistory.errorLoading')} details={error.message} />}
      
      {!loading && !error && (
        <OrderHistoryTable
          orders={orders}
          // loading={loading} // OrderHistoryTable đã có xử lý loading riêng
          // error={error} // OrderHistoryTable đã có xử lý error riêng
          totalOrders={totalOrders}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default OrderHistoryPage;