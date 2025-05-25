// src/components/common/AlertMessage.jsx
import React from 'react';
const AlertMessage = ({ type = 'info', message }) => {
  const baseClasses = 'p-4 rounded-md text-sm';
  const typeClasses = {
    info: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  };
  return <div className={`${baseClasses} ${typeClasses[type] || typeClasses.info}`} role="alert">{message}</div>;
};
export default AlertMessage;