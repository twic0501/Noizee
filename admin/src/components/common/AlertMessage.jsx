import React from 'react';
import Alert from 'react-bootstrap/Alert';

// Hoặc dùng class CSS
// variant: 'primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'
function AlertMessage({ variant = 'danger', children, show = true, onClose, dismissible = false }) {
    if (!show) {
        return null;
    }
    return (
        <Alert variant={variant} onClose={onClose} dismissible={dismissible}>
            {children}
        </Alert>
    );
}

export default AlertMessage;