import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProfile } from '@/hooks/useProfile';
import { ProfileModal } from './ProfileModal';
import { FriendsModal } from './FriendsModal';
import { MissionsModal } from './MissionsModal';
import { User, Users, Star, Sparkles, Scroll } from 'lucide-react';
import pokeballIcon from '@/assets/pokeball_icon.png';
import pokeroulletLogo from '@/assets/pokeroullet-logo.png';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokeshardIcon from '@/assets/pokeshard.png';
interface HeaderProps {
  pokécoins: number;
  nickname?: string;
  onOpenAchievements?: () => void;
  onOpenPokedex?: () => void;
}
export const Header = ({
  pokécoins,
  nickname = "Treinador",
  onOpenAchievements,
  onOpenPokedex
}: HeaderProps) => {
  const {
    profile,
    getAvatarSrc,
    getXPProgress
  } = useProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const xpProgress = getXPProgress();
  return <>
      <header className="w-full p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          {/* Logo and Missions */}
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 animate-spin" style={{
                animationDuration: '8s'
              }}>
                  <img src={pokeballIcon} alt="Pokeball" className="w-full h-full" />
                </div>
                <div>
                  <img src={pokeroulletLogo} alt="PokeRoullet" className="h-16" />
                </div>
              </div>
              
              {/* Missions, Achievements and Pokedex Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowMissionsModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:from-amber-100 hover:to-orange-100">
                  <span className="text-amber-700 font-medium">📜 Missões</span>
                </Button>
                
                {onOpenAchievements && <Button variant="outline" size="sm" onClick={onOpenAchievements} className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:from-yellow-100 hover:to-orange-100">
                    <span className="text-yellow-700 font-medium">🏆 Conquistas</span>
                  </Button>}
                
                
              </div>
            </div>
          </div>

          {/* Center - XP Progress (Desktop) */}
          {profile && <div className="hidden md:block flex-1 max-w-md mx-8">
              <div className="text-center mb-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-primary" />
                  <span>Nível {profile.level}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {xpProgress.current}/{xpProgress.needed} XP
                  </span>
                </div>
              </div>
              <Progress value={xpProgress.percentage} className="h-2" />
            </div>}

          {/* User Info */}
          <div className="flex items-center space-x-3">
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFriendsModal(true)} className="hidden sm:flex items-center gap-2">
                <Users className="w-4 h-4" />
                Amigos
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => setShowProfileModal(true)} className="hidden sm:flex items-center gap-2">
                <User className="w-4 h-4" />
                Perfil
              </Button>
            </div>

            {/* User Info Card */}
            <Card className="px-3 py-2 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowProfileModal(true)}>
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                {profile && <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30">
                      <img src={getAvatarSrc(profile.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground px-1 rounded-full text-xs flex items-center gap-0.5">
                      <Star className="w-2 h-2" />
                      {profile.level}
                    </div>
                  </div>}

                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Olá,</p>
                  <p className="font-bold text-sm">{profile?.nickname || nickname}</p>
                </div>
              </div>
            </Card>

            {/* Pokécoins */}
            <Card className="px-3 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600">
              <div className="flex items-center space-x-2">
                <img src={pokecoinIcon} alt="Pokecoin" className="w-5 h-5" />
                <div>
                  <p className="text-xs text-yellow-900 font-medium">Pokécoins</p>
                  <p className="text-sm font-bold text-yellow-900">{profile?.pokecoins?.toLocaleString() || 0}</p>
                </div>
              </div>
            </Card>

            {/* PokeShards */}
            <Card className="px-3 py-2 bg-gradient-to-r from-purple-400 to-purple-600">
              <div className="flex items-center space-x-2">
                <img src={pokeshardIcon} alt="PokeShard" className="w-5 h-5" />
                <div>
                  <p className="text-xs text-purple-900 font-medium">PokeShards</p>
                  <p className="text-sm font-bold text-purple-900">{profile?.pokeshards?.toLocaleString() || 0}</p>
                </div>
              </div>
            </Card>

            {/* Mobile Actions */}
            <div className="flex sm:hidden gap-1">
              <Button variant="ghost" size="sm" onClick={() => setShowFriendsModal(true)}>
                <Users className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <FriendsModal isOpen={showFriendsModal} onClose={() => setShowFriendsModal(false)} />
      <MissionsModal isOpen={showMissionsModal} onClose={() => setShowMissionsModal(false)} />
    </>;
};