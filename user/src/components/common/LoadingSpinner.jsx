import React from 'react';
import { useTranslation } from 'react-i18next';

const LoadingSpinner = ({
  size = 'md', // xs, sm, md, lg, xl
  color = 'text-indigo-600', // Tailwind text color class
  className = '', // Additional classes for the container
  message, // Optional message to display
  messageClassName = 'ml-2 text-sm text-gray-600', // Classes for the message
}) => {
  const { t } = useTranslation();

  const sizeClasses = {
    xs: 'h-4 w-4 border-2',
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4',
  };

  // Ensure the border color is applied correctly and transparent part is different
  const borderColorClass = color.replace('text-', 'border-'); // e.g., text-indigo-600 -> border-indigo-600
  
  // Spinner itself will have the main color, with one segment transparent
  const spinnerClasses = `animate-spin rounded-full border-t-transparent ${sizeClasses[size] || sizeClasses.md} ${borderColorClass}`;

  return (
    <div
      className={`flex justify-center items-center ${className}`}
      role="status" // For accessibility
      aria-live="polite" // Announce changes politely
    >
      <div className={spinnerClasses}>
        {/* Screen reader only text */}
        <span className="sr-only">{t('common.loading', 'Loading...')}</span>
      </div>
      {message && (
        <p className={messageClassName}>
          {/* If message is a string, display it. Otherwise, use a default translated loading message. */}
          {typeof message === 'string' ? message : t('common.loading', 'Loading...')}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;