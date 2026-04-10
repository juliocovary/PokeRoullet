import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gamepad2, Target, Trophy, Users, Sparkles, Gift } from 'lucide-react';
import pokeball from '@/assets/pokeball.png';
import pokeroulletLogo from '@/assets/pokeroullet-logo.png';

const About = () => {
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
              {isPortuguese ? 'Voltar ao Jogo' : 'Back to Game'}
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-pokemon-blue mb-4">
            {isPortuguese ? 'Bem-vindo ao PokeRoullet!' : 'Welcome to PokeRoullet!'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {isPortuguese 
              ? 'A experiência definitiva de colecionar Pokémon! Gire a roleta, capture criaturas raras e complete sua Pokédex em uma jornada épica através de todas as regiões.'
              : 'The ultimate Pokémon collecting experience! Spin the roulette, catch rare creatures, and complete your Pokédex on an epic journey across all regions.'}
          </p>
        </section>

        {/* What is PokeRoullet */}
        <section className="mb-12">
          <Card className="p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-pokemon-blue" />
              {isPortuguese ? 'O que é o PokeRoullet?' : 'What is PokeRoullet?'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isPortuguese 
                ? 'PokeRoullet é um jogo gratuito de navegador onde você pode capturar Pokémon girando uma roleta. Cada giro lhe dá a chance de encontrar Pokémon de diferentes raridades - desde os comuns até os lendários mais raros!'
                : 'PokeRoullet is a free browser game where you can catch Pokémon by spinning a roulette wheel. Each spin gives you a chance to find Pokémon of different rarities - from common ones to the rarest legendaries!'}
            </p>
            <p className="text-muted-foreground">
              {isPortuguese 
                ? 'O jogo apresenta Pokémon de quatro regiões: Kanto, Johto, Hoenn e Sinnoh. Complete sua coleção, evolua seus Pokémon, negocie com outros jogadores e suba no ranking global!'
                : 'The game features Pokémon from four regions: Kanto, Johto, Hoenn, and Sinnoh. Complete your collection, evolve your Pokémon, trade with other players, and climb the global rankings!'}
            </p>
          </Card>
        </section>

        {/* How to Play */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-pokemon-red" />
            {isPortuguese ? 'Como Jogar' : 'How to Play'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-2">1. {isPortuguese ? 'Crie sua Conta' : 'Create Your Account'}</h3>
              <p className="text-muted-foreground">
                {isPortuguese 
                  ? 'Registre-se gratuitamente e escolha seu Pokémon inicial entre Bulbasaur, Charmander ou Squirtle.'
                  : 'Sign up for free and choose your starter Pokémon between Bulbasaur, Charmander, or Squirtle.'}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-2">2. {isPortuguese ? 'Gire a Roleta' : 'Spin the Roulette'}</h3>
              <p className="text-muted-foreground">
                {isPortuguese 
                  ? 'Use seus giros gratuitos para capturar Pokémon. Os giros são renovados automaticamente a cada 2 horas!'
                  : 'Use your free spins to catch Pokémon. Spins are automatically renewed every 2 hours!'}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-2">3. {isPortuguese ? 'Complete Missões' : 'Complete Missions'}</h3>
              <p className="text-muted-foreground">
                {isPortuguese 
                  ? 'Complete missões diárias e semanais para ganhar recompensas especiais como moedas, fragmentos e itens raros.'
                  : 'Complete daily and weekly missions to earn special rewards like coins, shards, and rare items.'}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-2">4. {isPortuguese ? 'Evolua e Colecione' : 'Evolve and Collect'}</h3>
              <p className="text-muted-foreground">
                {isPortuguese 
                  ? 'Use cartas duplicadas para evoluir seus Pokémon e coloque-os na Pokédex para registrar sua conquista!'
                  : 'Use duplicate cards to evolve your Pokémon and place them in the Pokédex to register your achievement!'}
              </p>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-pokemon-yellow" />
            {isPortuguese ? 'Recursos do Jogo' : 'Game Features'}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-pokemon-blue/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-pokemon-blue" />
              </div>
              <h3 className="font-bold mb-2">{isPortuguese ? 'Rankings Globais' : 'Global Rankings'}</h3>
              <p className="text-sm text-muted-foreground">
                {isPortuguese 
                  ? 'Compita com jogadores do mundo todo nos rankings de nível, Pokédex e Shinies!'
                  : 'Compete with players worldwide in level, Pokédex, and Shiny rankings!'}
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-pokemon-red/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-pokemon-red" />
              </div>
              <h3 className="font-bold mb-2">{isPortuguese ? 'Sistema de Amigos' : 'Friends System'}</h3>
              <p className="text-sm text-muted-foreground">
                {isPortuguese 
                  ? 'Adicione amigos, compare coleções e veja quem tem os Pokémon mais raros!'
                  : 'Add friends, compare collections, and see who has the rarest Pokémon!'}
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-pokemon-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6 text-pokemon-green" />
              </div>
              <h3 className="font-bold mb-2">{isPortuguese ? 'Eventos Especiais' : 'Special Events'}</h3>
              <p className="text-sm text-muted-foreground">
                {isPortuguese 
                  ? 'Participe de eventos temporários com missões exclusivas e recompensas únicas!'
                  : 'Participate in temporary events with exclusive missions and unique rewards!'}
              </p>
            </Card>
          </div>
        </section>

        {/* Rarities */}
        <section className="mb-12">
          <Card className="p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-4">
              {isPortuguese ? 'Sistema de Raridades' : 'Rarity System'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isPortuguese 
                ? 'Os Pokémon no PokeRoullet são classificados por raridade, cada uma com diferentes chances de aparecer na roleta:'
                : 'Pokémon in PokeRoullet are classified by rarity, each with different chances of appearing on the roulette:'}
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li><span className="font-bold text-gray-600">Common</span> - {isPortuguese ? '65% de chance' : '65% chance'}</li>
              <li><span className="font-bold text-green-600">Uncommon</span> - {isPortuguese ? '25% de chance' : '25% chance'}</li>
              <li><span className="font-bold text-blue-600">Rare</span> - {isPortuguese ? '10% de chance' : '10% chance'}</li>
              <li><span className="font-bold text-purple-600">Pseudo-Legendary</span> - {isPortuguese ? '1% de chance' : '1% chance'}</li>
              <li><span className="font-bold text-orange-600">Starter</span> - {isPortuguese ? '0.5% de chance' : '0.5% chance'}</li>
              <li><span className="font-bold text-yellow-600">Legendary</span> - {isPortuguese ? '0.1% de chance' : '0.1% chance'}</li>
              <li><span className="font-bold text-pink-600">Secret</span> - {isPortuguese ? '0.01% de chance' : '0.01% chance'}</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              {isPortuguese 
                ? 'Dica: Use Poções de Sorte para aumentar suas chances de encontrar Pokémon raros!'
                : 'Tip: Use Luck Potions to increase your chances of finding rare Pokémon!'}
            </p>
          </Card>
        </section>

        {/* Shiny Pokemon */}
        <section className="mb-12">
          <Card className="p-6 md:p-8 bg-gradient-to-r from-yellow-50 to-amber-50 border-amber-200">
            <h2 className="text-2xl font-bold mb-4 text-amber-800">
              ✨ {isPortuguese ? 'Pokémon Shiny' : 'Shiny Pokémon'}
            </h2>
            <p className="text-amber-700 mb-4">
              {isPortuguese 
                ? 'Pokémon Shiny são versões raríssimas com coloração alternativa! Eles têm apenas 1% de chance de aparecer em qualquer captura. Colete Shinies para mostrar no ranking e impressionar seus amigos!'
                : 'Shiny Pokémon are extremely rare versions with alternate coloring! They have only a 1% chance of appearing on any catch. Collect Shinies to show off in the rankings and impress your friends!'}
            </p>
            <p className="text-sm text-amber-600">
              {isPortuguese 
                ? 'Use a Poção Shiny para dobrar suas chances por 12 horas!'
                : 'Use the Shiny Potion to double your chances for 12 hours!'}
            </p>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Card className="p-8 bg-gradient-to-r from-pokemon-blue/10 to-pokemon-red/10">
            <h2 className="text-2xl font-bold mb-4">
              {isPortuguese ? 'Pronto para começar sua jornada?' : 'Ready to start your journey?'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isPortuguese 
                ? 'Junte-se a milhares de treinadores e comece a capturar Pokémon agora mesmo!'
                : 'Join thousands of trainers and start catching Pokémon right now!'}
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                <img src={pokeball} alt="" className="w-5 h-5" />
                {isPortuguese ? 'Jogar Agora' : 'Play Now'}
              </Button>
            </Link>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 border-t border-border/50 mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="mb-2">
            {isPortuguese 
              ? 'PokeRoullet é um projeto de fã não afiliado à Nintendo, The Pokémon Company ou Game Freak.'
              : 'PokeRoullet is a fan project not affiliated with Nintendo, The Pokémon Company, or Game Freak.'}
          </p>
          <p className="text-sm">
            {isPortuguese 
              ? 'Pokémon e todos os nomes relacionados são marcas registradas de seus respectivos proprietários.'
              : 'Pokémon and all related names are registered trademarks of their respective owners.'}
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link to="/" className="text-pokemon-blue hover:underline">
              {isPortuguese ? 'Jogar' : 'Play'}
            </Link>
            <Link to="/terms" className="text-pokemon-blue hover:underline">
              {isPortuguese ? 'Termos de Uso' : 'Terms of Service'}
            </Link>
            <Link to="/privacy" className="text-pokemon-blue hover:underline">
              {isPortuguese ? 'Privacidade' : 'Privacy Policy'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
