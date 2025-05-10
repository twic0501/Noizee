// src/pages/Auth/RegisterPage.jsx
import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import AuthForm from '../../components/auth/AuthForm'; // Component chứa form thực tế
import { REGISTER_MUTATION } from '../../api/graphql/mutations/authMutations'; // Định nghĩa GraphQL mutation
import { useAuth } from '../../hooks/useAuth'; // Hook quản lý trạng thái đăng nhập

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); // Lấy hàm login từ context
  const [registerUser, { loading, error }] = useMutation(REGISTER_MUTATION, {
    // Callback khi mutation thành công (không có lỗi GraphQL trả về)
    onCompleted: (data) => {
      // Kiểm tra xem có token và dữ liệu user trả về không
      if (data.register?.token && data.register) {
        console.log("Registration successful, logging in:", data.register);
        // Lưu token và thông tin user vào context/localStorage, đánh dấu đã đăng nhập
        login(data.register.token, data.register);
        // Chuyển hướng người dùng về trang chủ
        navigate('/');
      } else {
        // Trường hợp hiếm gặp: mutation thành công nhưng không có token
        console.error("Register completed but no token/user data received:", data);
        // Có thể hiển thị lỗi chung cho người dùng ở đây
      }
    },
    // Callback khi mutation thất bại (lỗi mạng hoặc lỗi GraphQL)
    onError: (err) => {
      // Log lỗi chi tiết ra console để debug
      console.error("Register error:", err);
      // Lỗi này (err.message) sẽ được truyền xuống AuthForm để hiển thị
    }
  });

  // Hàm được gọi khi người dùng submit form trong AuthForm
  const handleRegisterSubmit = (formData) => {
    console.log("Submitting registration form data:", formData);
    // Gọi mutation với biến 'input' chứa dữ liệu từ form
    // Apollo Client sẽ tự động gửi request đến endpoint /graphql
    registerUser({ variables: { input: formData } });
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Row className="w-100">
        <Col md={{ span: 8, offset: 2 }} lg={{ span: 6, offset: 3 }}>
          <Card className="shadow-sm">
            <Card.Body className="p-4 p-md-5">
              <h2 className="text-center mb-4 auth-title">Tạo tài khoản</h2>
              {/* Component AuthForm xử lý việc hiển thị các trường input và lỗi */}
              <AuthForm
                isRegister={true} // Báo cho AuthForm biết đây là form đăng ký
                onSubmit={handleRegisterSubmit} // Callback khi form được submit
                loading={loading} // Trạng thái loading để disable nút submit
                // Truyền message lỗi xuống AuthForm để hiển thị (nếu có)
                // error?.message sẽ lấy thông báo lỗi từ object error của Apollo
                error={error?.message}
              />
              <div className="text-center mt-3">
                <Link to="/login" className="text-muted"><small>Đã có tài khoản? Đăng nhập</small></Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default RegisterPage;