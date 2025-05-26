// user/src/pages/Auth/LoginPage.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext'; // Hook useAuth
import AuthForm from '../../components/auth/AuthForm'; // Component AuthForm đã tạo
import { APP_NAME } from '../../utils/constants'; // APP_NAME
import AlertMessage from '../../components/common/AlertMessage'; // Để hiển thị lỗi nếu AuthForm không xử lý

// Có thể tạo file CSS riêng cho AuthPages nếu cần, hoặc dùng 100% Tailwind
// import './AuthPages.css';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, login, isLoading, authError, clearAuthError } = useAuth();

  const from = location.state?.from?.pathname || '/'; // Trang sẽ chuyển hướng đến sau khi login

  useEffect(() => {
    if (authState.isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [authState.isAuthenticated, navigate, from]);

  const handleLoginSubmit = async (formData) => {
    // formData = { email, password }
    await login(formData.email, formData.password);
    // Việc chuyển hướng đã được xử lý bởi useEffect ở trên
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          {/* Thay thế bằng logo của bạn nếu có */}
          <h1 className="text-4xl font-bold text-indigo-600">{APP_NAME}</h1>
        </Link>
        <h2 className="mt-6 text-center text-2xl md:text-3xl font-extrabold text-gray-900">
          {t('auth.loginTitle', 'Đăng nhập vào tài khoản')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('auth.noAccountPrompt', 'Chưa có tài khoản?')}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 ml-1">
            {t('auth.registerLink', 'Đăng ký ngay')}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {/* Hiển thị lỗi ở đây nếu AuthForm không tự hiển thị */}
          {/* {authError && !isLoading && <AlertMessage type="error" message={authError} onClose={clearAuthError} className="mb-4" />} */}
          
          <AuthForm
            formType="login"
            onSubmit={handleLoginSubmit}
            loading={isLoading}
            error={authError} // Truyền lỗi từ AuthContext xuống AuthForm
            clearError={clearAuthError} // Truyền hàm xóa lỗi xuống AuthForm
          />
          
          {/* (Tùy chọn) Social Logins */}
          {/* <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('auth.orContinueWith', 'Hoặc tiếp tục với')}</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3"> // Hoặc grid-cols-2 nếu có nhiều
              <button
                // onClick={handleGoogleLogin}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Sign in with Google</span>
                <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">...</svg> Google Icon
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;