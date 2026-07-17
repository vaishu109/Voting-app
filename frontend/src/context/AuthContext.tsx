import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  voterID: string;
  role: 'Admin' | 'Election Officer' | 'Candidate' | 'Voter';
  twoFactorEnabled: boolean;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const storedUser = localStorage.getItem('sv_user');
      const storedToken = localStorage.getItem('sv_token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('sv_token', accessToken);
    localStorage.setItem('sv_refresh', refreshToken);
    localStorage.setItem('sv_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      const storedEmail = user?.email;
      if (storedEmail) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: storedEmail })
        });
      }
    } catch (e) {
      console.error('Logout API failure:', e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('sv_token');
      localStorage.removeItem('sv_refresh');
      localStorage.removeItem('sv_user');
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('sv_user', JSON.stringify(userData));
  };

  // Advanced fetch wrapper with automatic JWT token refresh capability
  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let currentToken = token || localStorage.getItem('sv_token');
    
    const headers = new Headers(options.headers || {});
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }
    
    let res = await fetch(url, { ...options, headers });
    
    // If token expired (403 or 401), attempt token refresh
    if ((res.status === 401 || res.status === 403) && localStorage.getItem('sv_refresh')) {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: localStorage.getItem('sv_refresh') })
        });
        
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newAccessToken = data.accessToken;
          
          setToken(newAccessToken);
          localStorage.setItem('sv_token', newAccessToken);
          
          // Re-attempt original request
          const retryHeaders = new Headers(options.headers || {});
          retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
          
          res = await fetch(url, { ...options, headers: retryHeaders });
        } else {
          // Refresh token expired or invalid, log out
          await logout();
        }
      } catch (err) {
        console.error('Auto token refresh error:', err);
        await logout();
      }
    }
    
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
