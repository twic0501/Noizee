// user/src/pages/Auth/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { RESET_PASSWORD_MUTATION } from '../../api/graphql/authMutations';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm'; // Đã tạo
import { APP_NAME } from '../../utils/constants';
import AlertMessage from '../../components/common/AlertMessage';
import { useAuth } from '../../contexts/AuthContext'; // Để tự động login sau khi reset thành công

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const { token: resetTokenFromUrl } = useParams(); // Lấy token từ URL params
  const navigate = useNavigate();
  const location = useLocation();
  const { login: autoLoginAfterReset, authState } = useAuth();

  const [message, setMessage] = useState('');
  const [errorState, setErrorState] = useState('');

  useEffect(() => {
    if (authState.isAuthenticated) {
        navigate('/', { replace: true}); // Nếu đã login thì về trang chủ
    }
  }, [authState.isAuthenticated, navigate]);

  const [resetPassword, { loading, error: mutationError }] = useMutation(RESET_PASSWORD_MUTATION, {
    onCompleted: (data) => {
      if (data.resetPassword) {
        setMessage(t('auth.passwordResetSuccess'));
        setErrorState('');
        // Tự động đăng nhập nếu backend trả về token và user
        if (data.resetPassword.token && data.resetPassword.user) {
          autoLoginAfterReset(data.resetPassword.token, data.resetPassword.user);
          // useEffect ở trên sẽ xử lý navigate khi isAuthenticated thay đổi
        } else {
          // Nếu không tự động login, có thể chuyển hướng về trang login sau vài giây
          setTimeout(() => navigate('/login'), 3000);
        }
      }
    },
    onError: (err) => {
      setErrorState(err.message || t('auth.passwordResetFailed'));
      setMessage('');
    }
  });

  const handleResetPasswordSubmit = async ({ token, newPassword }) => {
    // token ở đây là resetTokenFromUrl
    setMessage('');
    setErrorState('');
    try {
      await resetPassword({ variables: { token, newPassword } });
    } catch (e) {
      console.error("Reset password submission error:", e);
      setErrorState(t('auth.passwordResetFailed'));
    }
  };
  
  const clearMessages = () => {
    setMessage('');
    setErrorState('');
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <h1 className="text-4xl font-bold text-indigo-600">{APP_NAME}</h1>
        </Link>
        <h2 className="mt-6 text-center text-2xl md:text-3xl font-extrabold text-gray-900">
          {t('auth.resetPasswordTitle', 'Đặt lại mật khẩu')}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {(mutationError?.message || errorState) && !loading && (
            <AlertMessage type="error" message={mutationError?.message || errorState} onClose={clearMessages} className="mb-4" />
          )}
          {message && !loading && (
            <AlertMessage type="success" message={message} className="mb-4" />
          )}

          {!message && ( // Chỉ hiển thị form nếu chưa có thông báo thành công
            <ResetPasswordForm
              token={resetTokenFromUrl} // Truyền token từ URL vào form
              onSubmit={handleResetPasswordSubmit}
              loading={loading}
              successMessage={null}
              clearError={clearMessages}
            />
          )}
          {message && !loading && ( // Hiển thị link login khi thành công
             <div className="mt-6 text-sm text-center">
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                {t('auth.loginLink')}
                </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;