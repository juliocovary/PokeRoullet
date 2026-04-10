import { Card } from '@/components/ui/card';
import pokeball from '@/assets/pokeball.png';
import forestBackground from '@/assets/pokemon-forest-background.png';
import pokeroulletLogo from '@/assets/pokeroullet-logo.png';

const AuthMaintenance = () => {
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
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-pokemon-blue animate-pulse" />
        <div className="absolute top-1/3 right-20 w-16 h-16 rounded-full bg-pokemon-red animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/4 w-12 h-12 rounded-full bg-pokemon-yellow animate-pulse delay-2000" />
        <div className="absolute bottom-1/3 right-1/3 w-8 h-8 rounded-full bg-pokemon-green animate-pulse delay-3000" />
      </div>

      <Card className="card-pokemon w-full max-w-md p-8 relative z-10 border-4 border-pokemon-blue/30">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={pokeball} alt="Pokebola" className="w-16 h-16 mr-3 animate-spin" style={{ animationDuration: '8s' }} />
            <img src={pokeroulletLogo} alt="PokeRoullet" className="h-16" />
          </div>
          <p className="text-muted-foreground text-lg font-semibold">Atualizacao de infraestrutura | Infrastructure update</p>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <div className="p-4 rounded-lg border border-pokemon-yellow/40 bg-pokemon-yellow/10">
            <h2 className="text-pokemon-blue font-bold mb-2">EN</h2>
            <p className="text-foreground/90">
              We are currently migrating our database to a stronger infrastructure to support the game&apos;s growth.
            </p>
            <p className="text-foreground/90 mt-2">Your data is safe and will be fully preserved throughout this process.</p>
            <p className="text-foreground/90 mt-2">Full service is expected to be restored by April 14.</p>
            <p className="text-foreground/90 mt-2">
              As a thank you for your patience, players will receive special rewards once we are back online.
            </p>
            <p className="text-foreground/90 mt-2 font-medium">Thank you all for your support.</p>
          </div>

          <div className="p-4 rounded-lg border border-pokemon-blue/30 bg-white/70">
            <h2 className="text-pokemon-blue font-bold mb-2">PT-BR</h2>
            <p className="text-foreground/90">
              Estamos realizando a migracao do banco de dados para uma estrutura mais robusta, acompanhando o crescimento do jogo.
            </p>
            <p className="text-foreground/90 mt-2">Seus dados estao seguros e serao preservados durante todo o processo.</p>
            <p className="text-foreground/90 mt-2">A previsao de retorno completo e ate o dia 14 de abril.</p>
            <p className="text-foreground/90 mt-2">
              Como forma de agradecimento pela paciencia, voces receberao recompensas especiais quando voltarmos.
            </p>
            <p className="text-foreground/90 mt-2 font-medium">Muito obrigado pelo apoio de todos.</p>
          </div>

          <div className="text-center p-2 bg-pokemon-blue/10 rounded-lg border border-pokemon-blue/20">
            <p className="text-xs text-pokemon-blue font-semibold uppercase tracking-wide">PokeRoullet Team</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AuthMaintenance;
