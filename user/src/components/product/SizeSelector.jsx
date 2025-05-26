import React from 'react';
import { useTranslation } from 'react-i18next';
import { classNames } from '../../utils/helpers';

const SizeSelector = ({
  sizes = [], // Mảng các object size, ví dụ: [{ id, name, available: true/false }]
  selectedSize, // object size đang được chọn { id, name }
  onSizeSelect, // (sizeObject) => void
  className = '',
}) => {
  const { t } = useTranslation();

  if (!sizes || sizes.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-800">
            {t('product.size', 'Kích thước')}:
            <span className="ml-1 font-normal text-gray-600">{selectedSize?.name || ''}</span>
        </h4>
        {/* Optional: Size Guide Link */}
        {/* <a href="/size-guide" className="text-xs text-indigo-600 hover:underline">
          {t('product.sizeGuide', 'Hướng dẫn chọn size')}
        </a> */}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {sizes.map((size) => (
          <button
            key={size.id || size.name}
            type="button"
            onClick={() => onSizeSelect(size)}
            disabled={!size.available} // Disable nếu size không có sẵn (ví dụ: hết hàng cho size đó)
            className={classNames(
              'px-3 py-1.5 border rounded-md text-xs font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500',
              selectedSize?.id === size.id || selectedSize?.name === size.name
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
              !size.available && 'opacity-50 cursor-not-allowed bg-gray-100 line-through'
            )}
            aria-label={t('product.selectSize', 'Chọn size {{sizeName}}', { sizeName: size.name })}
            title={size.name}
          >
            {size.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SizeSelector;