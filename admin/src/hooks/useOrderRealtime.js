import { useEffect, useCallback, useRef } from 'react';
import { useSubscription, useQuery, useMutation } from '@apollo/client';
import { 
  ORDER_UPDATED_SUBSCRIPTION, 
  NEW_ORDER_SUBSCRIPTION 
} from '../api/subscriptions/orderSubscriptions';
import { 
  UPDATE_ORDER_STATUS_MUTATION,
  UPDATE_PAYMENT_STATUS_MUTATION 
} from '../api/mutations/orderMutations';
import { GET_ORDERS_QUERY } from '../api/queries/orderQueries';
import { useToast } from './useToast';
import { useSound } from './useSound';
import logger from '../utils/logger';

export const useOrderRealtime = () => {
  const { showToast } = useToast();
  const { playNotification } = useSound();
  const notifiedOrders = useRef(new Set());

  // Query hiện tại cho orders
  const { data: ordersData, loading, refetch } = useQuery(GET_ORDERS_QUERY, {
    variables: { 
      limit: 20, 
      offset: 0,
      filter: { status: "PENDING" } 
    },
    fetchPolicy: 'cache-and-network'
  });

  // Mutations
  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS_MUTATION);
  const [updatePaymentStatus] = useMutation(UPDATE_PAYMENT_STATUS_MUTATION);

  // Subscription cho order updates
  const { data: updatedOrderData } = useSubscription(ORDER_UPDATED_SUBSCRIPTION, {
    onError: (error) => {
      logger.error('Order update subscription error:', error);
      showToast({
        title: 'Lỗi kết nối',
        message: 'Không thể nhận cập nhật đơn hàng real-time',
        type: 'error'
      });
    }
  });

  // Subscription cho new orders
  const { data: newOrderData } = useSubscription(NEW_ORDER_SUBSCRIPTION, {
    onError: (error) => {
      logger.error('New order subscription error:', error);
    }
  });

  // Xử lý order updates
  const handleOrderUpdate = useCallback((updatedOrder) => {
    const { sale_id, sale_status, customer_name, payment_status } = updatedOrder;

    // Kiểm tra xem đã notify cho order này chưa
    if (!notifiedOrders.current.has(sale_id)) {
      playNotification();
      showToast({
        title: `Đơn hàng #${sale_id} đã được cập nhật`,
        message: `
          ${customer_name ? `Khách hàng: ${customer_name}` : ''}
          Trạng thái: ${sale_status}
          Thanh toán: ${payment_status}
        `,
        type: 'info',
        duration: 5000
      });
      notifiedOrders.current.add(sale_id);

      // Xóa khỏi danh sách đã notify sau 5 phút
      setTimeout(() => {
        notifiedOrders.current.delete(sale_id);
      }, 300000);
    }

    // Refresh danh sách orders nếu cần
    refetch();
  }, [showToast, playNotification, refetch]);

  // Xử lý new orders
  const handleNewOrder = useCallback((newOrder) => {
    const { sale_id, customer_name, total_amount } = newOrder;

    playNotification();
    showToast({
      title: 'Đơn hàng mới!',
      message: `
        Mã đơn: #${sale_id}
        Khách hàng: ${customer_name}
        Tổng tiền: ${new Intl.NumberFormat('vi-VN', { 
          style: 'currency', 
          currency: 'VND' 
        }).format(total_amount)}
      `,
      type: 'success',
      duration: 7000
    });

    // Refresh danh sách orders
    refetch();
  }, [showToast, playNotification, refetch]);

  // Update handlers
  useEffect(() => {
    if (updatedOrderData?.orderUpdated) {
      handleOrderUpdate(updatedOrderData.orderUpdated);
    }
  }, [updatedOrderData, handleOrderUpdate]);

  useEffect(() => {
    if (newOrderData?.newOrder) {
      handleNewOrder(newOrderData.newOrder);
    }
  }, [newOrderData, handleNewOrder]);

  // Methods để update order
  const updateOrder = async (orderId, status) => {
    try {
      await updateOrderStatus({
        variables: { 
          id: orderId,
          status
        }
      });
      showToast({
        title: 'Cập nhật thành công',
        message: `Đơn hàng #${orderId} đã được cập nhật thành ${status}`,
        type: 'success'
      });
    } catch (error) {
      logger.error('Error updating order:', error);
      showToast({
        title: 'Lỗi cập nhật',
        message: error.message,
        type: 'error'
      });
    }
  };

  const updatePayment = async (orderId, status) => {
    try {
      await updatePaymentStatus({
        variables: {
          id: orderId,
          status
        }
      });
      showToast({
        title: 'Cập nhật thanh toán thành công',
        message: `Trạng thái thanh toán đơn #${orderId} đã được cập nhật`,
        type: 'success'
      });
    } catch (error) {
      logger.error('Error updating payment status:', error);
      showToast({
        title: 'Lỗi cập nhật',
        message: error.message,
        type: 'error'
      });
    }
  };

  return {
    orders: ordersData?.orders || [],
    loading,
    updateOrder,
    updatePayment,
    refetch
  };
};