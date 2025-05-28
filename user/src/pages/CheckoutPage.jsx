// user/src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FiMapPin, FiTruck, FiCreditCard, FiList, FiUser, FiPhone, FiMail, FiCheckCircle } from 'react-icons/fi';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { GET_ME_QUERY } from '../api/graphql/userQueries';
import { CREATE_ORDER_MUTATION } from '../api/graphql/orderMutations'; // Hoặc saleMutations.js
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import { formatPrice } from '../utils/formatters';
import OptimizedImage from '../components/common/OptimizedImage';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../utils/constants';

// Component con cho từng bước (ví dụ)
const ShippingAddressForm = ({ address, onChange, errors, disabled }) => {
  const { t } = useTranslation();
  // ... form fields for address ...
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-700 mb-3">{t('checkout.shippingAddressTitle', 'Địa chỉ giao hàng')}</h3>
       {/* Ví dụ một trường */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">{t('checkout.fullName', 'Họ và tên')}</label>
        <input type="text" name="fullName" id="fullName" disabled={disabled} value={address.fullName || ''} onChange={onChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        {errors?.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
      </div>
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">{t('checkout.phoneNumber', 'Số điện thoại')}</label>
        <input type="tel" name="phoneNumber" id="phoneNumber" disabled={disabled} value={address.phoneNumber || ''} onChange={onChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
         {errors?.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
      </div>
      <div>
        <label htmlFor="street" className="block text-sm font-medium text-gray-700">{t('checkout.streetAddress', 'Địa chỉ cụ thể (số nhà, tên đường)')}</label>
        <input type="text" name="street" id="street" disabled={disabled} value={address.street || ''} onChange={onChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
         {errors?.street && <p className="text-xs text-red-500 mt-1">{errors.street}</p>}
      </div>
      {/* Thêm các trường City, District, Ward (có thể là dropdowns fetch từ API GHN/GHTK) */}
      {/* ... Country ... */}
      <p className="text-xs text-gray-500">{t('checkout.addressNote', 'Vui lòng điền đầy đủ thông tin để việc giao hàng được thuận tiện nhất.')}</p>
    </div>
  );
};

const PaymentMethods = ({ selectedMethod, onChange, disabled }) => {
    const { t } = useTranslation();
    const paymentOptions = [
        { id: 'cod', name: t('checkout.payment.cod', 'Thanh toán khi nhận hàng (COD)')},
        // { id: 'bank_transfer', name: t('checkout.payment.bankTransfer', 'Chuyển khoản ngân hàng')},
        // { id: 'momo', name: t('checkout.payment.momo', 'Ví Momo')},
        // { id: 'vnpay', name: t('checkout.payment.vnpay', 'VNPay QR')},
    ];
    return (
        <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">{t('checkout.paymentMethodTitle', 'Phương thức thanh toán')}</h3>
            <fieldset className="mt-2">
                <legend className="sr-only">{t('checkout.paymentMethodTitle', 'Phương thức thanh toán')}</legend>
                <div className="space-y-3">
                {paymentOptions.map((option) => (
                    <label key={option.id} htmlFor={`payment-${option.id}`} className="flex items-center p-3 border border-gray-200 rounded-md hover:border-indigo-500 cursor-pointer has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500">
                        <input
                            id={`payment-${option.id}`}
                            name="paymentMethod"
                            type="radio"
                            disabled={disabled}
                            value={option.id}
                            checked={selectedMethod === option.id}
                            onChange={onChange}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                        />
                        <span className="ml-3 block text-sm font-medium text-gray-700">{option.name}</span>
                    </label>
                ))}
                </div>
            </fieldset>
        </div>
    );
}


const CheckoutPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { cart, clearCart: clearCartContext } = useCart(); // Lấy giỏ hàng và hàm xóa giỏ hàng từ context

  const [currentStep, setCurrentStep] = useState(1); // 1: Address, 2: Shipping, 3: Payment, 4: Review
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phoneNumber: '',
    street: '',
    city: '', // Sẽ là ID từ API tỉnh/thành
    district: '', // Sẽ là ID
    ward: '', // Sẽ là ID
    country: 'Việt Nam', // Mặc định
    // isDefaultShipping: true,
  });
  const [formErrors, setFormErrors] = useState({});
  // const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cod'); // Mặc định COD
  const [orderNotes, setOrderNotes] = useState('');
  const [orderPlacedData, setOrderPlacedData] = useState(null); // Để lưu thông tin đơn hàng sau khi đặt thành công

  // Lấy thông tin user để điền sẵn địa chỉ (nếu có)
  const { data: userData } = useQuery(GET_ME_QUERY, {
    skip: !authState.isAuthenticated,
    onCompleted: (data) => {
      if (data?.me) {
        setShippingAddress(prev => ({
          ...prev,
          fullName: `${data.me.firstName || ''} ${data.me.lastName || ''}`.trim(),
          phoneNumber: data.me.phoneNumber || '',
          street: data.me.address || '', // Giả sử address là street
          // Cần logic để map address chi tiết nếu có
        }));
      }
    }
  });

  const [createOrder, { loading: creatingOrder, error: createOrderError }] = useMutation(CREATE_ORDER_MUTATION, {
    onCompleted: (data) => {
      if (data.createOrder) {
        setOrderPlacedData(data.createOrder); // Lưu thông tin đơn hàng thành công
        clearCartContext(); // Xóa giỏ hàng ở client
        // navigate(`/account/orders/${data.createOrder.id}`); // Chuyển đến trang chi tiết đơn hàng
        setCurrentStep(5); // Chuyển đến bước thành công
      }
    },
    onError: (err) => {
      console.error("Error creating order:", err);
      // Hiển thị lỗi cho người dùng
    }
  });


  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: null }));
  };
  
  const handlePaymentChange = (e) => {
      setSelectedPaymentMethod(e.target.value);
  }

  const validateShippingAddress = () => {
      const errors = {};
      if(!shippingAddress.fullName.trim()) errors.fullName = t('validation.fullNameRequired', 'Vui lòng nhập họ tên.');
      if(!shippingAddress.phoneNumber.trim()) errors.phoneNumber = t('validation.phoneNumberRequired', 'Vui lòng nhập số điện thoại.');
      // Thêm regex cho phone number
      if(!shippingAddress.street.trim()) errors.street = t('validation.streetRequired', 'Vui lòng nhập địa chỉ cụ thể.');
      // Thêm validation cho city, district, ward nếu là dropdowns bắt buộc
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
  }

  const handlePlaceOrder = async () => {
    if (!validateShippingAddress()) return;
    if (!selectedPaymentMethod) {
        alert(t('checkout.selectPaymentMethodPrompt', 'Vui lòng chọn phương thức thanh toán.'));
        return;
    }

    const orderInput = {
      shippingAddress: { // Cần map đúng với AddressInput của backend
        firstName: shippingAddress.fullName.split(' ').slice(0, -1).join(' ') || shippingAddress.fullName, // Tách đơn giản
        lastName: shippingAddress.fullName.split(' ').slice(-1).join('') || '',
        phoneNumber: shippingAddress.phoneNumber,
        street: shippingAddress.street,
        city: shippingAddress.city, // Nên là cityId
        district: shippingAddress.district, // Nên là districtId
        ward: shippingAddress.ward, // Nên là wardId
        country: shippingAddress.country,
      },
      // billingAddress: {}, // Nếu có
      // shippingMethodId: selectedShippingMethod?.id, // Nếu có
      paymentMethodId: selectedPaymentMethod, // Hoặc paymentMethodType
      notes: orderNotes,
    };

    try {
      await createOrder({ variables: { input: orderInput } });
    } catch (e) {
      // Lỗi đã được xử lý bởi onError của useMutation
    }
  };

  if (!authState.isAuthenticated) {
    // ProtectedRoute đã xử lý, nhưng thêm fallback
    navigate('/login', { state: { from: location } });
    return null;
  }

  if (!cart || cart.items.length === 0 && currentStep !== 5) { // Nếu giỏ hàng rỗng và chưa đặt hàng thành công
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertMessage type="info" message={t('checkout.emptyCartPrompt', 'Giỏ hàng của bạn trống. Vui lòng thêm sản phẩm trước khi thanh toán.')} />
        <Link to="/products" className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700">
          {t('cart.continueShoppingButton', 'Khám phá sản phẩm')}
        </Link>
      </div>
    );
  }
  
  // Bước 5: Hiển thị trang xác nhận đặt hàng thành công
  if (currentStep === 5 && orderPlacedData) {
    return (
        <div className="container mx-auto px-4 py-12 text-center">
            <FiCheckCircle className="mx-auto text-green-500 mb-6 h-20 w-20" />
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
                {t('checkout.orderSuccessTitle', 'Đặt hàng thành công!')}
            </h1>
            <p className="text-gray-600 mb-3">
                {t('checkout.orderSuccessMessage', 'Cảm ơn bạn đã đặt hàng. Mã đơn hàng của bạn là:')}
                <strong className="ml-1">{orderPlacedData.order_number || orderPlacedData.id}</strong>.
            </p>
            <p className="text-gray-600 mb-8">
                {t('checkout.orderSuccessNextSteps', 'Chúng tôi sẽ xử lý đơn hàng của bạn sớm nhất có thể. Bạn có thể theo dõi trạng thái đơn hàng trong tài khoản của mình.')}
            </p>
            <div className="space-x-4">
                <Link
                    to={`/account/orders/${orderPlacedData.id}`}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 transition-colors"
                >
                    {t('checkout.viewOrderButton', 'Xem chi tiết đơn hàng')}
                </Link>
                <Link
                    to="/products"
                    className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-md font-semibold hover:bg-indigo-50 transition-colors"
                >
                    {t('cart.continueShoppingButton', 'Tiếp tục mua sắm')}
                </Link>
            </div>
        </div>
    )
  }


  return (
    <div className="bg-gray-50 min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {t('checkout.pageTitle', 'Thanh toán')}
          </h1>
        </header>

        <div className="lg:flex lg:gap-8">
          {/* Left Side: Forms (Address, Shipping, Payment) */}
          <div className="lg:w-2/3">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md space-y-8">
              {/* Step 1: Shipping Address */}
              <ShippingAddressForm
                address={shippingAddress}
                onChange={handleAddressChange}
                errors={formErrors}
                disabled={creatingOrder}
              />

              {/* Step 2: Shipping Method (Placeholder) */}
              {/* <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">{t('checkout.shippingMethodTitle', 'Phương thức vận chuyển')}</h3>
                <p className="text-sm text-gray-500">{t('checkout.shippingMethodPlaceholder', 'Sẽ được tính toán dựa trên địa chỉ.')}</p>
              </div> */}

              {/* Step 3: Payment Method */}
              <PaymentMethods
                selectedMethod={selectedPaymentMethod}
                onChange={handlePaymentChange}
                disabled={creatingOrder}
              />
              
              {/* Order Notes */}
              <div>
                  <label htmlFor="orderNotes" className="block text-sm font-medium text-gray-700">{t('checkout.orderNotes', 'Ghi chú đơn hàng (tùy chọn)')}</label>
                  <textarea
                    id="orderNotes"
                    name="orderNotes"
                    rows="3"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    disabled={creatingOrder}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder={t('checkout.orderNotesPlaceholder', 'Ví dụ: Giao hàng giờ hành chính...')}
                  />
              </div>


            </div>
          </div>

          {/* Right Side: Order Summary */}
          <div className="lg:w-1/3 mt-8 lg:mt-0">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-3">
                {t('checkout.orderReviewTitle', 'Xem lại đơn hàng')}
              </h3>
              {/* Tóm tắt sản phẩm */}
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-2">
                {cart.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <OptimizedImage src={item.product?.images?.[0]?.imageUrl || PRODUCT_IMAGE_PLACEHOLDER} alt={item.product?.name} containerClassName="w-10 h-10 mr-3 rounded flex-shrink-0" objectFit="object-contain"/>
                      <span className="text-gray-700 line-clamp-1">{item.product?.name} <span className="text-gray-500">x{item.quantity}</span></span>
                    </div>
                    <span className="text-gray-800 font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              {/* Tổng tiền từ CartSummary (hoặc tính lại) */}
              <div className="border-t pt-4 space-y-1 text-sm">
                 <div className="flex justify-between text-gray-600">
                    <span>{t('cart.subtotal', 'Tạm tính')}:</span>
                    <span>{formatPrice(cart.subtotal)}</span>
                </div>
                {/* Shipping, Discount (nếu có) */}
                <div className="flex justify-between text-gray-600">
                    <span>{t('cart.shipping', 'Phí vận chuyển')}:</span>
                    <span className="text-xs">{t('cart.shippingCalculatedLater', 'Sẽ được thông báo')}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-gray-900 mt-2 pt-2 border-t">
                    <span>{t('cart.total', 'Tổng cộng')}:</span>
                    <span>{formatPrice(cart.total)}</span>
                </div>
              </div>

              {createOrderError && <AlertMessage type="error" message={t('checkout.placeOrderError')} details={createOrderError.message} className="mt-4"/>}

              <button
                onClick={handlePlaceOrder}
                disabled={creatingOrder || cart.items.length === 0}
                className="w-full mt-6 bg-indigo-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-indigo-700 transition-colors duration-150 flex items-center justify-center text-base disabled:opacity-50"
              >
                {creatingOrder ? <LoadingSpinner size="sm" color="text-white" className="mr-2"/> : <FiCheckCircle className="mr-2 h-5 w-5"/>}
                {t('checkout.placeOrderButton', 'Hoàn tất đặt hàng')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;