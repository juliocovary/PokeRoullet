import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AFFILIATE_LINK = 'https://www.effectivegatecpm.com/ri42zzmh7?key=bd1bff386a8cca81f177eb4383f12608';

interface AffiliateStatus {
  can_claim: boolean;
  next_claim_at: string | null;
  hours_remaining?: number;
  error?: string;
}

interface ClaimResult {
  success: boolean;
  error?: string;
  message?: string;
  new_spin_count?: number;
  next_claim_at?: string;
  hours_remaining?: number;
}

export const useAffiliateBonus = (freeSpins: number, onRefresh?: () => void) => {
  const [canClaim, setCanClaim] = useState(false);
  const [nextClaimAt, setNextClaimAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Only show affiliate button when user has 0 spins
  const shouldShowButton = freeSpins === 0;

  // Check affiliate bonus status
  const checkStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCanClaim(false);
        setIsCheckingStatus(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_affiliate_bonus_status');
      
      if (error) {
        console.error('Error checking affiliate status:', error);
        setCanClaim(false);
        setIsCheckingStatus(false);
        return;
      }

      const status = data as unknown as AffiliateStatus;
      
      if (status.error === 'unauthorized' || status.error === 'no_spins_record') {
        setCanClaim(false);
        setIsCheckingStatus(false);
        return;
      }

      setCanClaim(status.can_claim);
      
      if (status.next_claim_at) {
        setNextClaimAt(new Date(status.next_claim_at));
      } else {
        setNextClaimAt(null);
      }
    } catch (err) {
      console.error('Error in checkStatus:', err);
      setCanClaim(false);
    } finally {
      setIsCheckingStatus(false);
    }
  }, []);

  // Claim affiliate bonus
  const claimBonus = useCallback(async (): Promise<ClaimResult> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('claim_affiliate_bonus_spins');
      
      if (error) {
        console.error('Error claiming affiliate bonus:', error);
        return {
          success: false,
          error: 'rpc_error',
          message: 'Erro ao processar requisição'
        };
      }

      const result = data as unknown as ClaimResult;
      
      if (result.success) {
        // Open affiliate link in new tab after successful claim
        window.open(AFFILIATE_LINK, '_blank', 'noopener,noreferrer');
        
        // Update local state
        setCanClaim(false);
        if (result.next_claim_at) {
          setNextClaimAt(new Date(result.next_claim_at));
        }
        
        // Refresh parent data
        onRefresh?.();
      } else if (result.error === 'cooldown_active' && result.next_claim_at) {
        setNextClaimAt(new Date(result.next_claim_at));
        setCanClaim(false);
      }
      
      return result;
    } catch (err) {
      console.error('Error in claimBonus:', err);
      return {
        success: false,
        error: 'unknown',
        message: 'Erro desconhecido'
      };
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh]);

  // Check status when freeSpins changes to 0
  useEffect(() => {
    if (freeSpins === 0) {
      checkStatus();
    }
  }, [freeSpins, checkStatus]);

  // Update time remaining countdown
  useEffect(() => {
    if (!nextClaimAt || canClaim) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = nextClaimAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('');
        setCanClaim(true);
        setNextClaimAt(null);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [nextClaimAt, canClaim]);

  return {
    canClaim,
    nextClaimAt,
    isLoading,
    timeRemaining,
    shouldShowButton,
    isCheckingStatus,
    claimBonus,
    checkStatus
  };
};