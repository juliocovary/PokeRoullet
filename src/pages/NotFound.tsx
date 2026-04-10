import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, Search, ArrowLeft } from 'lucide-react';
import pokeball from '@/assets/pokeball.png';
import pokeroulletLogo from '@/assets/pokeroullet-logo.png';

const NotFound = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const isPortuguese = i18n.language?.startsWith('pt');

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
          <Link to="/" className="flex items-center gap-3">
            <img src={pokeball} alt="Pokebola" className="w-10 h-10" />
            <img src={pokeroulletLogo} alt="PokeRoullet" className="h-8" />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="max-w-lg w-full p-8 text-center">
          {/* 404 Animation */}
          <div className="mb-6">
            <div className="text-8xl font-bold text-pokemon-blue/20 mb-4">404</div>
            <img 
              src={pokeball} 
              alt="Pokebola" 
              className="w-20 h-20 mx-auto animate-bounce"
              style={{ animationDuration: '2s' }}
            />
          </div>

          <h1 className="text-2xl font-bold mb-4">
            {isPortuguese ? 'Página não encontrada!' : 'Page not found!'}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {isPortuguese 
              ? 'Parece que este Pokémon fugiu! A página que você está procurando não existe ou foi movida.'
              : 'Looks like this Pokémon escaped! The page you are looking for does not exist or has been moved.'}
          </p>

          <div className="space-y-3">
            <Link to="/" className="block">
              <Button className="w-full gap-2">
                <Home className="w-4 h-4" />
                {isPortuguese ? 'Voltar para o Jogo' : 'Back to Game'}
              </Button>
            </Link>
            
            <Link to="/about" className="block">
              <Button variant="outline" className="w-full gap-2">
                <Search className="w-4 h-4" />
                {isPortuguese ? 'Conhecer o PokeRoullet' : 'Learn about PokeRoullet'}
              </Button>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              {isPortuguese ? 'Páginas úteis:' : 'Helpful pages:'}
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Link to="/about" className="text-pokemon-blue hover:underline">
                {isPortuguese ? 'Como Jogar' : 'How to Play'}
              </Link>
              <Link to="/auth" className="text-pokemon-blue hover:underline">
                {isPortuguese ? 'Login' : 'Login'}
              </Link>
              <Link to="/terms" className="text-pokemon-blue hover:underline">
                {isPortuguese ? 'Termos' : 'Terms'}
              </Link>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 border-t border-border/50 py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>
            {isPortuguese 
              ? 'PokeRoullet - Capture Pokémon através de uma roleta!'
              : 'PokeRoullet - Catch Pokémon with a roulette wheel!'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
