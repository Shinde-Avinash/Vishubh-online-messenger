import React, { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './LoginScreen.css';

const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, darkMode, setDarkMode } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        if (!username || username.length < 3) {
          setError('Username must be at least 3 characters');
          setLoading(false);
          return;
        }
        result = await register(username, email, password);
      }

      if (!result.success) {
        setError(result.error);
      }
    } catch {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Decorative Elements */}
        <div className="corner-decoration top-left"></div>
        <div className="corner-decoration top-right"></div>
        <div className="corner-decoration bottom-left"></div>
        <div className="corner-decoration bottom-right"></div>

        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo-icon">
            <Send size={40} />
          </div>
          <h1 className="logo-text">Vishubh</h1>
          <p className="logo-subtitle">Secure Messaging Platform</p>
        </div>

        {/* Style Picker - Pill Toggle */}
        <div className="theme-picker">
          <button
            onClick={() => setDarkMode(false)}
            className={`theme-btn ${!darkMode ? 'active' : ''}`}
          >
            Light
          </button>
          <button
            onClick={() => setDarkMode(true)}
            className={`theme-btn ${darkMode ? 'active' : ''}`}
          >
            Dark
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="error-alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="tab-switcher">
          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`tab-btn ${isLogin ? 'active' : ''}`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`tab-btn ${!isLogin ? 'active' : ''}`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Username Field (SignUp Only) */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required={!isLogin}
              />
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Confirm Password Field (SignUp Only) */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required={!isLogin}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Processing...</span>
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>🔒 Military-grade Encryption • Private by Design • Lightning Fast</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;