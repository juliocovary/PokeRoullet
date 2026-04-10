import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ClanMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  nickname: string;
  avatar: string;
}

export const useClanChat = (clanId: string | undefined) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ClanMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!clanId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_clan_messages', {
        p_clan_id: clanId,
        p_limit: 100
      });

      if (error) throw error;
      setMessages((data as unknown as ClanMessage[]) || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [clanId]);

  // Send message
  const sendMessage = async (message: string): Promise<boolean> => {
    if (!user || !clanId || !message.trim()) return false;

    setSending(true);
    try {
      const { data, error } = await supabase.rpc('send_clan_message', {
        p_user_id: user.id,
        p_message: message.trim()
      });

      if (error) throw error;

      const result = data as { success: boolean; message?: string };
      
      if (result.success) {
        await loadMessages();
        return true;
      } else {
        toast.error(result.message || 'Erro ao enviar mensagem');
        return false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
      return false;
    } finally {
      setSending(false);
    }
  };

  // Initial load and polling
  useEffect(() => {
    if (!clanId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const refreshMessages = async () => {
      if (cancelled || document.hidden) return;
      await loadMessages();
    };

    const startPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      if (document.hidden) return;

      pollingRef.current = setInterval(refreshMessages, 15000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        return;
      }

      void loadMessages();
      startPolling();
    };

    void loadMessages();
    startPolling();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      cancelled = true;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [loadMessages]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    refreshMessages: loadMessages
  };
};
