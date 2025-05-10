// src/pages/Auth/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import { FORGOT_PASSWORD_MUTATION } from '../../api/graphql/mutations/authMutations';

function ForgotPasswordPage() {
    const [message, setMessage] = useState({ type: '', text: '' }); // success or error
    const [forgotPassword, { loading }] = useMutation(FORGOT_PASSWORD_MUTATION, {
        onCompleted: (data) => {
            if (data.forgotPassword?.success) {
                 setMessage({ type: 'success', text: data.forgotPassword.message || "Password reset instructions sent!" });
            } else {
                 setMessage({ type: 'danger', text: data.forgotPassword?.message || "Could not send reset instructions." });
            }
        },
        onError: (err) => {
             console.error("Forgot Password error:", err);
             setMessage({ type: 'danger', text: err.message || "An error occurred. Please try again." });
        }
    });

    const handleForgotSubmit = (email) => {
        setMessage({ type: '', text: '' }); // Clear previous messages
        forgotPassword({ variables: { email } });
    };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
       <Row className="w-100">
          <Col md={{ span: 6, offset: 3 }} lg={{ span: 4, offset: 4 }}>
               <Card className="shadow-sm">
                   <Card.Body className="p-4">
                        <h2 className="text-center mb-4 auth-title">Forgot Password</h2> {/* CSS */}
                        <ForgotPasswordForm
                            onSubmit={handleForgotSubmit}
                            loading={loading}
                            error={message.type === 'danger' ? message.text : null}
                            successMessage={message.type === 'success' ? message.text : null}
                         />
                        <div className="text-center mt-3">
                           <Link to="/login" className="text-muted"><small>Back to Login</small></Link>
                        </div>
                   </Card.Body>
               </Card>
           </Col>
       </Row>
     </Container>
  );
}

export default ForgotPasswordPage;