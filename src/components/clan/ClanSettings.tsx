import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClanEmblem, CLAN_EMBLEMS } from './ClanEmblems';
import { ClanInfo, ClanMember } from '@/hooks/useClan';
import { Save, Loader2, ArrowUp, ArrowDown, UserX, Crown, Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface ClanSettingsProps {
  clan: ClanInfo;
  members: ClanMember[];
  myRole: string;
  onUpdateSettings: (clanId: string, description: string, emblem: string, entryType: string, minLevel: number) => Promise<boolean>;
  onManageMember: (targetUserId: string, clanId: string, action: string) => Promise<boolean>;
}

export const ClanSettings = ({ clan, members, myRole, onUpdateSettings, onManageMember }: ClanSettingsProps) => {
  const { t } = useTranslation(['clan']);
  const [description, setDescription] = useState(clan.description || '');
  const [emblem, setEmblem] = useState(clan.emblem);
  const [entryType, setEntryType] = useState<string>(clan.entry_type);
  const [minLevel, setMinLevel] = useState(clan.min_level);
  const [saving, setSaving] = useState(false);
  const [managingMember, setManagingMember] = useState<string | null>(null);

  const isLeader = myRole === 'leader';

  const handleSave = async () => {
    setSaving(true);
    const success = await onUpdateSettings(clan.id, description, emblem, entryType, minLevel);
    if (success) toast.success(t('settings.saved', 'Configurações salvas!'));
    setSaving(false);
  };

  const handleManage = async (targetUserId: string, action: string) => {
    setManagingMember(targetUserId);
    await onManageMember(targetUserId, clan.id, action);
    setManagingMember(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'leader': return <Crown className="w-4 h-4 text-gray-900" />;
      case 'vice_leader': return <Shield className="w-4 h-4 text-gray-700" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Clan Info Settings */}
      <Card className="p-4 space-y-4 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-sm">
        <h4 className="font-semibold text-sm text-gray-900">{t('settings.general', 'Configurações Gerais')}</h4>

        <div className="space-y-2">
          <Label className="text-gray-900 font-semibold">{t('create.description')}</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('create.descriptionPlaceholder')}
            maxLength={100}
            className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-gray-400/20 shadow-sm rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-900">{t('create.emblem')}</Label>
          <div className="grid grid-cols-5 gap-2">
            {CLAN_EMBLEMS.map((e) => (
              <button
                key={e.id}
                onClick={() => setEmblem(e.id)}
                className={`p-2 rounded-lg border-2 transition-all ${
                  emblem === e.id ? 'border-gray-900 bg-gray-100' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ClanEmblem emblemId={e.id} size="sm" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-gray-900">{t('create.entryType')}</Label>
            <Select value={entryType} onValueChange={setEntryType}>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="open">{t('create.entryTypes.open')}</SelectItem>
                <SelectItem value="approval">{t('create.entryTypes.approval')}</SelectItem>
                <SelectItem value="invite_only">{t('create.entryTypes.invite_only')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-900">{t('create.minLevel')}</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={minLevel}
              onChange={(e) => setMinLevel(Number(e.target.value))}
              className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-gray-400/20"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg font-medium">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {t('settings.save', 'Salvar Configurações')}
        </Button>
      </Card>

      {/* Member Management (leader only) */}
      {isLeader && (
        <Card className="p-4 space-y-3 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-sm">
          <h4 className="font-semibold text-sm text-gray-900">{t('settings.manageMembers', 'Gerenciar Membros')}</h4>
          
          <div className="space-y-2">
            {members.filter(m => m.role !== 'leader').map((member) => (
              <div key={member.user_id} className="flex items-center justify-between p-2 rounded-lg bg-gray-100">
                <div className="flex items-center gap-2">
                  {getRoleIcon(member.role)}
                  <span className="text-sm font-medium text-gray-900">{member.nickname}</span>
                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                    {t(`members.${member.role === 'vice_leader' ? 'viceLeader' : 'member'}`)}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {member.role === 'member' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={managingMember === member.user_id}
                      onClick={() => handleManage(member.user_id, 'promote')}
                      title={t('settings.promote', 'Promover')}
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-gray-700" />
                    </Button>
                  )}
                  {member.role === 'vice_leader' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={managingMember === member.user_id}
                      onClick={() => handleManage(member.user_id, 'demote')}
                      title={t('settings.demote', 'Rebaixar')}
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={managingMember === member.user_id}
                        title={t('settings.kick', 'Expulsar')}
                      >
                        <UserX className="w-3.5 h-3.5 text-gray-900" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900">{t('settings.kickConfirmTitle', 'Expulsar membro')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('settings.kickConfirm', 'Tem certeza que deseja expulsar {{name}}?', { name: member.nickname })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-300 text-gray-900 hover:bg-gray-100">{t('settings.cancel', 'Cancelar')}</AlertDialogCancel>
                        <AlertDialogAction className="bg-gray-900 hover:bg-gray-800 text-white">{t('settings.confirmKick', 'Expulsar')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
