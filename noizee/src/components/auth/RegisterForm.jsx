import React from 'react';

const RegisterForm = ({ onSubmit, loading, error }) => {
    // State for firstName, lastName, email, password
    return (
        <form /*onSubmit={handleSubmit}*/>
            {/* InputFields */}
            <button type="submit" className="btn btn-dark w-100 py-2" disabled={loading}>
                {loading ? 'Registering...' : 'Create Account'}
            </button>
        </form>
    );
};
export default RegisterForm;