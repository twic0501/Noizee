import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiGift } from 'react-icons/fi';
import { classNames } from '../../utils/helpers';
// import useScrollPosition from '../../hooks/useScrollPosition'; // Bỏ comment nếu muốn logic cuộn

const Lanyard = ({
  messageKey = 'lanyard.defaultMessage',
  defaultMessage = '🎉 Ưu đãi đặc biệt! Miễn phí vận chuyển cho đơn hàng trên 500K! 🎉',
  backgroundColor = 'bg-indigo-600',
  textColor = 'text-white',
  link, // Optional: { textKey, defaultText, path, isExternal }
  closable = true,
  storageKey = 'lanyardDismissed_v1',
  showOnce = false, // True: localStorage, False: sessionStorage (for current session only)
  // scrollThreshold, // Ngưỡng cuộn để hiển thị (ví dụ: 200)
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  // const scrollPosition = useScrollPosition(); // Bỏ comment nếu muốn logic cuộn

  useEffect(() => {
    let shouldShow = true;
    const currentStorage = showOnce ? localStorage : sessionStorage;
    const dismissed = currentStorage.getItem(storageKey);

    if (dismissed === 'true') {
      shouldShow = false;
    }
    setIsVisible(shouldShow);
  }, [storageKey, showOnce]);

  // Logic hiển thị dựa trên cuộn (NẾU KÍCH HOẠT)
  // useEffect(() => {
  //   if (typeof scrollThreshold !== 'number') { // Bỏ qua nếu không có ngưỡng cuộn hợp lệ
  //       // Nếu không có ngưỡng cuộn, isVisible sẽ được quyết định bởi storage ở useEffect trên
  //       return;
  //   }

  //   const currentStorage = showOnce ? localStorage : sessionStorage;
  //   const previouslyDismissed = currentStorage.getItem(storageKey) === 'true';

  //   if (previouslyDismissed) {
  //       setIsVisible(false);
  //       return;
  //   }
    
  //   // Nếu chưa bị đóng và có ngưỡng cuộn
  //   if (scrollPosition > scrollThreshold) {
  //     setIsVisible(true);
  //   } else if (scrollPosition <= scrollThreshold && isVisible && scrollThreshold > 0) {
  //     // Tùy chọn: Ẩn đi khi cuộn lên lại (có thể gây khó chịu nếu không làm mượt)
  //     // setIsVisible(false); 
  //   }
  // }, [scrollPosition, scrollThreshold, storageKey, showOnce, isVisible]);


  const handleClose = () => {
    setIsVisible(false);
    const currentStorage = showOnce ? localStorage : sessionStorage;
    currentStorage.setItem(storageKey, 'true');
  };

  if (!isVisible) {
    return null;
  }

  const message = t(messageKey, defaultMessage);
  const linkText = link?.textKey ? t(link.textKey, link.defaultText || 'Xem ngay') : (link?.defaultText || 'Xem ngay');


  return (
    <div className={classNames("relative z-40 print:hidden", backgroundColor, textColor)}>
      <div className="container mx-auto px-3 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center justify-center sm:justify-start">
            <span className="flex p-1 rounded-lg items-center">
              <FiGift className="h-5 w-5 mr-2" aria-hidden="true" />
            </span>
            <p className="ml-2 font-medium text-sm truncate">
              <span>{message}</span>
              {link?.path && (
                <a
                  href={link.path}
                  target={link.isExternal ? '_blank' : '_self'}
                  rel={link.isExternal ? 'noopener noreferrer' : undefined}
                  className="font-bold underline ml-2 hover:opacity-80 whitespace-nowrap"
                >
                  {linkText}
                </a>
              )}
            </p>
          </div>
          {closable && (
            <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
              <button
                type="button"
                className={classNames(
                  "-mr-1 flex p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2",
                  "hover:bg-white hover:bg-opacity-10"
                )}
                onClick={handleClose}
                aria-label={t('common.close', 'Close')}
              >
                <FiX className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lanyard;