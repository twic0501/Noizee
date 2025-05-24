import { useState, useCallback, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { useQuery } from '@apollo/client';
import { GET_PRODUCT_OPTIONS_QUERY } from '../../api/queries/productQueries';

export const useProductFormOptimized = (initialData = null) => {
  const [formData, setFormData] = useState(() => ({
    product_name_vi: initialData?.product_name_vi || '',
    product_name_en: initialData?.product_name_en || '',
    product_description_vi: initialData?.product_description_vi || '',
    product_description_en: initialData?.product_description_en || '',
    product_price: initialData?.product_price || '',
    category_id: initialData?.category_id || '',
    collection_ids: initialData?.collections?.map(c => c.collection_id) || [],
    is_new_arrival: initialData?.is_new_arrival ?? false,
    is_active: initialData?.is_active ?? true,
  }));

  const [colorVariants, setColorVariants] = useState(() => 
    initialData?.color_variants_data || [{
      tempId: Date.now(),
      color_id: '',
      variant_specific_images: [],
      inventory_entries: [{ tempId: Date.now(), size_id: '', quantity: 0, sku: '' }]
    }]
  );

  // Memoize options query
  const { data: optionsData, loading: optionsLoading } = useQuery(GET_PRODUCT_OPTIONS_QUERY, {
    fetchPolicy: 'cache-first'
  });

  // Memoize các options để tránh re-render không cần thiết
  const categories = useMemo(() => optionsData?.adminGetAllCategories || [], [optionsData]);
  const sizes = useMemo(() => optionsData?.adminGetAllSizes || [], [optionsData]);
  const colors = useMemo(() => optionsData?.adminGetAllColors || [], [optionsData]);
  const collections = useMemo(() => optionsData?.adminGetAllCollections || [], [optionsData]);

  // Debounce các hàm update form để tránh re-render liên tục
  const debouncedSetFormData = useCallback(
    debounce((newData) => {
      setFormData(prev => ({ ...prev, ...newData }));
    }, 300),
    []
  );

  // Handler cho các thay đổi form với debounce
  const handleFormChange = useCallback((field, value) => {
    debouncedSetFormData({ [field]: value });
  }, [debouncedSetFormData]);

  // Validate form với useMemo để cache kết quả
  const validateForm = useCallback(() => {
    if (!formData.product_name_vi?.trim()) {
      return "Tên sản phẩm (Tiếng Việt) là bắt buộc";
    }
    // ... các validation khác
    return null;
  }, [formData]);

  return {
    formData,
    colorVariants,
    setColorVariants,
    handleFormChange,
    validateForm,
    options: {
      categories,
      sizes,
      colors,
      collections,
      loading: optionsLoading
    }
  };
};