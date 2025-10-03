import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useProfile, AVAILABLE_AVATARS } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Star, Sparkles, LogOut, Medal } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { profile, loading, updateProfile, getAvatarSrc, getXPProgress } = useProfile();
  const { signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');

  const handleEditStart = () => {
    if (profile) {
      setEditNickname(profile.nickname);
      setSelectedAvatar(profile.avatar);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    await updateProfile({
      nickname: editNickname,
      avatar: selectedAvatar
    });

    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditNickname('');
    setSelectedAvatar('');
  };

  if (loading || !profile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const xpProgress = getXPProgress();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            🏆 Perfil do Treinador
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg">
                  <img 
                    src={getAvatarSrc(profile.avatar)} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Nível {profile.level}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground">{profile.nickname}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <span className="text-lg">🪙</span>
                    <span className="font-semibold">{profile.pokecoins.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-purple-600">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-semibold">{profile.experience_points} XP</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isEditing && (
                  <>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 border-amber-200 hover:from-yellow-100 hover:to-amber-100"
                    >
                      <span className="text-amber-700">🎖️</span>
                    </Button>
                    <Button onClick={handleEditStart} variant="outline">
                      ✏️ Editar
                    </Button>
                  </>
                )}
                <Button 
                  onClick={signOut} 
                  variant="destructive" 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progresso para o Nível {profile.level + 1}</span>
                <span>{xpProgress.current}/{xpProgress.needed} XP</span>
              </div>
              <Progress value={xpProgress.percentage} className="h-3" />
            </div>
          </Card>

          {/* Edit Form */}
          {isEditing && (
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">Editar Perfil</h4>
              
              {/* Nickname */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="Seu nickname"
                />
              </div>

              {/* Avatar Selection */}
              <div className="space-y-3 mb-6">
                <Label>Escolha seu Avatar</Label>
                <div className="grid grid-cols-4 gap-3">
                  {AVAILABLE_AVATARS.map((avatar) => (
                    <div
                      key={avatar.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedAvatar === avatar.id
                          ? 'ring-4 ring-primary scale-105'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => setSelectedAvatar(avatar.id)}
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
                        <img 
                          src={avatar.src} 
                          alt={avatar.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-center mt-1 font-medium">{avatar.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex gap-3">
                <Button onClick={handleSave} className="flex-1">
                  💾 Salvar
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex-1">
                  ❌ Cancelar
                </Button>
              </div>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-2xl font-bold text-primary">{profile.level}</div>
              <div className="text-sm text-muted-foreground">Nível</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-2xl font-bold text-purple-600">{profile.experience_points}</div>
              <div className="text-sm text-muted-foreground">XP Total</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">🪙</div>
              <div className="text-2xl font-bold text-yellow-600">{profile.pokecoins}</div>
              <div className="text-sm text-muted-foreground">Pokécoins</div>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};