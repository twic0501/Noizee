import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useApolloClient, useMutation, useLazyQuery } from '@apollo/client';
import { LOGIN_USER_MUTATION, REGISTER_USER_MUTATION } from '../api/graphql/authMutations';
import { GET_ME_QUERY } from '../api/graphql/userQueries';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AuthContext = createContext();

// Helper function to map backend AuthPayload/Customer data to frontend user structure
const mapAuthDataToUser = (customerData) => {
  if (!customerData) return null;

  const nameParts = customerData.customer_name ? customerData.customer_name.split(' ') : ['', ''];
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  return {
    id: customerData.customer_id,
    firstName: firstName,
    lastName: lastName,
    email: customerData.customer_email,
    role: customerData.isAdmin ? 'admin' : 'user',
    username: customerData.username,
    phoneNumber: customerData.customer_tel || null,
    address: customerData.customer_address || null,
    isActive: customerData.isActive !== undefined ? customerData.isActive : true, // Default or handle as per backend
    virtual_balance: customerData.virtual_balance
  };
};

export const AuthProvider = ({ children }) => {
  const client = useApolloClient();

  const [authState, setAuthState] = useState({
    token: localStorage.getItem('userToken') || null,
    user: null,
    isAuthenticated: false,
    loading: true,
    authError: null,
  });

  // Login
  const [loginUserMutation, { loading: loginLoading, error: loginError }] = useMutation(LOGIN_USER_MUTATION, {
    onError: (error) => setAuthState(prev => ({ ...prev, authError: error.message, loading: false })),
    onCompleted: (data) => {
      if (data.login) {
        const { token, ...customerFromPayload } = data.login;
        const user = mapAuthDataToUser(customerFromPayload);
        
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        setAuthState({
          token,
          user,
          isAuthenticated: true,
          loading: false,
          authError: null,
        });
      }
    },
  });

  // Register
  const [registerUserMutation, { loading: registerLoading, error: registerError }] = useMutation(REGISTER_USER_MUTATION, {
    onError: (error) => setAuthState(prev => ({ ...prev, authError: error.message, loading: false })),
    onCompleted: (data) => {
      if (data.register) {
        const { token, ...customerFromPayload } = data.register;
        const user = mapAuthDataToUser(customerFromPayload);

        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(user));

        setAuthState({
          token,
          user,
          isAuthenticated: true,
          loading: false,
          authError: null,
        });
      }
    },
  });

  // Fetch current user (me)
  const [fetchMe, { loading: meLoading, error: meError }] = useLazyQuery(GET_ME_QUERY, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data.myProfile) {
        const detailedUser = mapAuthDataToUser(data.myProfile);
        localStorage.setItem('userData', JSON.stringify(detailedUser));
        setAuthState(prev => ({
          ...prev,
          user: detailedUser,
          isAuthenticated: true,
          loading: false,
          authError: null,
        }));
      } else {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        setAuthState({ token: null, user: null, isAuthenticated: false, loading: false, authError: "Failed to verify user." });
      }
    },
    onError: (error) => {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      client.clearStore();
      setAuthState({ token: null, user: null, isAuthenticated: false, loading: false, authError: error.message });
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const storedUserData = localStorage.getItem('userData');

    if (token) {
      if (storedUserData) {
        try {
          setAuthState(prev => ({
            ...prev,
            token,
            user: JSON.parse(storedUserData),
            isAuthenticated: true,
          }));
        } catch (e) {
          localStorage.removeItem('userData');
        }
      }
      fetchMe(); 
    } else {
      setAuthState({ token: null, user: null, isAuthenticated: false, loading: false, authError: null });
    }
  }, [fetchMe]);


  const login = useCallback(async (email, password) => {
    setAuthState(prev => ({ ...prev, loading: true, authError: null }));
    try {
      await loginUserMutation({ variables: { identifier: email, password: password } });
    } catch (e) {
      console.error("Login context function error:", e);
      setAuthState(prev => ({ ...prev, authError: "An unknown login error occurred.", loading: false }));
    }
  }, [loginUserMutation]);

  const register = useCallback(async (formDataFromComponent) => {
    setAuthState(prev => ({ ...prev, loading: true, authError: null }));
    try {
      // Transform formDataFromComponent to match backend's RegisterInput structure
      const backendReadyInput = {
        customer_name: `${formDataFromComponent.firstName || ''} ${formDataFromComponent.lastName || ''}`.trim(),
        customer_email: formDataFromComponent.email,
        customer_password: formDataFromComponent.password,
        customer_tel: formDataFromComponent.phoneNumber || '', // Assuming phoneNumber maps to customer_tel
        customer_address: formDataFromComponent.address || null,
        // username: formDataFromComponent.username || null, // Include if your form collects username for RegisterInput
      };

      // Ensure required fields are present after transformation
      if (!backendReadyInput.customer_name) {
        throw new Error("Customer name is required.");
      }
      if (!backendReadyInput.customer_email) {
        throw new Error("Customer email is required.");
      }
      if (!backendReadyInput.customer_password) {
        throw new Error("Customer password is required.");
      }
      if (!backendReadyInput.customer_tel && backendReadyInput.customer_tel !== "") { 
        // customer_tel is required as String! in backend, allow empty string if form allows it
        // but if it's truly optional in form and not sent, handle accordingly or ensure it's always at least ""
        // For now, assuming if phoneNumber is empty string, it's acceptable for customer_tel
        // If backend requires non-empty, this check or form validation should be stricter.
      }


      await registerUserMutation({ variables: { input: backendReadyInput } });
    } catch (e) {
      console.error("Register context function error:", e);
      // If e is already a GraphQL error from the mutation, its message might be more specific
      const errorMessage = e.graphQLErrors && e.graphQLErrors.length > 0 
        ? e.graphQLErrors[0].message 
        : (e.message || "An unknown registration error occurred.");
      setAuthState(prev => ({ ...prev, authError: errorMessage, loading: false }));
    }
  }, [registerUserMutation]);

  const logout = useCallback(async () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    try {
      await client.clearStore();
    } catch (error) {
      console.error("Error clearing/resetting Apollo Client store on logout:", error);
    }
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      loading: false,
      authError: null,
    });
  }, [client]);
  
  const clearAuthError = useCallback(() => {
    setAuthState(prev => ({ ...prev, authError: null }));
  }, []);

  const contextValue = {
    authState,
    login,
    logout,
    register,
    isLoading: authState.loading || loginLoading || registerLoading || meLoading,
    authError: authState.authError || loginError?.message || registerError?.message || meError?.message,
    clearAuthError,
  };
  
  if (authState.loading && !authState.isAuthenticated && authState.token === null) {
     return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <LoadingSpinner />
        </div>
     );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};