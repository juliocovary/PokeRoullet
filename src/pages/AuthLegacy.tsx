import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, KeyRound } from 'lucide-react';
import pokeball from '@/assets/pokeball.png';
import forestBackground from '@/assets/pokemon-forest-background.png';
import pokeroulletLogo from '@/assets/pokeroullet-logo.png';

const AuthLegacy = () => {
  const { t } = useTranslation('auth');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Sign up form state
  const [signUpData, setSignUpData] = useState({
    nickname: '',
    email: '',
    password: '',
  });

  // Sign in form state
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');

  // Reset password state
  const [newPasswordData, setNewPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Listen for PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPassword(true);
      }
    });

    // Check URL hash for recovery token (Supabase sends tokens in hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('type') === 'recovery') {
      setIsResetPassword(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const validateSignUp = () => {
    const newErrors: Record<string, string> = {};

    if (signUpData.nickname.length < 3) {
      newErrors.nickname = t('nicknameShort');
    }

    if (!signUpData.email || !/\S+@\S+\.\S+/.test(signUpData.email)) {
      newErrors.email = t('invalidEmail');
    }

    if (signUpData.password.length < 6) {
      newErrors.password = t('passwordTooShort');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignIn = () => {
    const newErrors: Record<string, string> = {};

    if (!signInData.email || !/\S+@\S+\.\S+/.test(signInData.email)) {
      newErrors.email = t('invalidEmail');
    }

    if (!signInData.password) {
      newErrors.password = t('passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResetEmail = () => {
    const newErrors: Record<string, string> = {};

    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      newErrors.resetEmail = t('invalidEmail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNewPassword = () => {
    const newErrors: Record<string, string> = {};

    if (newPasswordData.password.length < 6) {
      newErrors.newPassword = t('passwordTooShort');
    }

    if (newPasswordData.password !== newPasswordData.confirmPassword) {
      newErrors.confirmPassword = t('passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUp()) return;

    setLoading(true);
    try {
      // Sign up (backend will handle nickname uniqueness via trigger)
      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            nickname: signUpData.nickname,
          },
        },
      });

      if (error) throw error;

      toast({
        title: t('accountCreated'),
        description: t('welcomeToPokeRoullet'),
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: t('errors.signUpFailed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignIn()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) throw error;

      toast({
        title: t('loginSuccess'),
        description: t('loginSuccessDesc'),
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: t('errors.loginFailed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateResetEmail()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });

      if (error) throw error;

      toast({
        title: t('emailSent'),
        description: t('checkInbox'),
      });

      setIsForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: t('errors.resetFailed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateNewPassword()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPasswordData.password,
      });

      if (error) throw error;

      toast({
        title: t('passwordChanged'),
        description: t('passwordChangedDesc'),
      });

      setIsResetPassword(false);
      setNewPasswordData({ password: '', confirmPassword: '' });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: t('errors.updateFailed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderTitle = () => {
    if (isResetPassword) return t('newPasswordTitle');
    if (isForgotPassword) return t('forgotPasswordTitle');
    return isSignUp ? t('createAccount') : t('enterAccount');
  };

  const renderSubtitle = () => {
    if (isResetPassword) return t('newPasswordDesc');
    if (isForgotPassword) return t('forgotPasswordDesc');
    return isSignUp ? t('startJourney') : t('welcomeBack');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Forest background with blur */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${forestBackground})`,
          filter: 'blur(3px)',
          transform: 'scale(1.1)',
        }}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-white/80" />

      {/* Pokemon-themed background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-pokemon-blue animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-16 h-16 rounded-full bg-pokemon-red animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 rounded-full bg-pokemon-yellow animate-pulse delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/3 w-8 h-8 rounded-full bg-pokemon-green animate-pulse delay-3000"></div>
      </div>

      <Card className="card-pokemon w-full max-w-md p-8 relative z-10 border-4 border-pokemon-blue/30">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={pokeball} alt="Pokebola" className="w-16 h-16 mr-3 animate-spin" style={{ animationDuration: '8s' }} />
            <img src={pokeroulletLogo} alt="PokeRoullet" className="h-16" />
          </div>
          <p className="text-muted-foreground text-lg">{renderTitle()}</p>
          <div className="mt-4 p-2 bg-pokemon-yellow/20 rounded-lg border border-pokemon-yellow/40">
            <p className="text-sm text-pokemon-blue font-medium">{renderSubtitle()}</p>
          </div>
        </div>

        {/* Reset Password Form (after clicking email link) */}
        {isResetPassword ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">{t('newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={newPasswordData.password}
                onChange={(e) => setNewPasswordData((prev) => ({ ...prev, password: e.target.value }))}
                className={errors.newPassword ? 'border-red-500' : ''}
              />
              {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={newPasswordData.confirmPassword}
                onChange={(e) => setNewPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <KeyRound className="w-5 h-5 mr-2" />
              {loading ? t('updating') : t('updatePassword')}
            </Button>
          </form>
        ) : isForgotPassword ? (
          /* Forgot Password Form */
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="resetEmail">{t('emailLabel')}</Label>
              <Input
                id="resetEmail"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className={errors.resetEmail ? 'border-red-500' : ''}
              />
              {errors.resetEmail && <p className="text-red-500 text-sm mt-1">{errors.resetEmail}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Mail className="w-5 h-5 mr-2" />
              {loading ? t('sending') : t('sendResetLink')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsForgotPassword(false);
                setResetEmail('');
                setErrors({});
              }}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToLogin')}
            </Button>
          </form>
        ) : isSignUp ? (
          /* Sign Up Form */
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="nickname">{t('nicknameLabel')}</Label>
              <Input
                id="nickname"
                type="text"
                placeholder={t('nicknamePlaceholder')}
                value={signUpData.nickname}
                onChange={(e) => setSignUpData((prev) => ({ ...prev, nickname: e.target.value }))}
                className={errors.nickname ? 'border-red-500' : ''}
              />
              {errors.nickname && <p className="text-red-500 text-sm mt-1">{errors.nickname}</p>}
            </div>

            <div>
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={signUpData.email}
                onChange={(e) => setSignUpData((prev) => ({ ...prev, email: e.target.value }))}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">{t('passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={signUpData.password}
                onChange={(e) => setSignUpData((prev) => ({ ...prev, password: e.target.value }))}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <img src={pokeball} alt="Pokebola" className="w-5 h-5 mr-2" />
              {loading ? t('creatingAccount') : t('startJourneyButton')}
            </Button>
          </form>
        ) : (
          /* Sign In Form */
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <Label htmlFor="signInEmail">{t('emailLabel')}</Label>
              <Input
                id="signInEmail"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={signInData.email}
                onChange={(e) => setSignInData((prev) => ({ ...prev, email: e.target.value }))}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="signInPassword">{t('passwordLabel')}</Label>
              <Input
                id="signInPassword"
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={signInData.password}
                onChange={(e) => setSignInData((prev) => ({ ...prev, password: e.target.value }))}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <img src={pokeball} alt="Pokebola" className="w-5 h-5 mr-2" />
              {loading ? t('entering') : t('enterButton')}
            </Button>

            <Button
              type="button"
              variant="link"
              onClick={() => {
                setIsForgotPassword(true);
                setErrors({});
              }}
              className="w-full text-sm text-muted-foreground hover:text-pokemon-blue"
            >
              {t('forgotPassword')}
            </Button>
          </form>
        )}

        {!isForgotPassword && !isResetPassword && (
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
                setSignUpData({ nickname: '', email: '', password: '' });
                setSignInData({ email: '', password: '' });
              }}
              className="text-sm"
            >
              {isSignUp ? t('hasAccount') : t('noAccount')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuthLegacy;
