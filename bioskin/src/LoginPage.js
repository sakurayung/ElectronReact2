// src/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function LoginPage({ onLoginSuccess }) { // Receive onLoginSuccess prop
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  const handleLogin = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setError(''); // Clear previous errors
    setIsLoading(true);

    if (!username || !password) {
      setError('Please enter both username and password.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('LoginPage: Calling window.electronAPI.login');
      const result = await window.electronAPI.login({ username, password });
      console.log('LoginPage: Login result:', result);

      if (result.success) {
        // Call the callback function passed from App.js
        // This function will update the auth state in App.js
        onLoginSuccess(result.user);
        // Navigate to the main app page (we'll define the '/' route later)
        navigate('/');
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('LoginPage: Login error:', err);
      setError('An error occurred during login. ' + err.message);
    } finally {
      setIsLoading(false); // Stop loading indicator
    }
  };

  return (
    // Use similar styling structure as your App.js if desired
    <div className="container" style={{ maxWidth: '500px', margin: '5rem auto' }}>
      <div className="card">
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Inventory Login</h1>
        </header>
        <main>
          <form onSubmit={handleLogin}>
            {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-actions" style={{ justifyContent: 'center' }}>
              <button type="submit" className="button button-primary" disabled={isLoading}>
                {isLoading ? 'Logging In...' : 'Login'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default LoginPage;