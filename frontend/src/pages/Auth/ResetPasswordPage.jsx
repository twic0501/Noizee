// src/pages/Auth/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import { RESET_PASSWORD_MUTATION } from '../../api/graphql/mutations/authMutations';
import AlertMessage from '@noizee/ui-components';
import { useAuth } from '../../hooks/useAuth'; // Để tự động login sau reset

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const token = searchParams.get('token'); // Lấy token từ query param ?token=...

    const [message, setMessage] = useState({ type: '', text: '' });
    const [resetPassword, { loading }] = useMutation(RESET_PASSWORD_MUTATION, {
         onCompleted: (data) => {
            if (data.resetPassword?.success) {
                 setMessage({ type: 'success', text: data.resetPassword.message || "Password reset successfully!" });
                  // Tự động đăng nhập nếu backend trả về token và user info
                  if (data.resetPassword.token && data.resetPassword.customer) {
                      login(data.resetPassword.token, data.resetPassword.customer);
                      setTimeout(() => navigate('/account'), 2000); // Chuyển về account sau 2s
                  } else {
                      setTimeout(() => navigate('/login'), 2000); // Chuyển về login nếu không tự login được
                  }
             } else {
                 setMessage({ type: 'danger', text: data.resetPassword?.message || "Failed to reset password." });
             }
        },
        onError: (err) => {
             console.error("Reset Password error:", err);
              setMessage({ type: 'danger', text: err.message || "Invalid or expired token, or an error occurred." });
        }
    });

     useEffect(() => {
         if (!token) {
             setMessage({ type: 'danger', text: 'Reset token is missing from the URL.' });
         }
     }, [token]);

    const handleResetSubmit = (newPassword) => {
        if (!token) {
             setMessage({ type: 'danger', text: 'Cannot reset password without a token.' });
             return;
        }
        setMessage({ type: '', text: '' }); // Clear previous messages
        resetPassword({ variables: { token, newPassword } });
    };

  return (
     <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
       <Row className="w-100">
          <Col md={{ span: 6, offset: 3 }} lg={{ span: 4, offset: 4 }}>
               <Card className="shadow-sm">
                   <Card.Body className="p-4">
                       <h2 className="text-center mb-4 auth-title">Reset Password</h2> {/* CSS */}
                       {!token && !message.text && <AlertMessage variant="danger">Invalid password reset link.</AlertMessage>}
                       {token && (
                            <ResetPasswordForm
                                onSubmit={handleResetSubmit}
                                loading={loading}
                                error={message.type === 'danger' ? message.text : null}
                                successMessage={message.type === 'success' ? message.text : null}
                            />
                       )}
                       {message.type === 'success' && (
                            <div className="text-center mt-3">
                                <Link to={message.type === 'success' && token ? '/account' : '/login'}>
                                    {message.type === 'success' && token ? 'Go to My Account' : 'Back to Login'}
                                </Link>
                            </div>
                       )}
                        {message.type !== 'success' && (
                            <div className="text-center mt-3">
                                 <Link to="/login" className="text-muted"><small>Back to Login</small></Link>
                            </div>
                        )}
                   </Card.Body>
               </Card>
           </Col>
       </Row>
     </Container>
  );
}

export default ResetPasswordPage;