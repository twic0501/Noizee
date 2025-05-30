import React from 'react';
import PropTypes from 'prop-types';
import { X as CloseIcon, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'; // Sử dụng icon

const AlertMessage = ({ type = 'info', message, title, onClose, showIcon = true }) => {
    if (!message && !title) return null;

    let IconComponent;
    switch (type) {
        case 'success': IconComponent = CheckCircle; break;
        case 'warning': IconComponent = AlertTriangle; break;
        case 'danger': IconComponent = AlertCircle; break;
        case 'info':
        default: IconComponent = Info; break;
    }

    return (
        <div className={`alert alert-${type} alert-dismissible fade show d-flex align-items-start`} role="alert">
            {showIcon && IconComponent && <IconComponent size={20} className="me-2 flex-shrink-0" />}
            <div className="flex-grow-1">
                {title && <h6 className="alert-heading small mb-1">{title}</h6>}
                <div className="small">{message}</div>
            </div>
            {onClose && (
                <button type="button" className="btn-close p-2 ms-2" onClick={onClose} aria-label="Close">
                   {/* <CloseIcon size={16}/> Bootstrap đã có icon X */}
                </button>
            )}
        </div>
    );
};

AlertMessage.propTypes = {
    type: PropTypes.oneOf(['success', 'info', 'warning', 'danger']),
    message: PropTypes.node, // Cho phép truyền JSX vào message
    title: PropTypes.string,
    onClose: PropTypes.func,
    showIcon: PropTypes.bool,
};

export default AlertMessage;