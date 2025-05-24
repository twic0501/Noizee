// src/components/common/AlertMessage.jsx
import React from 'react';
import Alert from 'react-bootstrap/Alert';
// Component này chủ yếu nhận `children` đã được dịch từ component cha.
// Không có text nội bộ cần dịch trực tiếp ở đây, trừ khi bạn muốn thêm các thuộc tính aria-label mặc định.

function AlertMessage({ 
    variant = 'danger', 
    children, 
    show = true, 
    onClose, 
    dismissible = false, 
    className = "",
    // Bạn có thể thêm một prop cho aria-label nếu muốn nó có thể dịch được
    // ariaLabelKey // ví dụ: 'alert.info'
}) {
  // const { t } = useTranslation(); // Chỉ cần nếu có text nội bộ hoặc aria-label mặc định cần dịch
  
  if (!show || !children) {
    return null;
  }

  // const alertAriaLabel = ariaLabelKey ? t(ariaLabelKey) : undefined;

  return (
    <Alert
      variant={variant}
      onClose={onClose}
      dismissible={dismissible}
      className={`fade ${className}`}
      // aria-label={alertAriaLabel} // Nếu bạn thêm aria-label có thể dịch
    >
      {children}
    </Alert>
  );
}

export default AlertMessage;