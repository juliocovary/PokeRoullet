import { supabase } from '@/integrations/supabase/client';

export interface ActiveLaunchEventStatus {
  id: string;
  end_date: string;
  is_active: boolean;
}

const STATUS_TTL_MS = 60 * 1000;

let cachedStatus: ActiveLaunchEventStatus | null = null;
let loadedAt = 0;
let inflight: Promise<ActiveLaunchEventStatus | null> | null = null;

const isFresh = () => Date.now() - loadedAt < STATUS_TTL_MS;

export const fetchActiveLaunchEventStatus = async (force = false): Promise<ActiveLaunchEventStatus | null> => {
  if (!force && cachedStatus && isFresh()) {
    return cachedStatus;
  }

  if (inflight) {
    return inflight;
  }

  inflight = supabase
    .from('launch_event_config')
    .select('id, end_date, is_active')
    .eq('is_active', true)
    .single()
    .then(({ data, error }) => {
      if (error || !data || !data.is_active) {
        cachedStatus = null;
        loadedAt = Date.now();
        return null;
      }

      cachedStatus = {
        id: data.id,
        end_date: data.end_date,
        is_active: data.is_active,
      };
      loadedAt = Date.now();
      return cachedStatus;
    }) as Promise<ActiveLaunchEventStatus | null>;

  inflight = inflight.then(
    (result) => {
      inflight = null;
      return result;
    },
    (error) => {
      inflight = null;
      throw error;
    }
  );

  return inflight;
};
