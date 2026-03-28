import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function getGuestToken(): string {
  let t = localStorage.getItem('guest_token');
  if (!t) {
    t = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('guest_token', t);
  }
  return t;
}

export interface Reply {
  id: number;
  user_id: number | null;
  user_name: string;
  user_avatar?: string;
  comment: string;
  is_guest: boolean;
  is_owner: boolean;
  is_verified_buyer: boolean;
  likes_count: number;
  dislikes_count: number;
  liked_by_me: boolean;
  disliked_by_me: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  tour_id: number;
  user_id: number | null;
  user_name: string;
  user_avatar?: string;
  guest_name?: string;
  comment: string;
  rating?: number;
  is_verified_buyer: boolean;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
  likes_count: number;
  dislikes_count: number;
  liked_by_me: boolean;
  disliked_by_me: boolean;
  replies: Reply[];
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: { page: number; limit: number; total: number; totalPages: number; };
}

const API = process.env.REACT_APP_API_URL!;

function authHeaders(token?: string | null): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Guest-Token': getGuestToken(),
  };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export const COMMENTS_KEYS = {
  tour: (id: number) => ['comments', 'tour', id] as const,
  tourPage: (id: number, page: number) => ['comments', 'tour', id, page] as const,
};

export const useTourComments = (tourId: number, page = 1, limit = 10) => {
  const token = localStorage.getItem('tour_auth_token');
  return useQuery({
    queryKey: COMMENTS_KEYS.tourPage(tourId, page),
    queryFn: async (): Promise<CommentsResponse> => {
      const res = await fetch(
        `${API}/tour-comments/${tourId}?page=${page}&limit=${limit}`,
        { headers: authHeaders(token) }
      );
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
    enabled: !!tourId,
    staleTime: 30_000,
  });
};

export const useCreateComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      tour_id: number; parent_id?: number;
      comment: string; rating?: number; guest_name?: string;
    }) => {
      const token = localStorage.getItem('tour_auth_token');
      const res = await fetch(`${API}/tour-comments`, {
        method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to create comment'); }
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: COMMENTS_KEYS.tour(vars.tour_id) }),
  });
};

export const useUpdateComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, tourId, data }: { commentId: number; tourId: number; data: { comment: string } }) => {
      const token = localStorage.getItem('tour_auth_token');
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${API}/tour-comments/${commentId}`, {
        method: 'PUT', headers: authHeaders(token), body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to update'); }
    },
    onSuccess: (_, { tourId }) => qc.invalidateQueries({ queryKey: COMMENTS_KEYS.tour(tourId) }),
  });
};

export const useDeleteComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, tourId }: { commentId: number; tourId: number }) => {
      const token = localStorage.getItem('tour_auth_token');
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${API}/tour-comments/${commentId}`, {
        method: 'DELETE', headers: authHeaders(token),
      });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: (_, { tourId }) => qc.invalidateQueries({ queryKey: COMMENTS_KEYS.tour(tourId) }),
  });
};

export const useToggleReaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, tourId, type }: {
      commentId: number; tourId: number; type: 'like' | 'dislike';
    }) => {
      const token = localStorage.getItem('tour_auth_token');
      const res = await fetch(`${API}/tour-comments/${commentId}/like`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error('Failed to react');
      return res.json() as Promise<{ likes_count: number; dislikes_count: number }>;
    },
    onSuccess: (_, { tourId }) => qc.invalidateQueries({ queryKey: COMMENTS_KEYS.tour(tourId) }),
  });
};