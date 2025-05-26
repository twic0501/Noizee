// user/src/components/auth/ResetPasswordForm.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiLock } from 'react-icons/fi';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';

const ResetPasswordForm = ({ onSubmit, loading, error, successMessage, clearError, token }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (clearError) clearError();
    if (formErrors[name]) {
        setFormErrors(prev => ({...prev, [name]: null}));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.newPassword) errors.newPassword = t('validation.newPasswordRequired');
    else if (formData.newPassword.length < 6) errors.newPassword = t('validation.passwordMinLength', { count: 6 });

    if (!formData.confirmPassword) errors.confirmPassword = t('validation.confirmPasswordRequired');
    else if (formData.newPassword !== formData.confirmPassword) errors.confirmPassword = t('validation.passwordsDoNotMatch');
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({ token, newPassword: formData.newPassword });
    }
  };
  
  const commonInputClasses = "w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400";
  const iconClasses = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 peer-focus:text-indigo-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
          {t('auth.newPasswordLabel')}
        </label>
        <div className="relative mt-1">
            <FiLock className={iconClasses} />
            <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={formData.newPassword}
                onChange={handleChange}
                className={`${commonInputClasses} pl-10 peer`}
                placeholder="••••••••"
            />
        </div>
        {formErrors.newPassword && <p className="mt-1 text-xs text-red-600">{formErrors.newPassword}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          {t('auth.confirmNewPasswordLabel')}
        </label>
        <div className="relative mt-1">
            <FiLock className={iconClasses} />
            <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`${commonInputClasses} pl-10 peer`}
                placeholder="••••••••"
            />
        </div>
        {formErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{formErrors.confirmPassword}</p>}
      </div>

      {error && <AlertMessage type="error" message={error} onClose={clearError} />}
      {successMessage && <AlertMessage type="success" message={successMessage} />}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
        >
          {loading ? <LoadingSpinner size="sm" /> : t('auth.resetPasswordButton')}
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;