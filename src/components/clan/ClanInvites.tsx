import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClanEmblem } from './ClanEmblems';
import { ClanInvite } from '@/hooks/useClan';
import { Mail, Check, X, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import i18n from '@/i18n/config';
import { useState } from 'react';

interface ClanInvitesProps {
  invites: ClanInvite[];
  onRespond: (inviteId: string, accept: boolean) => Promise<boolean>;
}

export const ClanInvites = ({ invites, onRespond }: ClanInvitesProps) => {
  const { t } = useTranslation(['clan']);
  const [responding, setResponding] = useState<string | null>(null);

  const getLocale = () => {
    return i18n.language === 'pt' ? ptBR : enUS;
  };

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setResponding(inviteId);
    await onRespond(inviteId, accept);
    setResponding(null);
  };

  if (invites.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{t('invites.noInvites')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-gray-700" />
        <h4 className="font-medium text-sm text-gray-900">{t('invites.title')}</h4>
      </div>

      {invites.map((invite) => (
        <Card key={invite.id} className="p-3 border-gray-200 bg-gradient-to-r from-white to-gray-50 hover:bg-white shadow-sm hover:shadow-md hover:scale-102 transition-all duration-300 cursor-default">
          <div className="flex items-center gap-3">
            <ClanEmblem emblemId={invite.clan_emblem} size="sm" />
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-gray-900">{invite.clan_name}</p>
              <p className="text-xs text-gray-600">
                {t('invites.from')} {invite.inviter_nickname}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {t('invites.expires')} {formatDistanceToNow(new Date(invite.expires_at), { 
                  addSuffix: true, 
                  locale: getLocale() 
                })}
              </p>
            </div>
            
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRespond(invite.id, false)}
                disabled={responding === invite.id}
                className="w-8 h-8 p-0 border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => handleRespond(invite.id, true)}
                disabled={responding === invite.id}
                className="w-8 h-8 p-0 bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg"
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
