import React from 'react';
// import AuthPageLayout from '../../components/layout/AuthPageLayout';
// import LoginForm from '../../components/auth/LoginForm'; // Hoặc logic form trực tiếp
// import { useAuth } from '../../contexts/AuthContext';
// import { Link, useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';

const LoginPage = () => {
    // const { t } = useTranslation();
    // const { login, isLoggingIn, authError } = useAuth();
    // const navigate = useNavigate();

    // const handleLogin = async (credentials) => {
    //    const success = await login(credentials.email, credentials.password);
    //    if (success) navigate('/'); // Hoặc trang profile
    // };

    return (
        // <AuthPageLayout title={t('nav.login', 'Login')}>
        //     <LoginForm onSubmit={handleLogin} loading={isLoggingIn} error={authError} />
        //     <p className="mt-3 text-center small text-muted">
        //         {t('login.noAccount', "Don't have an account?")}{' '}
        //         <Link to="/register" className="text-dark fw-medium">{t('login.createAccount', 'Create one')}</Link>
        //     </p>
        // </AuthPageLayout>
        <div>Login Page Placeholder</div>
    );
};
export default LoginPage;