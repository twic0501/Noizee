import React, { createContext, useContext, useReducer } from 'react';

const AdminStateContext = createContext();
const AdminDispatchContext = createContext();

const initialState = {
  notifications: [],
  activeFilters: {},
  cachedFormData: {},
};

function adminReducer(state, action) {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    case 'SET_FILTER':
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          [action.payload.key]: action.payload.value,
        },
      };
    case 'CACHE_FORM_DATA':
      return {
        ...state,
        cachedFormData: {
          ...state.cachedFormData,
          [action.payload.formId]: action.payload.data,
        },
      };
    default:
      return state;
  }
}

export function AdminStateProvider({ children }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  return (
    <AdminStateContext.Provider value={state}>
      <AdminDispatchContext.Provider value={dispatch}>
        {children}
      </AdminDispatchContext.Provider>
    </AdminStateContext.Provider>
  );
}

// Custom hooks
export function useAdminState() {
  const context = useContext(AdminStateContext);
  if (context === undefined) {
    throw new Error('useAdminState must be used within an AdminStateProvider');
  }
  return context;
}

export function useAdminDispatch() {
  const context = useContext(AdminDispatchContext);
  if (context === undefined) {
    throw new Error('useAdminDispatch must be used within an AdminStateProvider');
  }
  return context;
}