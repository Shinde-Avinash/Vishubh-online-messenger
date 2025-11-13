import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/theme.css';
import './index.css';

// Apply dark mode class immediately if saved in localStorage
const applyTheme = () => {
  const savedDarkMode = localStorage.getItem('vishubh_darkmode');
  if (savedDarkMode) {
    const isDark = JSON.parse(savedDarkMode);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } else {
    // No saved preference - default to light mode
    document.documentElement.classList.remove('dark');
  }
};

// Apply theme on page load
applyTheme();

// Watch for localStorage changes and sync DOM class
window.addEventListener('storage', () => {
  applyTheme();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);