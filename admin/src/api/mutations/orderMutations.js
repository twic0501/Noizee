import { gql } from '@apollo/client';


export const UPDATE_SALE_STATUS_MUTATION = gql`
  mutation AdminUpdateSaleStatus($saleId: ID!, $status: String!, $notes: String) {
    adminUpdateSaleStatus(saleId: $saleId, status: $status, notes: $notes) {
      sale_id
      sale_status # Trả về trạng thái mới nhất
      # Có thể thêm history nếu cần cập nhật cache
      # history {
      #   history_id
      #   history_date
      #   history_status
      #   history_notes
      # }
    }
  }
`;

