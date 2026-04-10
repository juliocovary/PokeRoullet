import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import TrainerHeader from '@/components/trainer/TrainerHeader';
import TrainerModeLayout from '@/components/trainer/TrainerModeLayout';
import { TrainerModeProvider } from '@/contexts/TrainerModeContext';

const TrainerMode = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <TrainerModeProvider>
      <div className="relative min-h-screen">
        <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 -z-10" />
        <TrainerHeader />
        <TrainerModeLayout />
      </div>
    </TrainerModeProvider>
  );
};

export default TrainerMode;
