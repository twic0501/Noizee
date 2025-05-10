import React from 'react';
import Spinner from 'react-bootstrap/Spinner';

// Hoặc dùng class CSS
function LoadingSpinner({ animation = "border", size = "sm", message = "Loading..." }) {
  return (
    <div className="d-flex align-items-center justify-content-center my-3">
      <Spinner animation={animation} size={size} role="status" variant="primary" className="me-2">
        <span className="visually-hidden">{message}</span>
      </Spinner>
      <span>{message}</span>
    </div>
  );
}

export default LoadingSpinner;