import React from 'react';
import PropTypes from 'prop-types'; // Thêm PropTypes để kiểm tra kiểu dữ liệu của props

const InputField = ({
    id,
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    required = false,
    icon,
    halfWidth = false,
    autoComplete = "off",
    children, // Cho phép truyền các element vào cuối input group (ví dụ: nút show/hide password)
    disabled = false,
    name, // Thêm name để tương thích tốt hơn với các thư viện form
    ...props // Các props khác có thể truyền vào input element
}) => (
    <div className={`mb-3 ${halfWidth ? 'col-md-6' : 'col-12'}`}>
        {label && <label htmlFor={id} className="form-label small fw-medium">{label} {required && <span className="text-danger">*</span>}</label>}
        <div className="input-group input-group-sm"> {/* Sử dụng input-group-sm cho kích thước nhỏ hơn */}
            {icon && <span className="input-group-text">{icon}</span>}
            <input
                type={type}
                id={id}
                name={name || id} // Sử dụng name hoặc id
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                autoComplete={autoComplete}
                className={`form-control ${error ? 'is-invalid' : ''}`} // Bỏ form-control-sm ở đây vì input-group-sm đã xử lý
                {...props}
            />
            {children && <div className="input-group-text p-0">{children}</div>} {/* p-0 cho children nếu là button icon */}
        </div>
        {error && <div className="invalid-feedback d-block small mt-1">{error}</div>} {/* Sử dụng small và mt-1 */}
    </div>
);

InputField.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    type: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    error: PropTypes.string,
    required: PropTypes.bool,
    icon: PropTypes.node,
    halfWidth: PropTypes.bool,
    autoComplete: PropTypes.string,
    children: PropTypes.node,
    disabled: PropTypes.bool,
    name: PropTypes.string,
};

export default InputField;