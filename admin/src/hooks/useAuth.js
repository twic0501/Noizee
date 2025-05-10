// src/hooks/useAuth.js
import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext.jsx'; // Đảm bảo đúng đường dẫn

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) { // Nên kiểm tra context === undefined thay vì !context
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};