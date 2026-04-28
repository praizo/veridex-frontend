import { useState, useEffect, useContext } from 'react';
import { authApi } from '../api/auth';
import type { User } from '../api/auth';
import type { LoginData, RegisterData } from '../types/auth';
import { AuthContext } from './AuthContextInstance';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const { data } = await authApi.me();
          setUser(data);
        } catch {
          localStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (data: LoginData) => {
    const { data: response } = await authApi.login(data);
    localStorage.setItem('auth_token', response.token);
    setUser(response.user);
  };

  const register = async (data: RegisterData) => {
    const { data: response } = await authApi.register(data);
    localStorage.setItem('auth_token', response.token);
    setUser(response.user);
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
