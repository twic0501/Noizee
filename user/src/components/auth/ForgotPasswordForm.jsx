// user/src/components/auth/ForgotPasswordForm.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMail } from 'react-icons/fi';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';

const ForgotPasswordForm = ({ onSubmit, loading, error, successMessage, clearError }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (clearError) clearError();
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setFormError(t('validation.emailRequired'));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError(t('validation.emailInvalid'));
      return;
    }
    onSubmit(email);
  };

  const commonInputClasses = "w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400";
  const iconClasses = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 peer-focus:text-indigo-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
                value={email}
                onChange={handleChange}
                className={`${commonInputClasses} pl-10 peer`}
                placeholder={t('auth.emailPlaceholder')}
            />
        </div>
        {formError && <p className="mt-1 text-xs text-red-600">{formError}</p>}
      </div>

      {error && <AlertMessage type="error" message={error} onClose={clearError} />}
      {successMessage && <AlertMessage type="success" message={successMessage} />}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
        >
          {loading ? <LoadingSpinner size="sm" /> : t('auth.sendResetLinkButton')}
        </button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;