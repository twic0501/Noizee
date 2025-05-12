// src/hooks/useAuth.js
import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext'; // Đường dẫn tới AuthContext

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { // Nên kiểm tra === undefined vì context có thể là null ban đầu
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};