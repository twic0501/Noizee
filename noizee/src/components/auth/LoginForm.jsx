import React from 'react';
// import InputField from '../common/InputField';
// import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const LoginForm = ({ onSubmit, loading, error }) => {
    // State for email, password
    // const [email, setEmail] = useState('');
    // const [password, setPassword] = useState('');
    // const [showPassword, setShowPassword] = useState(false);

    // const handleSubmit = (e) => { e.preventDefault(); onSubmit({email, password}); }
    return (
        <form /*onSubmit={handleSubmit}*/>
            {/* {error && <div className="alert alert-danger small py-2">{error}</div>} */}
            {/* InputField cho email */}
            {/* InputField cho password với toggle show/hide */}
            <button type="submit" className="btn btn-dark w-100 py-2" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
            </button>
        </form>
    );
};
export default LoginForm;