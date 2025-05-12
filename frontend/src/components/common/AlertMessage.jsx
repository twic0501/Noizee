// src/components/common/AlertMessage.jsx
import React from 'react';
import Alert from 'react-bootstrap/Alert';

// variant: 'primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'
function AlertMessage({ variant = 'danger', children, show = true, onClose, dismissible = false, className = "" }) {
  if (!show || !children) { // Nếu không show hoặc không có children thì không render gì cả
    return null;
  }

  return (
    <Alert
      variant={variant}
      onClose={onClose} // Hàm callback khi người dùng đóng Alert (nếu dismissible)
      dismissible={dismissible} // Cho phép đóng Alert hay không
      className={`fade ${className}`} // Thêm class 'fade' để có hiệu ứng mờ dần khi đóng (Bootstrap)
    >
      {children}
    </Alert>
  );
}

export default AlertMessage;