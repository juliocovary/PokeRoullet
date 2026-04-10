import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClanMember } from '@/hooks/useClan';
import { useProfile } from '@/hooks/useProfile';
import { Crown, Shield, User, Loader2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { PlayerProfileModal } from '@/components/PlayerProfileModal';

interface ClanMembersListProps {
  members: ClanMember[];
  loading: boolean;
}

export const ClanMembersList = ({ members, loading }: ClanMembersListProps) => {
  const { t } = useTranslation(['clan']);
  const { getAvatarSrc } = useProfile();
  const [selectedMember, setSelectedMember] = useState<{ userId: string; nickname: string } | null>(null);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'leader': return <Crown className="w-4 h-4 text-white" />;
      case 'vice_leader': return <Shield className="w-4 h-4 text-white" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'leader': return t('members.leader');
      case 'vice_leader': return t('members.viceLeader');
      default: return t('members.member');
    }
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'leader': return 'default';
      case 'vice_leader': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
      <div className="flex items-center justify-between px-1 mb-4">
        <h4 className="font-semibold text-lg text-gray-900">{t('members.title')}</h4>
        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
          {members.length} {t('members.title').toLowerCase()}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {members.map((member) => (
          <Card 
            key={member.user_id} 
            onClick={() => setSelectedMember({ userId: member.user_id, nickname: member.nickname })}
            className={`p-4 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md hover:scale-102 cursor-pointer ${
              member.role === 'leader'
                ? 'bg-gradient-to-r from-gray-100 to-white border-gray-300'
                : member.role === 'vice_leader'
                ? 'bg-gradient-to-r from-gray-50 to-white border-gray-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Avatar with Role Badge */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-lg overflow-hidden ring-2 ring-gray-300">
                  <img 
                    src={getAvatarSrc(member.avatar)} 
                    alt={member.nickname}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Role Badge */}
                <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${
                  member.role === 'leader'
                    ? 'bg-gray-900'
                    : member.role === 'vice_leader'
                    ? 'bg-gray-700'
                    : 'bg-gray-400'
                }`}>
                  {getRoleIcon(member.role)}
                </div>
              </div>
              
              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 truncate">{member.nickname}</span>
                  <Badge 
                    className={`text-xs font-bold flex-shrink-0 ${
                      member.role === 'leader'
                        ? 'bg-gray-900 text-white'
                        : member.role === 'vice_leader'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {getRoleLabel(member.role)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                    <Star className="w-3 h-3 text-gray-700" />
                    Level {member.level}
                  </span>
                  <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                    {format(new Date(member.joined_at), 'MMM dd, yy')}
                  </span>
                </div>
              </div>
              
              {/* Contribution */}
              <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('members.contribution')}</p>
                <div className="bg-gray-900 px-3 py-1.5 rounded-lg">
                  <p className="font-bold text-white text-sm">{member.contribution.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      </div>

      <PlayerProfileModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        userId={selectedMember?.userId || ''}
        nickname={selectedMember?.nickname || ''}
      />
    </>
  );
};
