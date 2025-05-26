// user/src/pages/Auth/RegisterPage.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import AuthForm from '../../components/auth/AuthForm';
import { APP_NAME } from '../../utils/constants';
// import './AuthPages.css'; // Nếu có CSS chung

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, register, isLoading, authError, clearAuthError } = useAuth();

  // Trang sẽ chuyển hướng đến sau khi đăng ký thành công (thường là trang chủ hoặc trang profile)
  const from = location.state?.from?.pathname || '/'; 

  useEffect(() => {
    if (authState.isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [authState.isAuthenticated, navigate, from]);

  const handleRegisterSubmit = async (formData) => {
    // formData = { firstName, lastName, email, password, phoneNumber?, address? }
    // AuthForm đã chuẩn bị đúng các trường này
    await register(formData); 
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <h1 className="text-4xl font-bold text-indigo-600">{APP_NAME}</h1>
        </Link>
        <h2 className="mt-6 text-center text-2xl md:text-3xl font-extrabold text-gray-900">
          {t('auth.registerTitle', 'Tạo tài khoản mới')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('auth.alreadyHaveAccountPrompt', 'Đã có tài khoản?')}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 ml-1">
            {t('auth.loginLink', 'Đăng nhập tại đây')}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg"> {/* max-w-lg cho form đăng ký có thể rộng hơn */}
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <AuthForm
            formType="register"
            onSubmit={handleRegisterSubmit}
            loading={isLoading}
            error={authError}
            clearError={clearAuthError}
          />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;