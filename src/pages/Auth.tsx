import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import pokeball from '@/assets/pokeball.png';
import forestBackground from '@/assets/pokemon-forest-background.png';
import pokeroulletLogo from '@/assets/pokeroullet-logo.png';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
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

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateSignUp = () => {
    const newErrors: Record<string, string> = {};
    
    if (signUpData.nickname.length < 3) {
      newErrors.nickname = 'Nickname deve ter pelo menos 3 caracteres';
    }
    
    if (!signUpData.email || !/\S+@\S+\.\S+/.test(signUpData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (signUpData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignIn = () => {
    const newErrors: Record<string, string> = {};
    
    if (!signInData.email || !/\S+@\S+\.\S+/.test(signInData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!signInData.password) {
      newErrors.password = 'Senha é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUp()) return;
    
    setLoading(true);
    try {
      // Verificar se o nickname já existe
      const { data: existingProfile, error: searchError } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('nickname', signUpData.nickname)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (existingProfile) {
        throw new Error('Este nickname já está em uso. Por favor, escolha outro.');
      }

      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            nickname: signUpData.nickname,
          }
        }
      });

      if (error) throw error;

      toast({
        title: '⚡ Conta criada!',
        description: 'Bem-vindo ao PokeRoullet!',
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro no cadastro',
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
        title: '⚽ Bem-vindo de volta!',
        description: 'Login realizado com sucesso!',
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro no login',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Forest background with blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${forestBackground})`,
          filter: 'blur(3px)',
          transform: 'scale(1.1)'
        }}
      />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pokemon-blue/30 via-pokemon-green/20 to-pokemon-yellow/30" />
      
      {/* Pokémon-themed background elements */}
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
          <p className="text-muted-foreground text-lg">
            {isSignUp ? '🎮 Crie sua conta de treinador' : '⚡ Entre na sua conta'}
          </p>
          <div className="mt-4 p-2 bg-pokemon-yellow/20 rounded-lg border border-pokemon-yellow/40">
            <p className="text-sm text-pokemon-blue font-medium">
              {isSignUp ? 'Comece sua jornada Pokémon!' : 'Bem-vindo de volta, treinador!'}
            </p>
          </div>
        </div>

        {isSignUp ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="Ash Ketchum"
                value={signUpData.nickname}
                onChange={(e) => setSignUpData(prev => ({ ...prev, nickname: e.target.value }))}
                className={errors.nickname ? 'border-red-500' : ''}
              />
              {errors.nickname && <p className="text-red-500 text-sm mt-1">{errors.nickname}</p>}
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ash@pokemon.com"
                value={signUpData.email}
                onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>


            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={signUpData.password}
                onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <img src={pokeball} alt="Pokebola" className="w-5 h-5 mr-2" />
              {loading ? 'Criando conta...' : 'Comece sua Jornada'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <Label htmlFor="signInEmail">Email</Label>
              <Input
                id="signInEmail"
                type="email"
                placeholder="ash@pokemon.com"
                value={signInData.email}
                onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="signInPassword">Senha</Label>
              <Input
                id="signInPassword"
                type="password"
                placeholder="••••••"
                value={signInData.password}
                onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <img src={pokeball} alt="Pokebola" className="w-5 h-5 mr-2" />
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        )}

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
            {isSignUp 
              ? 'Já tem uma conta? Faça login' 
              : 'Não tem conta? Crie uma agora'
            }
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;