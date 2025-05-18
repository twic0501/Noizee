// admin-frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useCallback, useMemo, useContext } from 'react';
import { useApolloClient } from '@apollo/client';
import logger from '../utils/logger';
import {
    ADMIN_TOKEN_KEY,
    ADMIN_IS_ADMIN_KEY,
    ADMIN_ID_KEY,
    ADMIN_NAME_KEY,
    ADMIN_USERNAME_KEY,
    ADMIN_EMAIL_KEY
} from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState(() => {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        const isAdminString = localStorage.getItem(ADMIN_IS_ADMIN_KEY);
        const adminId = localStorage.getItem(ADMIN_ID_KEY);
        const adminName = localStorage.getItem(ADMIN_NAME_KEY);
        const username = localStorage.getItem(ADMIN_USERNAME_KEY);
        const email = localStorage.getItem(ADMIN_EMAIL_KEY);

        if (token && isAdminString === 'true') {
            return { token, isAdmin: true, adminId, adminName, username, email };
        }
        return { token: null, isAdmin: false, adminId: null, adminName: null, username: null, email: null };
    });

    const client = useApolloClient();

    // Hàm logout được định nghĩa trước để setAuthInfo có thể gọi nó
    const logout = useCallback(() => {
        logger.info("[AuthContext Admin] Logging out admin.");
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_IS_ADMIN_KEY);
        localStorage.removeItem(ADMIN_ID_KEY);
        localStorage.removeItem(ADMIN_NAME_KEY);
        localStorage.removeItem(ADMIN_USERNAME_KEY);
        localStorage.removeItem(ADMIN_EMAIL_KEY);

        setAuthState({ token: null, isAdmin: false, adminId: null, adminName: null, username: null, email: null });
        client.resetStore().catch(error => logger.error('Error resetting Apollo cache on admin logout:', error));
    }, [client]);


    const setAuthInfo = useCallback((loginData) => {
        // LOG TOÀN BỘ DỮ LIỆU NHẬN ĐƯỢC TỪ LoginPage
        console.log("!!! DEBUG AuthContext: Data received by setAuthInfo:", loginData);
        logger.info("!!! DEBUG AuthContext: Data received by setAuthInfo:", loginData);

        if (!loginData || typeof loginData !== 'object') {
            logger.warn("[AuthContext Admin] setAuthInfo received invalid or null data. Clearing state.");
            logout();
            return;
        }

        const {
            token,
            isAdmin,
            customer_id,
            customer_name,
            username,
            customer_email
        } = loginData;

        // LOG GIÁ TRỊ VÀ KIỂU CỦA isAdmin TRƯỚC KHI KIỂM TRA
        console.log(`!!! DEBUG AuthContext: isAdmin value: ${isAdmin}, type: ${typeof isAdmin}`);
        logger.info(`!!! DEBUG AuthContext: isAdmin value: ${isAdmin}, type: ${typeof isAdmin}`);

        if (isAdmin !== true) {
            logger.warn("[AuthContext Admin] Attempted to setAuthInfo for a non-admin or isAdmin is not strictly true. Clearing state.", {
                receivedIsAdmin: isAdmin,
                receivedUsername: username,
                expectedIsAdminType: 'boolean',
                expectedIsAdminValue: true
            });
            logout();
            return;
        }

        logger.info("[AuthContext Admin] Setting auth info for admin:", { username, customer_id });
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
        localStorage.setItem(ADMIN_IS_ADMIN_KEY, String(isAdmin)); // Lưu 'true'
        if (customer_id) localStorage.setItem(ADMIN_ID_KEY, String(customer_id));
        if (customer_name) localStorage.setItem(ADMIN_NAME_KEY, customer_name);
        if (username) localStorage.setItem(ADMIN_USERNAME_KEY, username);
        if (customer_email) localStorage.setItem(ADMIN_EMAIL_KEY, customer_email);

        setAuthState({
            token,
            isAdmin: true,
            adminId: String(customer_id),
            adminName: customer_name,
            username: username,
            email: customer_email,
        });
    }, [client, logout]); // Thêm logout vào dependency array

    const isAdminAuthenticated = useMemo(() => {
        return !!authState.token && authState.isAdmin === true;
    }, [authState.token, authState.isAdmin]);

    const contextValue = useMemo(() => ({
        authState,
        setAuthInfo,
        logout,
        isAdminAuthenticated,
    }), [authState, setAuthInfo, logout, isAdminAuthenticated]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => { // Đảm bảo export useAuth nếu LoginPage.jsx dùng nó
    const context = useContext(AuthContext);
    if (context === undefined || context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
