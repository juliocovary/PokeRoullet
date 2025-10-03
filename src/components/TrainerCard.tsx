import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, UserPlus, Check, X, Mail, Package } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface TrainerCardProps {
  friend: any;
  type: 'friend' | 'pending' | 'sent' | 'search';
  onAddFriend?: (userId: string) => void;
  onAcceptRequest?: (friendshipId: string, accept: boolean) => void;
  onRemoveFriend?: (friendshipId: string) => void;
}

interface PokemonCount {
  total: number;
  unique: number;
}

export const TrainerCard = ({ friend, type, onAddFriend, onAcceptRequest, onRemoveFriend }: TrainerCardProps) => {
  const { getAvatarSrc } = useProfile();
  const [pokemonCount, setPokemonCount] = useState<PokemonCount>({ total: 0, unique: 0 });

  useEffect(() => {
    const loadPokemonCount = async () => {
      if (type === 'friend') {
        try {
          const { data, error } = await supabase
            .from('pokemon_inventory')
            .select('quantity')
            .eq('user_id', friend.user_id);

          if (!error && data) {
            const total = data.reduce((sum, item) => sum + item.quantity, 0);
            const unique = data.length;
            setPokemonCount({ total, unique });
          }
        } catch (error) {
          console.error('Error loading pokemon count:', error);
        }
      }
    };

    loadPokemonCount();
  }, [friend.user_id, type]);

  return (
    <Card className="p-4">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border">
            <img 
              src={getAvatarSrc(friend.avatar)} 
              alt={friend.nickname} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground px-1 rounded-full text-xs flex items-center gap-0.5">
            <Star className="w-2 h-2" />
            {friend.level}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{friend.nickname}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Nível {friend.level}</span>
            <span>•</span>
            <span>{friend.experience_points} XP</span>
            {type === 'friend' && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  <span>{pokemonCount.unique} únicos ({pokemonCount.total} total)</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {type === 'search' && onAddFriend && (
            <Button 
              size="sm" 
              onClick={() => onAddFriend(friend.user_id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          )}
          
          {type === 'pending' && onAcceptRequest && (
            <>
              <Button 
                size="sm" 
                onClick={() => onAcceptRequest(friend.friendship.id, true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => onAcceptRequest(friend.friendship.id, false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
          
          {type === 'sent' && (
            <Badge variant="secondary">
              <Mail className="w-3 h-3 mr-1" />
              Enviado
            </Badge>
          )}
          
          {type === 'friend' && onRemoveFriend && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onRemoveFriend(friend.friendship.id)}
            >
              Remover
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};