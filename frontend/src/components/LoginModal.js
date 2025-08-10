import React, { useState } from 'react';
import './LoginModal.css';
import { GoogleLogin } from 'react-google-login';
import { authService } from '../auth/authService';

const LoginModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await authService.signIn(email, password);
      } else {
        await authService.register(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setError('');
    try {
      await authService.signInWithGoogle(response);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleFailure = (error) => {
    console.error('Google OAuth Error:', error);
    setError('Google sign-in failed. Please try again.');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V13H5V6.3l7-3.11v9.8z" fill="#1a1a1a"/>
            </svg>
          </div>
          <h2>{isLogin ? 'Welcome Back' : 'Welcome'}</h2>
          <p>Sign {isLogin ? 'In' : 'Up'} to NeuroDécor to continue to NeuroDécor.</p>
        </div>
        <form className="modal-form" onSubmit={handleAuthAction}>
          <div className="form-group">
            <input type="email" placeholder="Email address*" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <input type="password" placeholder="Password*" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <span className="password-toggle">👁</span>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="continue-btn">Continue</button>
        </form>
        <div className="login-prompt">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => setIsLogin(!isLogin)} className="toggle-auth-btn">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
        <div className="divider">
          <span>OR</span>
        </div>
        <GoogleLogin
          clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}
          render={renderProps => (
            <button 
              className="google-btn" 
              onClick={renderProps.onClick}
              disabled={renderProps.disabled}
            >
              <span className="google-icon"></span>
              Continue with Google
            </button>
          )}
          buttonText="Continue with Google"
          onSuccess={handleGoogleSuccess}
          onFailure={handleGoogleFailure}
          cookiePolicy={'single_host_origin'}
        />
      </div>
    </div>
  );
};

export default LoginModal;