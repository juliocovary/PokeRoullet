import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import pokeball from '@/assets/pokeball.png';
import pokeroulletLogo from '@/assets/pokeroullet-logo.png';

const Privacy = () => {
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
            {isPortuguese ? 'Política de Privacidade' : 'Privacy Policy'}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {isPortuguese 
              ? 'Última atualização: Dezembro de 2024'
              : 'Last updated: December 2024'}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '1. Informações que Coletamos' : '1. Information We Collect'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isPortuguese 
                ? 'Coletamos as seguintes informações quando você usa o PokeRoullet:'
                : 'We collect the following information when you use PokeRoullet:'}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>{isPortuguese ? 'Informações de Conta:' : 'Account Information:'}</strong> {isPortuguese ? 'Email e nome de usuário (nickname) fornecidos durante o registro.' : 'Email and username (nickname) provided during registration.'}</li>
              <li><strong>{isPortuguese ? 'Dados de Jogo:' : 'Game Data:'}</strong> {isPortuguese ? 'Progresso no jogo, Pokémon capturados, itens, missões e conquistas.' : 'Game progress, caught Pokémon, items, missions, and achievements.'}</li>
              <li><strong>{isPortuguese ? 'Dados de Uso:' : 'Usage Data:'}</strong> {isPortuguese ? 'Informações sobre como você usa o jogo, como tempo de sessão e ações realizadas.' : 'Information about how you use the game, such as session time and actions taken.'}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '2. Como Usamos suas Informações' : '2. How We Use Your Information'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isPortuguese ? 'Usamos suas informações para:' : 'We use your information to:'}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{isPortuguese ? 'Fornecer e manter o serviço do jogo' : 'Provide and maintain the game service'}</li>
              <li>{isPortuguese ? 'Salvar seu progresso no jogo' : 'Save your game progress'}</li>
              <li>{isPortuguese ? 'Exibir rankings e placares' : 'Display rankings and leaderboards'}</li>
              <li>{isPortuguese ? 'Melhorar a experiência do jogo' : 'Improve the game experience'}</li>
              <li>{isPortuguese ? 'Comunicar atualizações importantes sobre o jogo' : 'Communicate important updates about the game'}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '3. Compartilhamento de Informações' : '3. Information Sharing'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isPortuguese 
                ? 'Não vendemos suas informações pessoais. Podemos compartilhar informações:'
                : 'We do not sell your personal information. We may share information:'}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{isPortuguese ? 'Publicamente nos rankings (apenas nickname e estatísticas de jogo)' : 'Publicly in rankings (only nickname and game statistics)'}</li>
              <li>{isPortuguese ? 'Com provedores de serviço que nos ajudam a operar o jogo' : 'With service providers who help us operate the game'}</li>
              <li>{isPortuguese ? 'Quando exigido por lei ou para proteger nossos direitos' : 'When required by law or to protect our rights'}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '4. Armazenamento de Dados' : '4. Data Storage'}
            </h2>
            <p className="text-muted-foreground">
              {isPortuguese 
                ? 'Seus dados são armazenados de forma segura em servidores na nuvem (Supabase). Implementamos medidas de segurança para proteger suas informações contra acesso não autorizado.'
                : 'Your data is stored securely on cloud servers (Supabase). We implement security measures to protect your information from unauthorized access.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '5. Seus Direitos' : '5. Your Rights'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isPortuguese ? 'Você tem o direito de:' : 'You have the right to:'}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{isPortuguese ? 'Acessar seus dados pessoais' : 'Access your personal data'}</li>
              <li>{isPortuguese ? 'Corrigir informações imprecisas' : 'Correct inaccurate information'}</li>
              <li>{isPortuguese ? 'Solicitar a exclusão de sua conta e dados' : 'Request deletion of your account and data'}</li>
              <li>{isPortuguese ? 'Exportar seus dados de jogo' : 'Export your game data'}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '6. Cookies e Tecnologias Similares' : '6. Cookies and Similar Technologies'}
            </h2>
            <p className="text-muted-foreground">
              {isPortuguese 
                ? 'Usamos armazenamento local do navegador para manter sua sessão de login e preferências. Também utilizamos o Google AdSense para exibir anúncios, que pode usar cookies para personalizar anúncios.'
                : 'We use browser local storage to maintain your login session and preferences. We also use Google AdSense to display ads, which may use cookies to personalize advertisements.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '7. Serviços de Terceiros' : '7. Third-Party Services'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isPortuguese ? 'Utilizamos os seguintes serviços de terceiros:' : 'We use the following third-party services:'}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Supabase:</strong> {isPortuguese ? 'Para autenticação e armazenamento de dados' : 'For authentication and data storage'}</li>
              <li><strong>Google AdSense:</strong> {isPortuguese ? 'Para exibição de anúncios' : 'For ad display'}</li>
              <li><strong>PokeAPI:</strong> {isPortuguese ? 'Para imagens e dados de Pokémon' : 'For Pokémon images and data'}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '8. Menores de Idade' : '8. Children\'s Privacy'}
            </h2>
            <p className="text-muted-foreground">
              {isPortuguese 
                ? 'O PokeRoullet é adequado para todas as idades. No entanto, menores de 13 anos devem ter permissão dos pais ou responsáveis para criar uma conta.'
                : 'PokeRoullet is suitable for all ages. However, children under 13 must have permission from a parent or guardian to create an account.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '9. Alterações nesta Política' : '9. Changes to This Policy'}
            </h2>
            <p className="text-muted-foreground">
              {isPortuguese 
                ? 'Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas através do jogo ou por email.'
                : 'We may update this policy periodically. We will notify you of significant changes through the game or by email.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">
              {isPortuguese ? '10. Contato' : '10. Contact'}
            </h2>
            <p className="text-muted-foreground">
              {isPortuguese 
                ? 'Se você tiver dúvidas sobre esta política de privacidade ou sobre como tratamos seus dados, entre em contato conosco através do sistema de feedback do jogo.'
                : 'If you have questions about this privacy policy or how we handle your data, please contact us through the game\'s feedback system.'}
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
            <Link to="/terms" className="text-pokemon-blue hover:underline">
              {isPortuguese ? 'Termos' : 'Terms'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
