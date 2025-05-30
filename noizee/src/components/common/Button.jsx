import React from 'react';

const Button = ({
    children,
    onClick,
    type = 'button', // 'button', 'submit', 'reset'
    variant = 'primary', // 'primary', 'secondary', 'dark', 'light', 'outline-dark', etc. (theo Bootstrap)
    size = 'md', // 'sm', 'md', 'lg'
    isLoading = false,
    disabled = false,
    className = '',
    iconLeft,
    iconRight,
    ...props
}) => {
    const baseClasses = 'btn';
    const variantClasses = `btn-${variant}`;
    const sizeClasses = size === 'md' ? '' : `btn-${size}`;

    return (
        <button
            type={type}
            className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className} d-inline-flex align-items-center justify-content-center`}
            onClick={onClick}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            )}
            {!isLoading && iconLeft && <span className="me-2">{iconLeft}</span>}
            {children}
            {!isLoading && iconRight && <span className="ms-2">{iconRight}</span>}
        </button>
    );
};

export default Button;