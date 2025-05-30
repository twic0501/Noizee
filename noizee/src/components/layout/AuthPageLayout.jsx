import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const AuthPageLayout = ({ title, children }) => (
    <div className="min-vh-100 bg-light d-flex flex-column align-items-center justify-content-center py-5 px-3">
        <div className="mb-4">
            <Link to="/" className="text-decoration-none text-dark h2 fw-bold text-uppercase">
                NOIZEE {/* Hoặc tên shop của bạn từ biến môi trường/config */}
            </Link>
        </div>
        <div className="card shadow-sm border-0" style={{ maxWidth: '420px', width: '100%' }}> {/* Bỏ shadow-lg, border-0 */}
            <div className="card-body p-4 p-md-5"> {/* Tăng padding trên mobile */}
                <h2 className="card-title text-center h4 fw-bold mb-4">{title}</h2>
                {children}
            </div>
        </div>
        <p className="mt-4 text-center small text-muted">
            &copy; {new Date().getFullYear()} NOIZEE. All rights reserved. <br />
            <Link to="/" className="text-dark text-decoration-underline">Trở về cửa hàng</Link>
        </p>
    </div>
);

AuthPageLayout.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};

export default AuthPageLayout;