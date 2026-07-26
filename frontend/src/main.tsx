import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider } from './context/AuthContext';

// Set production API base URL dynamically or fall back to local backend port 5001
axios.defaults.baseURL = (import.meta as any).env.VITE_API_URL || ((import.meta as any).env.DEV ? '' : 'http://localhost:5001');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
