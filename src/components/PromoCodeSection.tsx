import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PromoCodeRewardAnimation } from './PromoCodeRewardAnimation';

export const PromoCodeSection = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [rewards, setRewards] = useState<any>({});
  const [redeemedCode, setRedeemedCode] = useState('');

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast({ title: 'Digite um código', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('redeem_promo_code', { p_code: trimmed });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        setRewards(result.rewards || {});
        setRedeemedCode(trimmed.toUpperCase());
        setShowRewards(true);
        setCode('');
      } else {
        toast({
          title: result?.message || 'Erro ao resgatar código',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({ title: 'Erro ao resgatar código', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="p-3 sm:p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-primary" />
          Usar um Código
        </h4>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Digite seu código..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
          />
          <Button onClick={handleRedeem} disabled={loading || !code.trim()} size="sm" className="shrink-0">
            {loading ? '...' : 'Resgatar'}
          </Button>
        </div>
      </Card>

      <PromoCodeRewardAnimation
        isOpen={showRewards}
        onClose={() => setShowRewards(false)}
        rewards={rewards}
        codeName={redeemedCode}
      />
    </>
  );
};
