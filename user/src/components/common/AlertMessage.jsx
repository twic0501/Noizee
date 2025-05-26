import React from 'react';
import { FiInfo, FiAlertTriangle, FiCheckCircle, FiXCircle, FiX } from 'react-icons/fi';
import { classNames } from '../../utils/helpers'; // Đảm bảo bạn đã tạo file này
import { useTranslation } from 'react-i18next';

const AlertMessage = ({
  type = 'info', // 'info', 'success', 'warning', 'error'
  title,         // Optional title for the alert
  message,       // Main message content
  details,       // Optional further details (string or array of strings)
  onClose,       // Optional callback function to close the alert
  className = '',  // Additional classes for the container
  iconSize = 5,    // Corresponds to h-5 w-5 Tailwind classes
}) => {
  const { t } = useTranslation();

  if (!message && !title) return null; // Don't render if no message or title

  let baseTypeClasses = '';
  let iconColorClass = '';
  let IconComponent;
  let closeButtonHoverBg = '';

  switch (type) {
    case 'success':
      baseTypeClasses = 'bg-green-50 text-green-700 border-green-300';
      iconColorClass = 'text-green-500';
      IconComponent = FiCheckCircle;
      closeButtonHoverBg = 'hover:bg-green-100 focus:ring-offset-green-50 focus:ring-green-600';
      break;
    case 'warning':
      baseTypeClasses = 'bg-yellow-50 text-yellow-700 border-yellow-300';
      iconColorClass = 'text-yellow-500';
      IconComponent = FiAlertTriangle;
      closeButtonHoverBg = 'hover:bg-yellow-100 focus:ring-offset-yellow-50 focus:ring-yellow-600';
      break;
    case 'error':
      baseTypeClasses = 'bg-red-50 text-red-800 border-red-300'; // text-red-800 for better contrast
      iconColorClass = 'text-red-500';
      IconComponent = FiXCircle;
      closeButtonHoverBg = 'hover:bg-red-100 focus:ring-offset-red-50 focus:ring-red-600';
      break;
    case 'info':
    default:
      baseTypeClasses = 'bg-blue-50 text-blue-700 border-blue-300';
      iconColorClass = 'text-blue-500';
      IconComponent = FiInfo;
      closeButtonHoverBg = 'hover:bg-blue-100 focus:ring-offset-blue-50 focus:ring-blue-600';
      break;
  }

  return (
    <div
      className={classNames('p-4 rounded-md border flex items-start space-x-3 shadow-sm print:hidden', baseTypeClasses, className)}
      role="alert"
    >
      {IconComponent && (
        <div className="flex-shrink-0">
          <IconComponent className={classNames(`h-${iconSize} w-${iconSize}`, iconColorClass)} aria-hidden="true" />
        </div>
      )}
      <div className="flex-1 text-sm">
        {title && <h3 className="font-medium mb-1">{title}</h3>}
        {message && <p>{message}</p>}
        {details && (
          <div className="mt-2 text-xs opacity-90">
            {Array.isArray(details) ? (
              <ul className="list-disc space-y-1 pl-5">
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
        <div className="ml-auto pl-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={classNames(
              '-mx-1.5 -my-1.5 p-1.5 inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2',
              baseTypeClasses.split(' ')[1], // Use the text color from baseTypeClasses
              closeButtonHoverBg
            )}
            aria-label={t('common.dismiss', 'Dismiss')}
          >
            <span className="sr-only">{t('common.dismiss', 'Dismiss')}</span>
            <FiX className={`h-${iconSize-1} w-${iconSize-1}`} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertMessage;