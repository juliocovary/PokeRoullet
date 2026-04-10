import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Coins, Gem, Loader2 } from 'lucide-react';
import { ClanEmblem } from './ClanEmblems';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokeshardIcon from '@/assets/pokeshard.png';

interface SeasonReward {
  id: string;
  season_number: number;
  clan_rank: number;
  reward_coins: number;
  reward_shards: number;
  reward_spins: number;
  clan_name: string;
  clan_emblem: string;
}

interface SeasonRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: SeasonReward[];
  onClaim: () => Promise<boolean>;
}

export const SeasonRewardsModal = ({ isOpen, onClose, rewards, onClaim }: SeasonRewardsModalProps) => {
  const { t } = useTranslation(['clan']);
  const [claiming, setClaiming] = useState(false);

  if (rewards.length === 0) return null;

  const reward = rewards[0]; // Show first unclaimed reward

  const handleClaim = async () => {
    setClaiming(true);
    const success = await onClaim();
    setClaiming(false);
    if (success) onClose();
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={onClose}
      title={
        <span className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          {t('season.rewardsTitle')}
        </span>
      }
      className="max-w-md"
    >
      <div className="space-y-6 py-4">
        {/* Congratulations */}
        <div className="text-center space-y-3">
          <div className="text-4xl">{getRankEmoji(reward.clan_rank)}</div>
          <h3 className="text-xl font-bold text-amber-400">
            {t('season.congratulations')}
          </h3>
          <p className="text-sm text-slate-300">
            {t('season.seasonEnded', { number: reward.season_number })}
          </p>
        </div>

        {/* Clan Info */}
        <Card className="p-4 bg-slate-800/50 border-slate-700 flex items-center gap-4">
          <ClanEmblem emblemId={reward.clan_emblem} size="md" />
          <div>
            <p className="font-bold text-white">{reward.clan_name}</p>
            <p className="text-sm text-slate-400">
              {t('season.position', { rank: reward.clan_rank })}
            </p>
          </div>
        </Card>

        {/* Rewards List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            {t('season.yourRewards')}
          </h4>
          
          {reward.reward_coins > 0 && (
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-3">
                <img src={pokecoinIcon} alt="Coins" className="w-6 h-6" />
                <span className="text-slate-200">PokéCoins</span>
              </div>
              <span className="font-bold text-amber-400">+{reward.reward_coins.toLocaleString()}</span>
            </div>
          )}

          {reward.reward_shards > 0 && (
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-3">
                <img src={pokeshardIcon} alt="Shards" className="w-6 h-6" />
                <span className="text-slate-200">PokéShards</span>
              </div>
              <span className="font-bold text-purple-400">+{reward.reward_shards.toLocaleString()}</span>
            </div>
          )}

          {reward.reward_spins > 0 && (
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-3">
                <Coins className="w-6 h-6 text-green-400" />
                <span className="text-slate-200">{t('season.bonusCoins')}</span>
              </div>
              <span className="font-bold text-green-400">+{(reward.reward_spins * 100).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Claim Button */}
        <Button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3"
        >
          {claiming ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('season.claimRewards')
          )}
        </Button>
      </div>
    </ResponsiveModal>
  );
};
