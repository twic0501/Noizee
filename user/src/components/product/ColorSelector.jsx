import React from 'react';
import { useTranslation } from 'react-i18next';
import { classNames } from '../../utils/helpers';
import { FiCheck } from 'react-icons/fi'; // Icon check cho màu được chọn

const ColorSelector = ({
  colors = [],
  selectedColor, // object màu đang được chọn { id, name, hexCode }
  onColorSelect, // (colorObject) => void
  className = '',
}) => {
  const { t } = useTranslation();

  if (!colors || colors.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-gray-800 mb-2">
        {t('product.color', 'Màu sắc')}:
        <span className="ml-1 font-normal text-gray-600">{selectedColor?.name || ''}</span>
      </h4>
      <div className="flex flex-wrap gap-2 items-center">
        {colors.map((color) => (
          <button
            key={color.id || color.name}
            type="button"
            onClick={() => onColorSelect(color)}
            className={classNames(
              'w-7 h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
              selectedColor?.id === color.id || selectedColor?.name === color.name
                ? 'border-indigo-600 shadow-md'
                : 'border-gray-300 hover:border-gray-400'
            )}
            style={{ backgroundColor: color.hexCode || color.name?.toLowerCase() }} // Fallback tên màu nếu không có hex
            aria-label={t('product.selectColor', 'Chọn màu {{colorName}}', { colorName: color.name })}
            title={color.name}
          >
            {/* Hiển thị dấu check nếu màu được chọn và màu đó không quá tối */}
            {(selectedColor?.id === color.id || selectedColor?.name === color.name) && (
              <FiCheck className="h-4 w-4 text-white mix-blend-difference" /> // mix-blend-difference để check nổi bật trên các màu
            )}
            <span className="sr-only">{color.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ColorSelector;