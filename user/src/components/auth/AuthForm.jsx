// user/src/components/auth/AuthForm.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMail, FiLock, FiUser, FiPhone, FiMapPin } from 'react-icons/fi'; // Icons

import AlertMessage from '../common/AlertMessage'; // Đảm bảo đường dẫn đúng
import LoadingSpinner from '../common/LoadingSpinner'; // Đảm bảo đường dẫn đúng

const AuthForm = ({
  formType = 'login', // 'login' hoặc 'register'
  onSubmit,
  loading,
  error,
  clearError, // Hàm để xóa lỗi từ AuthContext
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '', // Chỉ cho register
    phoneNumber: '', // Tùy chọn cho register
    address: '', // Tùy chọn cho register
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (clearError) clearError(); // Xóa lỗi từ context khi người dùng bắt đầu nhập liệu
    if (formErrors[name]) { // Xóa lỗi validate của field đó
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = t('validation.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = t('validation.emailInvalid');

    if (!formData.password) errors.password = t('validation.passwordRequired');
    else if (formData.password.length < 6) errors.password = t('validation.passwordMinLength', { count: 6 });


    if (formType === 'register') {
      if (!formData.firstName) errors.firstName = t('validation.firstNameRequired');
      if (!formData.lastName) errors.lastName = t('validation.lastNameRequired');
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = t('validation.passwordsDoNotMatch');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSubmit = {
        email: formData.email,
        password: formData.password,
      };
      if (formType === 'register') {
        dataToSubmit.firstName = formData.firstName;
        dataToSubmit.lastName = formData.lastName;
        dataToSubmit.phoneNumber = formData.phoneNumber; // Backend RegisterUserInput có phoneNumber
        dataToSubmit.address = formData.address;       // Backend RegisterUserInput có address
      }
      onSubmit(dataToSubmit);
    }
  };

  const commonInputClasses = "w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400";
  const iconClasses = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 peer-focus:text-indigo-500";


  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formType === 'register' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              {t('auth.firstNameLabel')}
            </label>
            <div className="relative mt-1">
                <FiUser className={iconClasses} />
                <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`${commonInputClasses} pl-10 peer`}
                    placeholder={t('auth.firstNamePlaceholder')}
                />
            </div>
            {formErrors.firstName && <p className="mt-1 text-xs text-red-600">{formErrors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              {t('auth.lastNameLabel')}
            </label>
             <div className="relative mt-1">
                <FiUser className={iconClasses} />
                <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`${commonInputClasses} pl-10 peer`}
                    placeholder={t('auth.lastNamePlaceholder')}
                />
            </div>
            {formErrors.lastName && <p className="mt-1 text-xs text-red-600">{formErrors.lastName}</p>}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          {t('auth.emailLabel')}
        </label>
        <div className="relative mt-1">
            <FiMail className={iconClasses} />
            <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`${commonInputClasses} pl-10 peer`}
                placeholder={t('auth.emailPlaceholder')}
            />
        </div>
        {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {t('auth.passwordLabel')}
        </label>
        <div className="relative mt-1">
            <FiLock className={iconClasses} />
            <input
                id="password"
                name="password"
                type="password"
                autoComplete={formType === 'login' ? 'current-password' : 'new-password'}
                required
                value={formData.password}
                onChange={handleChange}
                className={`${commonInputClasses} pl-10 peer`}
                placeholder="••••••••"
            />
        </div>
        {formErrors.password && <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>}
      </div>

      {formType === 'register' && (
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            {t('auth.confirmPasswordLabel')}
          </label>
          <div className="relative mt-1">
            <FiLock className={iconClasses} />
            <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`${commonInputClasses} pl-10 peer`}
                placeholder="••••••••"
            />
          </div>
          {formErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{formErrors.confirmPassword}</p>}
        </div>
      )}
      
      {formType === 'register' && (
        <>
            <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    {t('auth.phoneNumberLabel')} ({t('common.optional')})
                </label>
                <div className="relative mt-1">
                    <FiPhone className={iconClasses} />
                    <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        autoComplete="tel"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className={`${commonInputClasses} pl-10 peer`}
                        placeholder={t('auth.phoneNumberPlaceholder')}
                    />
                </div>
            </div>
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    {t('auth.addressLabel')} ({t('common.optional')})
                </label>
                <div className="relative mt-1">
                    <FiMapPin className={iconClasses} />
                    <input
                        id="address"
                        name="address"
                        type="text"
                        autoComplete="street-address"
                        value={formData.address}
                        onChange={handleChange}
                        className={`${commonInputClasses} pl-10 peer`}
                        placeholder={t('auth.addressPlaceholder')}
                    />
                </div>
            </div>
        </>
      )}


      {/* Hiển thị lỗi chung từ API (ví dụ: sai mật khẩu, email đã tồn tại) */}
      {error && <AlertMessage type="error" message={error} onClose={clearError} />}
      
      {formType === 'login' && (
        <div className="flex items-center justify-end text-sm">
          <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
            {t('auth.forgotPasswordLink')}
          </Link>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            formType === 'login' ? t('auth.loginButton') : t('auth.registerButton')
          )}
        </button>
      </div>
    </form>
  );
};

export default AuthForm;