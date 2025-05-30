import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({ size = 'md', color = 'dark', fullPage = false, text }) => {
    const spinnerSizeClass = size === 'sm' ? 'spinner-border-sm' : '';
    const wrapperClass = fullPage
        ? 'd-flex flex-column justify-content-center align-items-center vh-100' // flex-column để text ở dưới
        : 'd-flex flex-column justify-content-center align-items-center my-3';

    return (
        <div className={wrapperClass}>
            <div className={`spinner-border text-${color} ${spinnerSizeClass}`} role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            {text && <p className={`mt-2 text-${color} small`}>{text}</p>}
        </div>
    );
};

LoadingSpinner.propTypes = {
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    color: PropTypes.string,
    fullPage: PropTypes.bool,
    text: PropTypes.string,
};

export default LoadingSpinner;