// src/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // We'll create this new CSS file

// Placeholder for your logo - replace with your actual logo path
import logoPlaceholder from './assets/logo.png'; // Create an assets folder in src if you don't have one

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Please enter both username and password.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await window.electronAPI.login({ username, password });
      if (result.success) {
        onLoginSuccess(result.user);
        navigate('/');
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred during login. ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Left Panel */}
      <div className="login-left-panel">
        <div className="login-branding">
          <img src={logoPlaceholder} alt="Bioskin Logo" className="login-logo" />
          <h1>BIOSKIN INVENTORY</h1>

        </div>
      </div>

      {/* Right Panel (Login Form) */}
      <div className="login-right-panel">
        <div className="login-form-container">
          <h2>LOGIN</h2>
          <form onSubmit={handleLogin}>
            {error && <div className="login-error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
                placeholder="" // The design doesn't show placeholders inside inputs
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                placeholder=""
              />
            </div>



            <div className="form-actions">
              <button type="submit" className="button button-login" disabled={isLoading}>
                {isLoading ? 'Logging In...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;