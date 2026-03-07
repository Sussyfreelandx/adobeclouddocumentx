import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProviderRedirectProps {
  target: string;
}

const REDIRECT_DELAY_MS = 1500;

const ProviderRedirect: React.FC<ProviderRedirectProps> = ({ target }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(target, { replace: true });
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [navigate, target]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
    </div>
  );
};

export default ProviderRedirect;
