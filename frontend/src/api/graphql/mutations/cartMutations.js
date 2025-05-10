import { gql } from '@apollo/client';

// Đảm bảo input $items giờ đây có thể nhận SaleItemInput với sizeId, colorId
export const CREATE_SALE_MUTATION = gql`
  mutation CreateSale($items: [SaleItemInput!]!) {
    createSale(items: $items) {
      sale_id
      sale_date
      sale_status
      totals {
        total_amount
      }
      customer {
        customer_id
        virtual_balance
      }
      # Có thể bỏ items ở đây nếu không cần hiển thị lại ngay sau khi đặt
      # items {
      #   sale_item_id
      #   product_qty
      #   price_at_sale
      #   discount_amount
      #   product { product_id product_name }
      #   size { size_id size_name }
      #   color { color_id color_name }
      # }
    }
  }
`;