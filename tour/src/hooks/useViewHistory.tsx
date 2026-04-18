import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL!;

export interface ViewedTour {
  tour_id: number;
  title: string;
  price: number;
  rating: number;
  image_src: string;
  viewed_at: string;
  view_count: number;
}

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('tour_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const VIEW_HISTORY_KEYS = {
  recent: ['tour-views', 'recent'] as const,
};

/** Fetch recently viewed tours */
export const useRecentViews = (limit = 10) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...VIEW_HISTORY_KEYS.recent, limit],
    queryFn: async (): Promise<ViewedTour[]> => {
      const res = await fetch(`${API}/tour-views?limit=${limit}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch view history');
      return res.json();
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });
};

/** Record a tour view (call when user opens tour details page) */
export const useRecordView = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tourId: number) => {
      const res = await fetch(`${API}/tour-views/${tourId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to record view');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VIEW_HISTORY_KEYS.recent });
    },
  });
};

/** Clear all view history */
export const useClearViewHistory = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/tour-views`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to clear history');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VIEW_HISTORY_KEYS.recent });
    },
  });
};

/** Remove a single tour from view history */
export const useRemoveFromHistory = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tourId: number) => {
      const res = await fetch(`${API}/tour-views/${tourId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to remove from history');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VIEW_HISTORY_KEYS.recent });
    },
  });
};
