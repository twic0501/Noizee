// src/components/common/LoadingSpinner.jsx
import React from 'react';
import Spinner from 'react-bootstrap/Spinner';

function LoadingSpinner({
  animation = "border",
  size = "md", // Tăng kích thước mặc định một chút
  message = "Loading...",
  variant = "dark", // Đổi màu mặc định sang đen cho hợp theme
  className = "d-flex flex-column align-items-center justify-content-center my-5 p-3 text-center" // Căn giữa và có khoảng cách lớn hơn
}) {
  return (
    <div className={className} role="status" aria-live="polite">
      <Spinner animation={animation} size={size} variant={variant} className={message ? "mb-2" : ""}>
        <span className="visually-hidden">{message || "Content is loading"}</span>
      </Spinner>
      {message && <span className="loading-message">{message}</span>}
    </div>
  );
}
// Thêm CSS nếu muốn style .loading-message
// .loading-message {
//   font-family: var(--font-family-heading-sub);
//   color: var(--color-text-muted);
//   font-size: 0.9rem;
// }
export default LoadingSpinner;