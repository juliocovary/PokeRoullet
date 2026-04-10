import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import pokeball from '@/assets/pokeball.png';
import pokeroulletLogo from '@/assets/pokeroullet-logo.png';

const Terms = () => {
  const { i18n } = useTranslation();
  const isPortuguese = i18n.language?.startsWith('pt');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={pokeball} alt="Pokebola" className="w-10 h-10" />
            <img src={pokeroulletLogo} alt="PokeRoullet" className="h-8" />
          </Link>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {isPortuguese ? 'Voltar' : 'Back'}
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-6">
            {isPortuguese ? 'Termos de Uso' : 'Terms of Service'}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {isPortuguese 
              ? 'Última atualização: Dezembro de 2024'
              : 'Last updated: December 2024'}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '1. Aceitação dos Termos' : '1. Acceptance of Terms'}
            </h2>
            <p className="text-muted-foreground">
              {isPortuguese 
                ? 'Ao acessar e usar o PokeRoullet, você concorda em cumprir estes termos de uso. Se você não concordar com qualquer parte destes termos, não use nosso serviço.'
                : 'By accessing and using PokeRoullet, you agree to comply with these terms of service. If you do not agree with any part of these terms, do not use our service.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '2. Descrição do Serviço' : '2. Service Description'}
            </h2>
            <p className="text-muted-foreground">
              {isPortuguese 
                ? 'PokeRoullet é um jogo de navegador gratuito onde os usuários podem coletar Pokémon virtuais através de um sistema de roleta. O jogo é oferecido "como está" e pode ser modificado ou descontinuado a qualquer momento.'
                : 'PokeRoullet is a free browser game where users can collect virtual Pokémon through a roulette system. The game is offered "as is" and may be modified or discontinued at any time.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '3. Conta do Usuário' : '3. User Account'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isPortuguese 
                ? 'Para usar o PokeRoullet, você deve criar uma conta. Você é responsável por:'
                : 'To use PokeRoullet, you must create an account. You are responsible for:'}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{isPortuguese ? 'Manter a confidencialidade de suas credenciais de login' : 'Maintaining the confidentiality of your login credentials'}</li>
              <li>{isPortuguese ? 'Todas as atividades que ocorrem em sua conta' : 'All activities that occur under your account'}</li>
              <li>{isPortuguese ? 'Fornecer informações precisas durante o registro' : 'Providing accurate information during registration'}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '4. Conduta do Usuário' : '4. User Conduct'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isPortuguese ? 'Você concorda em não:' : 'You agree not to:'}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{isPortuguese ? 'Usar bots, scripts ou automação para jogar' : 'Use bots, scripts, or automation to play'}</li>
              <li>{isPortuguese ? 'Explorar bugs ou falhas do sistema' : 'Exploit bugs or system flaws'}</li>
              <li>{isPortuguese ? 'Criar múltiplas contas' : 'Create multiple accounts'}</li>
              <li>{isPortuguese ? 'Assediar ou ofender outros jogadores' : 'Harass or offend other players'}</li>
              <li>{isPortuguese ? 'Tentar hackear ou comprometer a segurança do jogo' : 'Attempt to hack or compromise game security'}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '5. Propriedade Intelectual' : '5. Intellectual Property'}
            </h2>
            <p className="text-muted-foreground">
              {isPortuguese 
                ? 'PokeRoullet é um projeto de fã não oficial. Pokémon e todos os nomes, imagens e marcas relacionadas são propriedade da Nintendo, The Pokémon Company e Game Freak. Este jogo não é endossado, patrocinado ou afiliado a essas empresas.'
                : 'PokeRoullet is an unofficial fan project. Pokémon and all related names, images, and trademarks are property of Nintendo, The Pokémon Company, and Game Freak. This game is not endorsed, sponsored, or affiliated with these companies.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '6. Itens Virtuais' : '6. Virtual Items'}
            </h2>
            <p className="text-muted-foreground">
              {isPortuguese 
                ? 'Todos os itens, Pokémon e moedas no jogo são virtuais e não possuem valor monetário real. Não oferecemos compras com dinheiro real. Seu progresso no jogo é armazenado em nossos servidores e pode ser perdido em caso de problemas técnicos.'
                : 'All items, Pokémon, and coins in the game are virtual and have no real monetary value. We do not offer real money purchases. Your game progress is stored on our servers and may be lost in case of technical issues.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '7. Limitação de Responsabilidade' : '7. Limitation of Liability'}
            </h2>
            <p className="text-muted-foreground">
              {isPortuguese 
                ? 'O PokeRoullet é fornecido "como está" sem garantias de qualquer tipo. Não nos responsabilizamos por quaisquer danos diretos, indiretos, incidentais ou consequenciais resultantes do uso ou incapacidade de usar o serviço.'
                : 'PokeRoullet is provided "as is" without warranties of any kind. We are not responsible for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the service.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '8. Modificações nos Termos' : '8. Changes to Terms'}
            </h2>
            <p className="text-muted-foreground">
              {isPortuguese 
                ? 'Podemos modificar estes termos a qualquer momento. Alterações significativas serão comunicadas através do jogo. O uso continuado do serviço após as alterações constitui aceitação dos novos termos.'
                : 'We may modify these terms at any time. Significant changes will be communicated through the game. Continued use of the service after changes constitutes acceptance of the new terms.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '9. Contato' : '9. Contact'}
            </h2>
            <p className="text-muted-foreground">
              {isPortuguese 
                ? 'Se você tiver dúvidas sobre estes termos de uso, entre em contato conosco através do sistema de feedback do jogo.'
                : 'If you have questions about these terms of service, please contact us through the game\'s feedback system.'}
            </p>
          </section>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 border-t border-border/50 mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex justify-center gap-4">
            <Link to="/" className="text-pokemon-blue hover:underline">
              {isPortuguese ? 'Jogar' : 'Play'}
            </Link>
            <Link to="/about" className="text-pokemon-blue hover:underline">
              {isPortuguese ? 'Sobre' : 'About'}
            </Link>
            <Link to="/privacy" className="text-pokemon-blue hover:underline">
              {isPortuguese ? 'Privacidade' : 'Privacy'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
