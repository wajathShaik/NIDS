import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldIcon, EyeIcon, EyeOffIcon } from '../components/icons';
import FaceScanAuth from '../components/FaceScanAuth';
import VoiceprintAuth from '../components/VoiceprintAuth';

type AuthMode = 'password' | 'face' | 'voice';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLoginSuccess = () => {
      navigate('/search');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      handleLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('shaikhussain098098@gmail.com');
    setPassword('XaiNidsEnterpriseAdmin!@2024');
    // Use a timeout to allow React state to update before submitting the form
    setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
            // Programmatically submit the form after filling credentials
             form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
    }, 100);
  }
  
  const TabButton: React.FC<{mode: AuthMode, children: React.ReactNode}> = ({ mode, children }) => (
      <button
          type="button"
          onClick={() => setAuthMode(mode)}
          className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              authMode === mode ? 'bg-gray-700/80 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
          }`}
      >
          {children}
      </button>
  )

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-transparent overflow-hidden">
      <div className="relative z-10 w-full max-w-md p-8 space-y-8 material-thick rounded-2xl">
        <div className="text-center">
            <ShieldIcon className="w-12 h-12 mx-auto text-blue-500" />
            <h1 className="mt-4 text-3xl font-bold text-white tracking-tight">NIDS-XAI Platform</h1>
            <p className="mt-2 text-gray-400">Enterprise Security Command Center</p>
        </div>
        
        <div className="border-b border-gray-600">
            <div className="-mb-px flex space-x-2">
                <TabButton mode="password">Password</TabButton>
                <TabButton mode="face">Face Scan</TabButton>
                <TabButton mode="voice">Voiceprint</TabButton>
            </div>
        </div>

        {authMode === 'password' && (
            <form className="space-y-6 animate-fade-in-scale" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-gray-300">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 mt-1 text-white bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="shaikhussain098098@gmail.com"
                />
              </div>
              <div>
                <label htmlFor="password"className="text-sm font-medium text-gray-300">Password</label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 text-white bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder="XaiNidsEnterpriseAdmin!@2024"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white">
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              <div>
                <button type="submit" disabled={loading} className="w-full flex justify-center px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50">
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
               <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">Or</span>
                <div className="flex-grow border-t border-gray-600"></div>
              </div>
               <div>
                <button type="button" onClick={handleDemoLogin} disabled={loading} className="w-full flex justify-center px-4 py-3 font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-500 disabled:opacity-50">
                  Use Demo Admin Credentials
                </button>
              </div>
            </form>
        )}

        {authMode === 'face' && <div className="animate-fade-in-scale"><FaceScanAuth onSuccess={handleLoginSuccess} /></div>}
        {authMode === 'voice' && <div className="animate-fade-in-scale"><VoiceprintAuth onSuccess={handleLoginSuccess} /></div>}

         <div className="text-sm text-center text-gray-400">
            <p>
                <Link to="/register" className="font-medium text-blue-400 hover:underline">
                    Register Account
                </Link>
                 {' | '}
                <Link to="/forgot-password" className="font-medium text-blue-400 hover:underline">
                    Forgot Password?
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;