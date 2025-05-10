import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext'; // Đường dẫn tới context

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { // Kiểm tra undefined thay vì !context
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};