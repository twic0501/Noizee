import React from 'react';
import { useTranslation } from 'react-i18next';
import { classNames } from '../../utils/helpers';

const LoadingSpinner = ({
  size = 'md',
  color = 'text-primary',
  className = '',
  message,
  messageClassName = 'ms-2 small text-muted',
}) => {
  const { t } = useTranslation();
  let spinnerSizeClass = '';
  switch (size) {
    case 'xs':
    case 'sm':
      spinnerSizeClass = 'spinner-border-sm';
      break;
    default:
      spinnerSizeClass = '';
      break;
  }
  const spinnerBootstrapClasses = `spinner-border ${spinnerSizeClass} ${color}`;
  return (
    <div
      className={classNames('d-flex justify-content-center align-items-center', className)}
      role="status"
      aria-live="polite"
    >
      <div className={spinnerBootstrapClasses} role="status">
        <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
      </div>
      {message && (
        <p className={classNames(messageClassName)}>
          {typeof message === 'string' ? message : t('common.loading', 'Loading...')}
        </p>
      )}
    </div>
  );
};
export default LoadingSpinner;