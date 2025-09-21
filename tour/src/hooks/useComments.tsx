import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

interface Comment {
  id: number;
  tour_id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  comment: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
}

interface CommentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CommentsResponse {
  comments: Comment[];
  pagination: CommentsPagination;
}

interface CreateCommentRequest {
  tour_id: number;
  comment: string;
  rating?: number;
}

interface UpdateCommentRequest {
  comment: string;
  rating?: number;
}

const API_BASE_URL = 'http://127.0.0.1:1323';

export const COMMENTS_KEYS = {
  all: ['comments'] as const,
  tour: (tourId: number) => [...COMMENTS_KEYS.all, 'tour', tourId] as const,
  tourPage: (tourId: number, page: number) => [...COMMENTS_KEYS.tour(tourId), 'page', page] as const,
};

const commentsService = {
  getTourComments: async (tourId: number, page: number = 1, limit: number = 10, token?: string): Promise<CommentsResponse> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/tour-comments/${tourId}?page=${page}&limit=${limit}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }

    return response.json();
  },

  createComment: async (data: CreateCommentRequest, token: string): Promise<{ comment: Comment }> => {
    const response = await fetch(`${API_BASE_URL}/tour-comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create comment');
    }

    return response.json();
  },

  updateComment: async (commentId: number, data: UpdateCommentRequest, token: string): Promise<{ comment: Comment }> => {
    const response = await fetch(`${API_BASE_URL}/tour-comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update comment');
    }

    return response.json();
  },

  deleteComment: async (commentId: number, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tour-comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete comment');
    }
  },
};

export const useTourComments = (tourId: number, page: number = 1, limit: number = 10) => {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('tour_auth_token');

  return useQuery({
    queryKey: COMMENTS_KEYS.tourPage(tourId, page),
    queryFn: () => commentsService.getTourComments(tourId, page, limit, token || undefined),
    enabled: !!tourId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
      const token = localStorage.getItem('tour_auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      return commentsService.createComment(data, token);
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch comments for this tour
      queryClient.invalidateQueries({ 
        queryKey: COMMENTS_KEYS.tour(variables.tour_id) 
      });
    },
    onError: (error) => {
      console.error('Failed to create comment:', error);
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: ({ commentId, tourId, data }: { commentId: number; tourId: number; data: UpdateCommentRequest }) => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
      const token = localStorage.getItem('tour_auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      return commentsService.updateComment(commentId, data, token);
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch comments for this tour
      queryClient.invalidateQueries({ 
        queryKey: COMMENTS_KEYS.tour(variables.tourId) 
      });
    },
    onError: (error) => {
      console.error('Failed to update comment:', error);
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: ({ commentId, tourId }: { commentId: number; tourId: number }) => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
      const token = localStorage.getItem('tour_auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      return commentsService.deleteComment(commentId, token);
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch comments for this tour
      queryClient.invalidateQueries({ 
        queryKey: COMMENTS_KEYS.tour(variables.tourId) 
      });
    },
    onError: (error) => {
      console.error('Failed to delete comment:', error);
    },
  });
};

export type { Comment, CommentsPagination, CommentsResponse, CreateCommentRequest, UpdateCommentRequest };