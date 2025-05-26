// user/src/pages/Auth/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { REQUEST_PASSWORD_RESET_MUTATION } from '../../api/graphql/authMutations';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm'; // Đã tạo
import { APP_NAME } from '../../utils/constants';
import AlertMessage from '../../components/common/AlertMessage'; // Dùng để hiển thị message thành công/lỗi

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [message, setMessage] = useState(''); // Để hiển thị thông báo thành công hoặc lỗi không từ mutation
  const [errorState, setErrorState] = useState('');

  const [requestPasswordReset, { loading, error: mutationError }] = useMutation(REQUEST_PASSWORD_RESET_MUTATION, {
    onCompleted: (data) => {
      // Backend có thể trả về một message, hoặc chúng ta tự hiển thị message chung
      // Giả sử backend trả về data.requestPasswordReset là một message string
      setMessage(data?.requestPasswordReset || t('auth.passwordResetEmailSent'));
      setErrorState(''); // Xóa lỗi cũ nếu có
    },
    onError: (err) => {
      // Lỗi đã được set vào mutationError, hoặc có thể set errorState riêng
      setErrorState(err.message || t('auth.passwordResetFailedGeneral'));
      setMessage('');
    }
  });

  const handleForgotPasswordSubmit = async (email) => {
    setMessage('');
    setErrorState('');
    try {
      await requestPasswordReset({ variables: { email } });
    } catch (e) {
      // Lỗi network hoặc lỗi không bắt được bởi onError
      console.error("Forgot password submission error:", e);
      setErrorState(t('auth.passwordResetFailedGeneral'));
    }
  };
  
  const clearMessages = () => {
      setMessage('');
      setErrorState('');
      // mutationError không tự clear, nhưng nó sẽ được ghi đè ở lần gọi mutation tiếp theo
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <h1 className="text-4xl font-bold text-indigo-600">{APP_NAME}</h1>
        </Link>
        <h2 className="mt-6 text-center text-2xl md:text-3xl font-extrabold text-gray-900">
          {t('auth.forgotPasswordTitle', 'Quên mật khẩu?')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('auth.forgotPasswordPrompt', 'Nhập email của bạn để nhận liên kết đặt lại mật khẩu.')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {/* Hiển thị lỗi từ mutation hoặc lỗi từ state */}
          {(mutationError?.message || errorState) && !loading && (
            <AlertMessage type="error" message={mutationError?.message || errorState} onClose={clearMessages} className="mb-4" />
          )}
          {message && !loading && (
            <AlertMessage type="success" message={message} className="mb-4" />
          )}
          {!message && ( // Chỉ hiển thị form nếu chưa có thông báo thành công
            <ForgotPasswordForm
              onSubmit={handleForgotPasswordSubmit}
              loading={loading}
              // error prop không cần thiết nếu AlertMessage ở trên đã xử lý
              successMessage={null} // Đã xử lý ở trên
              clearError={clearMessages}
            />
          )}
          <div className="mt-6 text-sm text-center">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              {t('auth.backToLoginLink', 'Quay lại Đăng nhập')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;