import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

export interface UserProfile {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  state: string;
  district: string;
  village: string;
  farmSize?: number;
  primaryCrop?: string;
  language: string;
  profilePicture?: string;
  role: 'user' | 'admin';
  bookmarks: {
    schemes: string[];
    marketPrices: string[];
  };
}

interface AuthContextProps {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  requestOTP: (mobile: string, email?: string) => Promise<boolean>;
  verifyOTPCode: (mobile: string, otp: string) => Promise<{ isRegistered: boolean; user?: UserProfile }>;
  registerProfile: (profile: Omit<UserProfile, '_id' | 'role' | 'bookmarks'>) => Promise<void>;
  loginWithPassword: (mobile: string, passwordFallback: string) => Promise<void>;
  logout: () => void;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  toggleBookmarkAPI: (type: 'scheme' | 'marketPrice', id: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('farmer_token'));
  const [loading, setLoading] = useState(true);

  // Set default authorization header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get('/api/auth/profile');
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const requestOTP = async (mobile: string, email?: string): Promise<boolean> => {
    try {
      const res = await axios.post('/api/auth/send-otp', { mobile, email });
      return res.data.success;
    } catch (err: any) {
      console.error('Error requesting OTP:', err);
      const errMsg = err.response?.data?.message || 'Error sending OTP. Please try again.';
      const cooldownRemaining = err.response?.data?.cooldownRemaining;
      
      const errorObj = new Error(errMsg) as any;
      errorObj.cooldownRemaining = cooldownRemaining;
      errorObj.response = err.response;
      throw errorObj;
    }
  };

  const verifyOTPCode = async (mobile: string, otp: string) => {
    const res = await axios.post('/api/auth/verify-otp', { mobile, otp });
    if (res.data.success && res.data.isRegistered && res.data.token) {
      localStorage.setItem('farmer_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return {
      isRegistered: res.data.isRegistered,
      user: res.data.user
    };
  };

  const registerProfile = async (profile: Omit<UserProfile, '_id' | 'role' | 'bookmarks'>) => {
    const res = await axios.post('/api/auth/signup', profile);
    if (res.data.success && res.data.token) {
      localStorage.setItem('farmer_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const loginWithPassword = async (mobile: string, passwordFallback: string) => {
    if (!mobile || !passwordFallback) {
      throw new Error('Please fill in credentials');
    }
    const res = await axios.post('/api/auth/login', { mobile, password: passwordFallback });
    if (res.data.success && res.data.token) {
      localStorage.setItem('farmer_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('farmer_token');
    setToken(null);
    setUser(null);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    const res = await axios.put('/api/auth/profile', data);
    if (res.data.success) {
      setUser(res.data.user);
    }
  };

  const toggleBookmarkAPI = async (type: 'scheme' | 'marketPrice', id: string) => {
    if (!user) return;
    try {
      const res = await axios.post('/api/auth/bookmark', { type, id });
      if (res.data.success) {
        setUser({
          ...user,
          bookmarks: res.data.bookmarks
        });
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    const response = await axios.get('/api/auth/profile');
    if (response.data.success) {
      setUser(response.data.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        requestOTP,
        verifyOTPCode,
        registerProfile,
        loginWithPassword,
        logout,
        updateProfileData,
        toggleBookmarkAPI,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
