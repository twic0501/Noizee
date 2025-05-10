// src/components/auth/AuthForm.jsx
import React, { useState } from 'react';
import { Form, Button, Spinner, Row, Col } from 'react-bootstrap';
import AlertMessage from '../common/AlertMessage'; // Giả sử bạn có component này

function AuthForm({ isRegister = false, onSubmit, loading = false, error = null }) {
  // State lưu trữ dữ liệu của tất cả các trường trong form
  const [formData, setFormData] = useState({
    identifier: '',        // Dùng cho Login (email hoặc username)
    customer_name: '',     // Dùng cho Register
    username: '',          // Tùy chọn cho Register
    customer_email: '',    // Dùng cho Register
    customer_password: '', // Dùng cho cả hai
    confirmPassword: '',   // Chỉ dùng cho Register để xác nhận mật khẩu
    customer_tel: '',      // Dùng cho Register
    customer_address: '',  // Dùng cho Register
  });
  // State lưu trữ lỗi validation phía client (do người dùng nhập sai)
  const [formError, setFormError] = useState('');

  // Xử lý khi giá trị của một input thay đổi
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Cập nhật state formData với giá trị mới
    setFormData(prev => ({ ...prev, [name]: value }));
    // Xóa thông báo lỗi khi người dùng bắt đầu nhập lại
    setFormError('');
  };

  // Xử lý khi form được submit
  const handleSubmit = (e) => {
    e.preventDefault(); // Ngăn chặn hành vi submit mặc định của trình duyệt
    setFormError('');   // Xóa lỗi cũ trước khi validate lại

    // --- Thực hiện Client-side Validation ---
    if (isRegister) { // Nếu là form đăng ký
      // Kiểm tra các trường bắt buộc
      if (!formData.customer_name || !formData.customer_email || !formData.customer_password || !formData.customer_tel) {
        setFormError("Vui lòng điền đầy đủ các trường bắt buộc (*).");
        return; // Dừng xử lý nếu thiếu
      }
      // Kiểm tra mật khẩu nhập lại có khớp không
      if (formData.customer_password !== formData.confirmPassword) {
        setFormError("Mật khẩu nhập lại không khớp.");
        return; // Dừng xử lý nếu không khớp
      }
      // Kiểm tra độ dài mật khẩu
      if (formData.customer_password.length < 6) {
        setFormError("Mật khẩu phải có ít nhất 6 ký tự.");
        return; // Dừng xử lý nếu quá ngắn
      }
      // !!! QUAN TRỌNG: Thêm validate định dạng email, phone phía client nếu muốn phản hồi nhanh hơn
      // Ví dụ cơ bản:
      // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // if (!emailRegex.test(formData.customer_email)) {
      //   setFormError("Định dạng email không hợp lệ.");
      //   return;
      // }
      // const phoneRegex = /^0\d{9,10}$/; // Regex SĐT Việt Nam cơ bản
      // if (!phoneRegex.test(formData.customer_tel)) {
      //    setFormError("Định dạng số điện thoại không hợp lệ.");
      //    return;
      // }

      // Chuẩn bị dữ liệu để gửi đi (đã trim khoảng trắng thừa)
      const registerData = {
        customer_name: formData.customer_name.trim(),
        // Gán null nếu username rỗng, ngược lại trim
        username: formData.username ? formData.username.trim() : null,
        customer_email: formData.customer_email.trim(),
        // Mật khẩu thường không cần trim
        customer_password: formData.customer_password,
        customer_tel: formData.customer_tel.trim(),
        // Gán null nếu địa chỉ rỗng, ngược lại trim
        customer_address: formData.customer_address ? formData.customer_address.trim() : null,
      };
      // Gọi hàm onSubmit được truyền từ RegisterPage, gửi dữ liệu đã chuẩn bị
      onSubmit(registerData);

    } else { // Nếu là form đăng nhập
      // Kiểm tra trường bắt buộc cho login
      if (!formData.identifier || !formData.customer_password) {
        setFormError("Vui lòng nhập Email/Username và Mật khẩu.");
        return; // Dừng xử lý nếu thiếu
      }
      // Chuẩn bị dữ liệu cho login (đã trim identifier)
      const loginData = {
        identifier: formData.identifier.trim(),
        customer_password: formData.customer_password
      };
      // Gọi hàm onSubmit được truyền từ LoginPage
      onSubmit(loginData);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* Hiển thị lỗi từ server (prop 'error') HOẶC lỗi validation client ('formError') */}
      {(error || formError) && (
        <AlertMessage variant="danger" className="mb-3">
          {/* Ưu tiên hiển thị lỗi từ server nếu có */}
          {error || formError}
        </AlertMessage>
      )}

      {/* Các trường chỉ hiển thị khi đăng ký */}
      {isRegister && (
        <>
          <Form.Group className="mb-3" controlId="registerName">
            <Form.Label>Họ và tên <span className="text-danger">*</span></Form.Label>
            {/* Các thuộc tính name phải khớp với key trong state formData */}
            <Form.Control type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required disabled={loading} />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="registerEmail">
                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                <Form.Control type="email" name="customer_email" value={formData.customer_email} onChange={handleChange} required disabled={loading}/>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="registerUsername">
                <Form.Label>Username (Tùy chọn)</Form.Label>
                <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} disabled={loading} />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3" controlId="registerPhone">
            <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
            <Form.Control type="tel" name="customer_tel" value={formData.customer_tel} onChange={handleChange} required disabled={loading}/>
          </Form.Group>
           <Form.Group className="mb-3" controlId="registerAddress">
            <Form.Label>Địa chỉ (Tùy chọn)</Form.Label>
            <Form.Control type="text" name="customer_address" value={formData.customer_address} onChange={handleChange} disabled={loading} />
          </Form.Group>
        </>
      )}

      {/* Trường chỉ hiển thị khi đăng nhập */}
      {!isRegister && (
        <Form.Group className="mb-3" controlId="loginIdentifier">
          <Form.Label>Email hoặc Username</Form.Label>
          <Form.Control type="text" name="identifier" placeholder="Nhập email hoặc username" value={formData.identifier} onChange={handleChange} required disabled={loading} />
        </Form.Group>
      )}

      {/* Trường mật khẩu chung */}
      <Form.Group className="mb-3" controlId="authPassword">
        <Form.Label>Mật khẩu <span className="text-danger">*</span></Form.Label>
        <Form.Control type="password" name="customer_password" placeholder="Mật khẩu" value={formData.customer_password} onChange={handleChange} required disabled={loading} />
      </Form.Group>

      {/* Trường xác nhận mật khẩu chỉ khi đăng ký */}
      {isRegister && (
        <Form.Group className="mb-3" controlId="registerConfirmPassword">
          <Form.Label>Xác nhận mật khẩu <span className="text-danger">*</span></Form.Label>
          <Form.Control type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" value={formData.confirmPassword} onChange={handleChange} required disabled={loading} />
        </Form.Group>
      )}

      {/* Nút Submit */}
      <div className="d-grid">
        <Button variant="dark" type="submit" disabled={loading}>
          {loading ? (
            <><Spinner as="span" animation="border" size="sm" /> Đang xử lý...</>
          ) : (isRegister ? 'Đăng ký' : 'Đăng nhập')}
        </Button>
      </div>
    </Form>
  );
}

export default AuthForm;