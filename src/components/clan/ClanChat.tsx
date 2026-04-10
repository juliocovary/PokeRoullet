import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClanChat } from '@/hooks/useClanChat';
import { useProfile } from '@/hooks/useProfile';
import { Send, Loader2, MessageCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ClanChatProps {
  clanId: string;
}

export const ClanChat = ({ clanId }: ClanChatProps) => {
  const { t } = useTranslation(['clan']);
  const { messages, loading, sending, sendMessage } = useClanChat(clanId);
  const { getAvatarSrc } = useProfile();
  
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const success = await sendMessage(input);
    if (success) {
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-[450px] overflow-hidden bg-white border-gray-200 shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-200 shadow-sm">
              <MessageCircle className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 block">{t('chat.title')}</span>
              <span className="text-xs text-gray-500">{messages.length} mensagens</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-200 px-2.5 py-1.5 rounded-lg font-medium shadow-sm">
            <Clock className="w-3 h-3" />
            {t('chat.expires')}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">{t('chat.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3 group">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-300">
                  <img 
                    src={getAvatarSrc(msg.avatar)} 
                    alt={msg.nickname}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm">{msg.nickname}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 break-words bg-gray-100 px-3 py-2 rounded-lg group-hover:bg-gray-200 transition-colors duration-200">
                    {msg.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-white to-gray-50 space-y-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('chat.placeholder')}
          maxLength={500}
          disabled={sending}
          className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-gray-400/20 shadow-sm rounded-lg"
        />
        <div className="flex gap-2">
          <Button 
            onClick={handleSend} 
            disabled={sending || !input.trim()}
            className="bg-gray-900 hover:bg-gray-800 text-white border-0 flex-1 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100 rounded-lg font-medium"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t('chat.send')}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
