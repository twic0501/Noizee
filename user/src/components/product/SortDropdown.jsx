// user/src/components/product/SortDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react'; // Using lucide-react icons
import PropTypes from 'prop-types';
// No need for SortDropdown.css if all styles are handled by Tailwind.

const initialSortOptionsData = [
    { id: 'featured', labelKey: 'products.sort.popularity', defaultLabel: 'Featured' },
    { id: 'createdAt_DESC', labelKey: 'products.sort.newest', defaultLabel: 'Newest' },
    { id: 'price_ASC', labelKey: 'products.sort.priceLowToHigh', defaultLabel: 'Price, low to high' },
    { id: 'price_DESC', labelKey: 'products.sort.priceHighToLow', defaultLabel: 'Price, high to low' },
];

const SortDropdown = ({ onSortChange, initialSortBy = 'createdAt', initialSortOrder = 'DESC' }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Determine initial selected option based on props
    const getInitialSelectedOption = () => {
        const currentSortId = initialSortBy === 'featured' ? 'featured' : `${initialSortBy}_${initialSortOrder}`;
        return initialSortOptionsData.find(opt => opt.id === currentSortId) || initialSortOptionsData[0];
    };
    const [selectedSortOption, setSelectedSortOption] = useState(getInitialSelectedOption());

    // Update selected option if initial props change
    useEffect(() => {
        setSelectedSortOption(getInitialSelectedOption());
    }, [initialSortBy, initialSortOrder]);


    const handleSortSelect = (option) => {
        setSelectedSortOption(option);
        setIsOpen(false);
        if (onSortChange) {
            if (option.id === 'featured') {
                onSortChange('featured', null);
            } else {
                const [sortBy, sortOrder] = option.id.split('_');
                onSortChange(sortBy, sortOrder);
            }
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between text-xs sm:text-sm text-black hover:text-neutral-700 border border-neutral-400 rounded-md px-3 py-2 w-40 sm:w-48 bg-white focus:outline-none focus:ring-1 focus:ring-black"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="truncate">
                    {t(selectedSortOption.labelKey, selectedSortOption.defaultLabel)}
                </span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-neutral-400 rounded-md shadow-lg z-20">
                    {/* Optional: Search/Filter within dropdown - not in target design but kept for reference
                    <div className="p-3">
                        <input
                            type="text"
                            placeholder={t('common.filterPlaceholder', "Type to filter...")}
                            className="w-full px-2 py-1.5 border border-neutral-400 rounded-md text-xs sm:text-sm focus:ring-1 focus:ring-black focus:border-black text-black placeholder-neutral-500"
                        />
                    </div>
                    */}
                    <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
                        {initialSortOptionsData.map(option => (
                            <li key={option.id} role="option" aria-selected={selectedSortOption.id === option.id}>
                                <button
                                    onClick={() => handleSortSelect(option)}
                                    className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-neutral-100 focus:outline-none focus:bg-neutral-100 ${selectedSortOption.id === option.id ? 'font-semibold text-black bg-neutral-100' : 'text-neutral-700'}`}
                                >
                                    {t(option.labelKey, option.defaultLabel)}
                                </button>
                            </li>
                        ))}
                    </ul>
                    {/* Price Slider - not in target SortDropdown, was in ProductFilterEnhanced. Keeping this structure simple for Sort. */}
                </div>
            )}
        </div>
    );
};

SortDropdown.propTypes = {
    onSortChange: PropTypes.func.isRequired,
    initialSortBy: PropTypes.string,
    initialSortOrder: PropTypes.string,
};

export default SortDropdown;