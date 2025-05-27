// user/src/components/auth/AuthForm.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMail, FiLock, FiUser, FiPhone, FiMapPin, FiEye, FiEyeOff } from 'react-icons/fi'; // Icons

import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';

const AuthForm = ({
  formType = 'login',
  onSubmit,
  loading,
  error, // Lỗi từ AuthContext (ví dụ: email đã tồn tại, sai mật khẩu)
  clearError, // Hàm để xóa lỗi từ AuthContext
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Xử lý khi error prop (từ AuthContext) thay đổi
  useEffect(() => {
    // Nếu có lỗi từ context, chúng ta sẽ hiển thị nó thông qua <AlertMessage/>.
    // Việc xóa lỗi này sẽ được xử lý khi người dùng bắt đầu nhập liệu (handleChange)
    // hoặc khi form được submit lại (handleSubmit).
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Xóa lỗi tổng thể từ context khi người dùng bắt đầu sửa form
    if (error && typeof clearError === 'function') {
      clearError();
    }
    
    // Xóa lỗi của trường cụ thể đang được sửa
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^\S+@\S+\.\S+$/;

    // Validation cho email (bắt buộc cho cả login và register)
    if (!formData.email.trim()) {
      errors.email = t('validation.emailRequired', 'Email là bắt buộc');
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = t('validation.emailInvalid', 'Email không hợp lệ');
    }

    // Validation cho password (bắt buộc cho cả login và register)
    if (!formData.password) { // Không trim password khi kiểm tra rỗng, nhưng trim khi gửi đi nếu cần
      errors.password = t('validation.passwordRequired', 'Mật khẩu là bắt buộc');
    } else if (formData.password.length < 6) {
      errors.password = t('validation.passwordMinLength', 'Mật khẩu phải có ít nhất 6 ký tự');
    }

    // Validationเฉพาะ cho form đăng ký
    if (formType === 'register') {
      if (!formData.firstName.trim()) {
        errors.firstName = t('validation.firstNameRequired', 'Họ là bắt buộc');
      }
      if (!formData.lastName.trim()) {
        errors.lastName = t('validation.lastNameRequired', 'Tên là bắt buộc');
      }
      if (!formData.phoneNumber.trim()) { // Số điện thoại là bắt buộc
        errors.phoneNumber = t('validation.phoneNumberRequired', 'Số điện thoại là bắt buộc');
      }
      // (Tùy chọn) Thêm validation định dạng số điện thoại (ví dụ: 10 chữ số, bắt đầu bằng 0)
      // else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(formData.phoneNumber.trim())) {
      //   errors.phoneNumber = t('validation.phoneNumberInvalid', 'Số điện thoại không hợp lệ');
      // }

      if (!formData.confirmPassword) {
        errors.confirmPassword = t('validation.confirmPasswordRequired', 'Xác nhận mật khẩu là bắt buộc');
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = t('validation.passwordsDoNotMatch', 'Mật khẩu xác nhận không khớp');
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (error && typeof clearError === 'function') { // Xóa lỗi context cũ trước khi validate và submit
      clearError();
    }
    setFormErrors({}); // Xóa lỗi form cục bộ cũ

    if (validateForm()) {
      const dataToSubmit = {
        email: formData.email.trim(),
        password: formData.password, // Password thường không nên trim() ở client
      };
      if (formType === 'register') {
        dataToSubmit.firstName = formData.firstName.trim();
        dataToSubmit.lastName = formData.lastName.trim();
        dataToSubmit.phoneNumber = formData.phoneNumber.trim();
        dataToSubmit.address = formData.address.trim(); // address có thể rỗng nếu là tùy chọn
      }
      onSubmit(dataToSubmit);
    }
  };

  const commonInputClasses = "w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400";
  const iconClasses = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 peer-focus:text-indigo-500";
  const togglePasswordIconClasses = "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600 cursor-pointer";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {formType === 'register' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              {t('auth.firstNameLabel', 'Họ')} <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <FiUser className={iconClasses} />
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={handleChange}
                className={`${commonInputClasses} pl-10 peer ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={t('auth.firstNamePlaceholder', 'Nhập họ của bạn')}
              />
            </div>
            {formErrors.firstName && <p className="mt-1 text-xs text-red-600">{formErrors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              {t('auth.lastNameLabel', 'Tên')} <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <FiUser className={iconClasses} />
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange}
                className={`${commonInputClasses} pl-10 peer ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={t('auth.lastNamePlaceholder', 'Nhập tên của bạn')}
              />
            </div>
            {formErrors.lastName && <p className="mt-1 text-xs text-red-600">{formErrors.lastName}</p>}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          {t('auth.emailLabel', 'Email')} <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <FiMail className={iconClasses} />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className={`${commonInputClasses} pl-10 peer ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={t('auth.emailPlaceholder', 'your@email.com')}
          />
        </div>
        {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {t('auth.passwordLabel', 'Mật khẩu')} <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <FiLock className={iconClasses} />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={formType === 'login' ? 'current-password' : 'new-password'}
            value={formData.password}
            onChange={handleChange}
            className={`${commonInputClasses} pl-10 peer ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="••••••••"
          />
          <button type="button" className={togglePasswordIconClasses} onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
            {showPassword ? <FiEyeOff size={18}/> : <FiEye size={18}/>}
          </button>
        </div>
        {formErrors.password && <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>}
      </div>

      {formType === 'register' && (
        <>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              {t('auth.confirmPasswordLabel', 'Xác nhận mật khẩu')} <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <FiLock className={iconClasses} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`${commonInputClasses} pl-10 peer ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="••••••••"
              />
              <button type="button" className={togglePasswordIconClasses} onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex="-1">
                {showConfirmPassword ? <FiEyeOff size={18}/> : <FiEye size={18}/>}
              </button>
            </div>
            {formErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{formErrors.confirmPassword}</p>}
          </div>
          
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              {t('auth.phoneNumberLabel', 'Số điện thoại')} <span className="text-red-500">*</span>
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
                className={`${commonInputClasses} pl-10 peer ${formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={t('auth.phoneNumberPlaceholder', 'Nhập số điện thoại')}
              />
            </div>
            {formErrors.phoneNumber && <p className="mt-1 text-xs text-red-600">{formErrors.phoneNumber}</p>}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              {t('auth.addressLabel', 'Địa chỉ')} ({t('common.optional', 'Tùy chọn')})
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
                className={`${commonInputClasses} pl-10 peer ${formErrors.address ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={t('auth.addressPlaceholder', 'Nhập địa chỉ')}
              />
            </div>
            {formErrors.address && <p className="mt-1 text-xs text-red-600">{formErrors.address}</p>}
          </div>
        </>
      )}

      {error && (
        <AlertMessage 
            type="error" 
            message={error} // Lỗi từ context sẽ hiển thị ở đây
            onClose={() => clearError && clearError()} 
        />
      )}
      
      {formType === 'login' && (
        <div className="flex items-center justify-end text-sm">
          <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
            {t('auth.forgotPasswordLink', 'Quên mật khẩu?')}
          </Link>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            formType === 'login' ? t('auth.loginButton', 'Đăng nhập') : t('auth.registerButton', 'Đăng ký')
          )}
        </button>
      </div>
    </form>
  );
};

export default AuthForm;