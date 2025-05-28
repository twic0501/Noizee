import React from 'react';
import { FiInfo, FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { classNames } from '../../utils/helpers';
import { useTranslation } from 'react-i18next';

const AlertMessage = ({
  type = 'info',
  title,
  message,
  details,
  onClose,
  className = '',
}) => {
  const { t } = useTranslation();
  if (!message && !title) return null;

  let alertTypeClass = '';
  let IconComponent;

  switch (type) {
    case 'success':
      alertTypeClass = 'alert-success';
      IconComponent = FiCheckCircle;
      break;
    case 'warning':
      alertTypeClass = 'alert-warning';
      IconComponent = FiAlertTriangle;
      break;
    case 'error':
      alertTypeClass = 'alert-danger';
      IconComponent = FiXCircle;
      break;
    case 'info':
    default:
      alertTypeClass = 'alert-info';
      IconComponent = FiInfo;
      break;
  }

  return (
    <div
      className={classNames('alert', alertTypeClass, 'd-flex align-items-start shadow-sm print-hidden', className)} // print-hidden từ index.css của bạn
      role="alert"
    >
      {IconComponent && (
        <div className="flex-shrink-0 me-3">
          <IconComponent className="fs-5" aria-hidden="true" />
        </div>
      )}
      <div className="flex-grow-1">
        {title && <h4 className="alert-heading fs-5 fw-semibold">{title}</h4>} {/* Áp dụng font Oswald nếu h4 tự động làm */}
        {message && <p className="mb-1">{message}</p>}
        {details && (
          <div className="mt-2 small">
            {Array.isArray(details) ? (
              <ul className="list-unstyled ps-3">
                {details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            ) : (
              <p>{details}</p>
            )}
          </div>
        )}
      </div>
      {onClose && (
        <div className="ms-auto ps-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-close"
            aria-label={t('common.dismiss', 'Dismiss')}
          ></button>
        </div>
      )}
    </div>
  );
};
export default AlertMessage;