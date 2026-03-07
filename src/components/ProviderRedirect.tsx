import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from './common/Spinner';

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
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
};

export default ProviderRedirect;
