import { useState } from 'react';
import { authApiService } from '../services/authApiService';

export const AuthView = ({ onAuthSuccess }) => {
  const [activeMode, setActiveMode] = useState('login'); // 'login' | 'register'
  
  // Form values
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Switch modes and clear error messages
  const handleToggleMode = (mode) => {
    setActiveMode(mode);
    setErrorMessage('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  // Client side validation rules
  const isEmailValid = (inputValue) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue);
  const isPasswordValid = (inputValue) => inputValue.length >= 6;
  const isConfirmPasswordValid = () => password === confirmPassword;

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Pre-validations
    if (!isEmailValid(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!isPasswordValid(password)) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (activeMode === 'register') {
      if (!name.trim()) {
        setErrorMessage('Please enter your name.');
        return;
      }
      if (!isConfirmPasswordValid()) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (activeMode === 'login') {
        const userData = await authApiService.login({ email, password });
        setSuccessMessage(`Welcome back, ${userData.name}!`);
        
        // Short timeout for standard success animation transition
        setTimeout(() => {
          onAuthSuccess(userData);
        }, 800);
      } else {
        const userData = await authApiService.register({ name, email, password });
        setSuccessMessage('Account registered successfully! Logging you in...');
        
        // Auto-login after successful registration
        setTimeout(() => {
          onAuthSuccess(userData);
        }, 1200);
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-glow-effect auth-glow-1"></div>
      <div className="auth-glow-effect auth-glow-2"></div>
      
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand-header">
          <div className="auth-brand-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
              <path d="M12 6v12"/>
              <path d="M8 10l4-4 4 4"/>
            </svg>
          </div>
          <h2>PlateWise</h2>
          <p>Your elegant, intelligent recipe & meal planner</p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tab-bar">
          <button 
            type="button" 
            className={`auth-tab-btn ${activeMode === 'login' ? 'active' : ''}`}
            onClick={() => handleToggleMode('login')}
          >
            Sign In
          </button>
          <button 
            type="button" 
            className={`auth-tab-btn ${activeMode === 'register' ? 'active' : ''}`}
            onClick={() => handleToggleMode('register')}
          >
            Create Account
          </button>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="auth-alert auth-alert-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert auth-alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form-body">
          
          {/* REGISTER MODE: Name Input */}
          {activeMode === 'register' && (
            <div className="auth-form-group">
              <label className="auth-form-label">Full Name</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input 
                  type="text" 
                  className={`auth-input ${name ? 'has-value' : ''}`}
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="auth-form-group">
            <label className="auth-form-label">Email Address</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z"/>
                  <path d="M22 2 11 13"/>
                </svg>
              </span>
              <input 
                type="email" 
                className={`auth-input ${email ? 'has-value' : ''} ${email && !isEmailValid(email) ? 'invalid' : ''} ${email && isEmailValid(email) ? 'valid' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {email && (
                <span className="auth-validation-indicator">
                  {isEmailValid(email) ? (
                    <span className="text-success-check">✓</span>
                  ) : (
                    <span className="text-error-x">✗</span>
                  )}
                </span>
              )}
            </div>
            {email && !isEmailValid(email) && (
              <span className="auth-input-hint text-danger">Invalid email address format</span>
            )}
          </div>

          {/* Password Input */}
          <div className="auth-form-group">
            <label className="auth-form-label">Password</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input 
                type={showPassword ? "text" : "password"}
                className={`auth-input ${password ? 'has-value' : ''} ${password && !isPasswordValid(password) ? 'invalid' : ''} ${password && isPasswordValid(password) ? 'valid' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  // EyeOff icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                    <line x1="2" y1="2" x2="22" y2="22"/>
                  </svg>
                ) : (
                  // Eye icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {password && !isPasswordValid(password) && (
              <span className="auth-input-hint text-danger">Password must be at least 6 characters long</span>
            )}
          </div>

          {/* REGISTER MODE: Confirm Password Input */}
          {activeMode === 'register' && (
            <div className="auth-form-group">
              <label className="auth-form-label">Confirm Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  className={`auth-input ${confirmPassword ? 'has-value' : ''} ${confirmPassword && !isConfirmPasswordValid() ? 'invalid' : ''} ${confirmPassword && isConfirmPasswordValid() ? 'valid' : ''}`}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    // EyeOff
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                  ) : (
                    // Eye
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && (
                <span className={`auth-input-hint ${isConfirmPasswordValid() ? 'text-success' : 'text-danger'}`}>
                  {isConfirmPasswordValid() ? 'Passwords match' : 'Passwords do not match'}
                </span>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="auth-spinner"></span>
            ) : activeMode === 'login' ? (
              'Sign In to PlateWise'
            ) : (
              'Create My Account'
            )}
          </button>
        </form>

        {/* Footer helper */}
        <div className="auth-footer-prompt">
          {activeMode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button type="button" className="auth-toggle-inline-btn" onClick={() => handleToggleMode('register')}>
                Sign up now
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button type="button" className="auth-toggle-inline-btn" onClick={() => handleToggleMode('login')}>
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
