// src/components/common/LoadingSpinner.jsx
import React from 'react';
import Spinner from 'react-bootstrap/Spinner';
import { useTranslation } from 'react-i18next'; // << IMPORT

function LoadingSpinner({
  animation = "border",
  size = "md",
  message, // Để message có thể truyền từ ngoài vào và được dịch ở component cha
  variant = "dark",
  className = "d-flex flex-column align-items-center justify-content-center my-5 p-3 text-center"
}) {
  const { t } = useTranslation(); // << SỬ DỤNG HOOK

  // Sử dụng message được truyền vào, nếu không có thì dùng key dịch mặc định
  const displayMessage = message || t('loadingSpinner.loading');
  const accessibilityMessage = message || t('loadingSpinner.contentLoading');


  return (
    <div className={className} role="status" aria-live="polite">
      <Spinner animation={animation} size={size} variant={variant} className={displayMessage ? "mb-2" : ""}>
        {/* Message cho trình đọc màn hình */}
        <span className="visually-hidden">{accessibilityMessage}</span>
      </Spinner>
      {/* Hiển thị message nếu có */}
      {displayMessage && <span className="loading-message">{displayMessage}</span>}
    </div>
  );
}
export default LoadingSpinner;