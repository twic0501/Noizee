import React from 'react';
import PropTypes from 'prop-types';

const SelectField = ({
    id,
    label,
    value,
    onChange,
    options, // Mảng các object { value: 'someValue', label: 'Some Label' }
    required = false,
    halfWidth = false,
    name,
    disabled = false,
    defaultOptionLabel = "Choose..." // Nhãn cho option mặc định (không có giá trị)
}) => (
    <div className={`mb-3 ${halfWidth ? 'col-md-6' : 'col-12'}`}>
        {label && <label htmlFor={id} className="form-label small fw-medium">{label} {required && <span className="text-danger">*</span>}</label>}
        <select
            id={id}
            name={name || id}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className="form-select form-select-sm" // Giữ form-select-sm
        >
            {defaultOptionLabel && <option value="">{defaultOptionLabel}</option>}
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

SelectField.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
    })).isRequired,
    required: PropTypes.bool,
    halfWidth: PropTypes.bool,
    name: PropTypes.string,
    disabled: PropTypes.bool,
    defaultOptionLabel: PropTypes.string,
};

export default SelectField;