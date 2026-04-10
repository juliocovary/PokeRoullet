import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useClan } from '@/hooks/useClan';
import { ClanDashboard } from './clan/ClanDashboard';
import { ClanSearchList } from './clan/ClanSearchList';
import { ClanCreateForm } from './clan/ClanCreateForm';
import { ClanRanking } from './clan/ClanRanking';
import { ClanInvites } from './clan/ClanInvites';
import { Shield, Search, Plus, Trophy, Loader2, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ClanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClanModal = ({ isOpen, onClose }: ClanModalProps) => {
  const { t } = useTranslation(['clan']);
  const isMobile = useIsMobile();
  const { 
    userClan, 
    members, 
    pendingInvites,
    loading, 
    membersLoading,
    respondToInvite,
    createClan,
    joinClan,
    leaveClan,
    searchClans,
    updateSettings,
    manageMember,
    refreshClan,
    refreshInvites,
    refreshMembers,
  } = useClan();
  
  const [activeTab, setActiveTab] = useState('my-clan');

  // OPTIMIZATION: Lazy-load clan data when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshClan();
      refreshInvites();
    }
  }, [isOpen, refreshClan, refreshInvites]);

  // Load members when clan is available
  useEffect(() => {
    if (isOpen && userClan?.has_clan) {
      refreshMembers();
    }
  }, [isOpen, userClan?.has_clan, refreshMembers]);

  const hasPendingInvites = pendingInvites.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-full h-[90vh]' : 'max-w-3xl max-h-[85vh]'} overflow-hidden flex flex-col bg-white border-gray-200 shadow-lg`}>
        <DialogHeader className="bg-gradient-to-r from-gray-50 to-gray-100 -mx-6 px-6 py-4 border-b border-gray-200 shadow-sm">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            <div className="p-2 bg-gray-900 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden overflow-x-hidden">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="my-clan" className="text-xs sm:text-sm">
                <Shield className="w-4 h-4 mr-1 hidden sm:inline" />
                {t('tabs.myClan')}
              </TabsTrigger>
              <TabsTrigger value="search" className="text-xs sm:text-sm">
                <Search className="w-4 h-4 mr-1 hidden sm:inline" />
                {t('tabs.search')}
              </TabsTrigger>
              <TabsTrigger value="create" className="text-xs sm:text-sm" disabled={userClan?.has_clan}>
                <Plus className="w-4 h-4 mr-1 hidden sm:inline" />
                {t('tabs.create')}
              </TabsTrigger>
              <TabsTrigger value="ranking" className="text-xs sm:text-sm">
                <Trophy className="w-4 h-4 mr-1 hidden sm:inline" />
                {t('tabs.ranking')}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto overflow-x-hidden mt-4 pr-1">
              <TabsContent value="my-clan" className="mt-0">
                {userClan?.has_clan ? (
                  <ClanDashboard 
                    clanData={userClan} 
                    members={members}
                    membersLoading={membersLoading}
                    onLeaveClan={leaveClan}
                    onUpdateSettings={updateSettings}
                    onManageMember={manageMember}
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{t('noClan.title')}</h3>
                      <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                        {t('noClan.description')}
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => setActiveTab('search')}>
                          <Search className="w-4 h-4 mr-2" />
                          {t('noClan.searchButton')}
                        </Button>
                        <Button onClick={() => setActiveTab('create')}>
                          <Plus className="w-4 h-4 mr-2" />
                          {t('noClan.createButton')}
                        </Button>
                      </div>
                    </div>

                    {hasPendingInvites && (
                      <ClanInvites 
                        invites={pendingInvites} 
                        onRespond={respondToInvite}
                      />
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="search" className="mt-0">
                <ClanSearchList 
                  onJoinSuccess={() => setActiveTab('my-clan')}
                  searchClans={searchClans}
                  joinClan={joinClan}
                  userClanId={userClan?.clan?.id}
                />
              </TabsContent>

              <TabsContent value="create" className="mt-0">
                {userClan?.has_clan ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('noClan.alreadyInClan', 'Você já está em um clã')}
                  </div>
                ) : (
                  <ClanCreateForm 
                    onSuccess={() => setActiveTab('my-clan')}
                    createClan={createClan}
                  />
                )}
              </TabsContent>

              <TabsContent value="ranking" className="mt-0">
                <ClanRanking />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
