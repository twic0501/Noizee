// user/src/pages/Account/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave } from 'react-icons/fi';

import { GET_ME_QUERY } from '../../api/graphql/userQueries';
import { UPDATE_USER_PROFILE_MUTATION } from '../../api/graphql/userMutations'; // Cần tạo mutation này
import { useAuth } from '../../contexts/AuthContext'; // Để cập nhật user trong context nếu cần
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';

const ProfilePage = () => {
  const { t } = useTranslation();
  const { authState, login: updateAuthContextUser } = useAuth(); // Lấy hàm login để cập nhật user trong context

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '', // Email thường không cho phép sửa trực tiếp
    phoneNumber: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Query để lấy thông tin người dùng hiện tại
  const { loading: queryLoading, error: queryError, data: userData } = useQuery(GET_ME_QUERY, {
    skip: !authState.isAuthenticated, // Chỉ query nếu đã đăng nhập
    onCompleted: (data) => {
      if (data && data.me) {
        setFormData({
          firstName: data.me.firstName || '',
          lastName: data.me.lastName || '',
          email: data.me.email || '',
          phoneNumber: data.me.phoneNumber || '',
          address: data.me.address || '',
        });
      }
    },
  });

  // Mutation để cập nhật profile
  const [updateProfile, { loading: mutationLoading, error: mutationError }] = useMutation(
    UPDATE_USER_PROFILE_MUTATION,
    {
      onCompleted: (data) => {
        if (data.updateUserProfile) {
          setSuccessMessage(t('profile.updateSuccess', 'Thông tin cá nhân đã được cập nhật!'));
          // Cập nhật lại user trong AuthContext
          // Giả sử updateUserProfile trả về token và user (hoặc chỉ user)
          // Nếu chỉ trả về user, cần cẩn thận khi gọi updateAuthContextUser
          // Cách tốt hơn là AuthContext tự refetch 'me' hoặc Apollo cache tự cập nhật 'me'
          if (authState.token && data.updateUserProfile) {
            updateAuthContextUser(authState.token, data.updateUserProfile); // Cập nhật user trong context
          }
          setTimeout(() => setSuccessMessage(''), 3000); // Xóa thông báo sau 3s
        }
      },
      onError: (error) => {
        // Lỗi đã được set vào mutationError
        console.error("Profile update error:", error);
      },
      // Cập nhật cache Apollo Client cho query GET_ME_QUERY
      // để các component khác sử dụng GET_ME_QUERY tự động nhận dữ liệu mới.
      update: (cache, { data: { updateUserProfile: updatedUser } }) => {
        try {
          const existingMeData = cache.readQuery({ query: GET_ME_QUERY });
          if (existingMeData && existingMeData.me) {
            cache.writeQuery({
              query: GET_ME_QUERY,
              data: {
                me: {
                  ...existingMeData.me,
                  ...updatedUser,
                },
              },
            });
          }
        } catch (e) {
          console.warn("Could not update GET_ME_QUERY cache after profile update:", e);
        }
      },
      // Hoặc refetchQueries: [{ query: GET_ME_QUERY }],
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: null })); // Xóa lỗi của field đó
    setSuccessMessage(''); // Xóa thông báo thành công cũ
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = t('validation.firstNameRequired');
    if (!formData.lastName.trim()) errors.lastName = t('validation.lastNameRequired');
    // Thêm validation cho phoneNumber, address nếu cần
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    if (validateForm()) {
      const input = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
      };
      // Không gửi email nếu không cho phép sửa
      await updateProfile({ variables: { input } });
    }
  };

  if (queryLoading && !userData) return <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>;
  if (queryError) return <AlertMessage type="error" message={t('profile.errorLoading')} details={queryError.message} />;
  if (!authState.isAuthenticated || !userData?.me) {
    // Trường hợp này không nên xảy ra nếu ProtectedRoute hoạt động đúng
    return <AlertMessage type="warning" message={t('profile.notAuthenticated')} />;
  }
  
  const commonInputClasses = "w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 read-only:bg-gray-100 read-only:cursor-not-allowed";
  const iconClasses = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 peer-focus:text-indigo-500";


  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {t('profile.title', 'Thông tin cá nhân')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              {t('profile.firstNameLabel', 'Tên')}
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
                />
            </div>
            {formErrors.firstName && <p className="mt-1 text-xs text-red-600">{formErrors.firstName}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              {t('profile.lastNameLabel', 'Họ')}
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
                />
            </div>
            {formErrors.lastName && <p className="mt-1 text-xs text-red-600">{formErrors.lastName}</p>}
          </div>
        </div>

        {/* Email (thường là read-only) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('profile.emailLabel', 'Email')}
          </label>
          <div className="relative mt-1">
            <FiMail className={iconClasses} />
            <input
                id="email"
                name="email"
                type="email"
                readOnly
                value={formData.email}
                className={`${commonInputClasses} pl-10 peer`}
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            {t('profile.phoneNumberLabel', 'Số điện thoại')}
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
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            {t('profile.addressLabel', 'Địa chỉ')}
          </label>
          <div className="relative mt-1">
            <FiMapPin className={iconClasses} />
            <textarea
                id="address"
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                className={`${commonInputClasses} pl-10 peer`}
            />
          </div>
        </div>

        {/* Alert Messages */}
        {mutationError && <AlertMessage type="error" message={t('profile.updateError')} details={mutationError.message} onClose={() => {/* mutationError sẽ tự clear khi có request mới */}} />}
        {successMessage && <AlertMessage type="success" message={successMessage} onClose={() => setSuccessMessage('')}/>}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={mutationLoading || queryLoading}
            className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {mutationLoading ? (
              <LoadingSpinner size="sm" color="text-white" className="mr-2" />
            ) : (
              <FiSave className="mr-2 h-4 w-4" />
            )}
            {t('profile.saveChangesButton', 'Lưu thay đổi')}
          </button>
        </div>
      </form>

      {/* TODO: Thêm Form đổi mật khẩu ở đây nếu muốn */}
      {/* <ChangePasswordForm /> */}
    </div>
  );
};

export default ProfilePage;