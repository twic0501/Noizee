import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Check } from 'lucide-react'; // Using lucide-react icons
import PropTypes from 'prop-types';
// No need for ProductFilter.css if all styles are handled by Tailwind.

const ProductFilter = ({
    isOpen,
    onClose,
    onApplyFilters,
    onClearFilters,
    initialFilters = {},
    availableCategories = [],
    availableColors = [],
    availableSizes = [],
    loadingOptions = false,
}) => {
    const { t } = useTranslation();

    const [isInStock, setIsInStock] = useState(initialFilters?.inStock ?? true);
    const [selectedCategories, setSelectedCategories] = useState(initialFilters?.categories ?? []);
    const [selectedColors, setSelectedColors] = useState(initialFilters?.colors ?? []);
    const [selectedSizes, setSelectedSizes] = useState(initialFilters?.sizes ?? []);

    const initialCategoryShowCount = 5;
    const initialColorShowCount = 5;
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [showAllColors, setShowAllColors] = useState(false);

    useEffect(() => {
        setIsInStock(initialFilters?.inStock ?? true);
        setSelectedCategories(initialFilters?.categories ?? []);
        setSelectedColors(initialFilters?.colors ?? []);
        setSelectedSizes(initialFilters?.sizes ?? []);
    }, [initialFilters]);

    const handleCategoryChange = (categoryId) => setSelectedCategories((prev) => prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]);
    const handleColorChange = (colorId) => setSelectedColors((prev) => prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]);
    const handleSizeChange = (sizeId) => setSelectedSizes((prev) => prev.includes(sizeId) ? prev.filter((id) => id !== sizeId) : [...prev, sizeId]);

    const handleApply = () => {
        const filtersToApply = {
            inStock: isInStock,
            categories: selectedCategories,
            colors: selectedColors,
            sizes: selectedSizes,
        };
        if (onApplyFilters) onApplyFilters(filtersToApply);
        if (onClose) onClose();
    };

    const handleClear = () => {
        setIsInStock(true);
        setSelectedCategories([]);
        setSelectedColors([]);
        setSelectedSizes([]);
        if (onClearFilters) onClearFilters();
    };

    const visibleCategories = showAllCategories ? availableCategories : availableCategories.slice(0, initialCategoryShowCount);
    const visibleColors = showAllColors ? availableColors : availableColors.slice(0, initialColorShowCount);

    const renderLoading = () => <div className="text-neutral-400 text-xs py-2">{t('common.loading', 'Đang tải...')}</div>;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end" aria-labelledby="filter-panel-title" role="dialog" aria-modal="true">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-black/60 transition-opacity" onClick={onClose}></div>

            {/* Filter Panel */}
            <div className="relative flex flex-col w-4/5 max-w-xs sm:max-w-sm h-full bg-black text-neutral-100 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                    <h2 id="filter-panel-title" className="text-base sm:text-lg font-semibold uppercase text-white">
                        {t('filter.title', 'Filter')}
                    </h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white">
                        <span className="sr-only">{t('common.close', 'Close')}</span>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-grow overflow-y-auto p-4 space-y-5 custom-scrollbar-dark"> {/* Added custom-scrollbar-dark */}
                    {/* In Stock Filter */}
                    <div>
                        <label className="flex items-center justify-between cursor-pointer py-1">
                            <span className="text-xs sm:text-sm uppercase tracking-wider text-neutral-200">
                                {t('filter.allProducts', 'ALL PRODUCTS')}
                            </span>
                            <div className="flex items-center">
                                <span className="mr-2 text-xs sm:text-sm text-neutral-400">
                                    {t('filter.inStockOnly', 'IN STOCK')}
                                </span>
                                <input
                                    type="checkbox"
                                    checked={isInStock}
                                    onChange={() => setIsInStock(!isInStock)}
                                    className="h-4 w-4 sm:h-5 sm:w-5 rounded bg-neutral-700 border-neutral-600 text-white focus:ring-white focus:ring-offset-black accent-neutral-500 disabled:opacity-50"
                                    disabled={loadingOptions}
                                />
                            </div>
                        </label>
                    </div>
                    <hr className="border-neutral-700" />

                    {/* Category Filter */}
                    <div>
                        <h3 className="text-xs sm:text-sm uppercase tracking-wider text-neutral-400 mb-2.5">
                            {t('filter.categories', 'Category')}
                        </h3>
                        {loadingOptions ? renderLoading() : (
                            <>
                                <div className="space-y-1.5">
                                    {visibleCategories.map((category) => (
                                        <label key={category.category_id || category.id} className="flex items-center space-x-2.5 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(category.category_id || category.id)}
                                                onChange={() => handleCategoryChange(category.category_id || category.id)}
                                                className="hidden"
                                            />
                                            <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 border border-neutral-500 rounded-sm flex items-center justify-center group-hover:border-neutral-300 ${selectedCategories.includes(category.category_id || category.id) ? 'bg-white border-white' : ''}`}>
                                                {selectedCategories.includes(category.category_id || category.id) && <Check size={10} className="text-black" />}
                                            </span>
                                            <span className="text-neutral-200 group-hover:text-white text-xs sm:text-sm">{category.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {availableCategories.length > initialCategoryShowCount && (
                                    <button onClick={() => setShowAllCategories(!showAllCategories)} className="mt-1.5 flex items-center text-neutral-400 hover:text-white text-xs sm:text-sm">
                                        <Plus size={14} className="mr-1" /> {showAllCategories ? t('filter.viewLess', 'View Less') : t('filter.viewMore', 'View More')}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    <hr className="border-neutral-700" />

                    {/* Color Filter */}
                    <div>
                        <h3 className="text-xs sm:text-sm uppercase tracking-wider text-neutral-400 mb-2.5">
                            {t('filter.color', 'Color')}
                        </h3>
                        {loadingOptions ? renderLoading() : (
                           <>
                            <div className="space-y-1.5">
                                {visibleColors.map((color) => (
                                    <label key={color.color_id || color.id} className="flex items-center space-x-2.5 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={selectedColors.includes(color.color_id || color.id)}
                                            onChange={() => handleColorChange(color.color_id || color.id)}
                                            className="hidden"
                                        />
                                        <span
                                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 ${selectedColors.includes(color.color_id || color.id) ? 'border-white ring-1 ring-white ring-offset-1 ring-offset-black' : 'border-neutral-600 group-hover:border-neutral-400'}`}
                                            style={{ backgroundColor: color.color_hex || color.hex }}
                                            title={color.name}
                                        ></span>
                                        <span className="text-neutral-200 group-hover:text-white text-xs sm:text-sm">{color.name}</span>
                                    </label>
                                ))}
                            </div>
                            {availableColors.length > initialColorShowCount && (
                                    <button onClick={() => setShowAllColors(!showAllColors)} className="mt-1.5 flex items-center text-neutral-400 hover:text-white text-xs sm:text-sm">
                                        <Plus size={14} className="mr-1" /> {showAllColors ? t('filter.viewLess', 'View Less') : t('filter.viewMore', 'View More')}
                                    </button>
                                )}
                           </>
                        )}
                    </div>
                    <hr className="border-neutral-700" />

                    {/* Size Filter */}
                    <div>
                        <h3 className="text-xs sm:text-sm uppercase tracking-wider text-neutral-400 mb-2.5">
                            {t('filter.size', 'Size')}
                        </h3>
                        {loadingOptions ? renderLoading() : (
                            <div className="flex flex-wrap gap-1.5">
                                {availableSizes.map((size) => (
                                    <button
                                        key={size.size_id || size.id}
                                        onClick={() => handleSizeChange(size.size_id || size.id)}
                                        className={`px-2.5 py-1 border rounded-md text-xs sm:text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-opacity-50 ${selectedSizes.includes(size.size_id || size.id) ? 'bg-white text-black border-white focus:ring-white' : 'bg-neutral-700 text-neutral-300 border-neutral-600 hover:bg-neutral-600 hover:text-white focus:ring-neutral-500'}`}
                                    >
                                        {size.size_name || size.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-neutral-700 space-y-2.5">
                    <button
                        onClick={handleApply}
                        className="w-full bg-white text-black py-2.5 px-4 rounded-md font-semibold hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-opacity-50 transition-colors duration-150 uppercase text-xs sm:text-sm tracking-wider"
                    >
                        {t('filter.viewItems', 'View Items')}
                    </button>
                    <button
                        onClick={handleClear}
                        className="w-full text-neutral-400 hover:text-white py-2 px-4 rounded-md font-medium focus:outline-none uppercase text-xs sm:text-sm tracking-wider"
                    >
                        {t('filter.clearAll', 'Clear')}
                    </button>
                </div>
            </div>
        </div>
    );
};

ProductFilter.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onApplyFilters: PropTypes.func.isRequired,
    onClearFilters: PropTypes.func.isRequired,
    initialFilters: PropTypes.object,
    availableCategories: PropTypes.arrayOf(PropTypes.shape({
        category_id: PropTypes.any.isRequired, // Or specific type if known e.g., string, number
        id: PropTypes.any, // Fallback if category_id is not present
        name: PropTypes.string.isRequired,
    })),
    availableColors: PropTypes.arrayOf(PropTypes.shape({
        color_id: PropTypes.any.isRequired,
        id: PropTypes.any,
        name: PropTypes.string.isRequired,
        color_hex: PropTypes.string, // color_hex or hex
        hex: PropTypes.string,
    })),
    availableSizes: PropTypes.arrayOf(PropTypes.shape({
        size_id: PropTypes.any.isRequired,
        id: PropTypes.any,
        size_name: PropTypes.string, // size_name or name
        name: PropTypes.string,
    })),
    loadingOptions: PropTypes.bool,
};

export default ProductFilter;