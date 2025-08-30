import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesService, FavoriteItem, TourCard } from '../services/FavoritesService';
import { useAuth } from '../context/AuthContext';

export interface FavoriteWithDetails extends FavoriteItem {
  tour?: TourCard;
}

export const FAVORITES_KEYS = {
  all: ['favorites'] as const,
  user: ['favorites', 'user'] as const,
  details: ['favorites', 'details'] as const,
};

export const useUserFavorites = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: FAVORITES_KEYS.user,
    queryFn: favoritesService.getUserFavorites,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('Authentication required')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useFavoritesWithDetails = () => {
  const { data: favorites, isLoading: favoritesLoading, error: favoritesError } = useUserFavorites();

  const favoriteTourIds = favorites?.map(fav => fav.tour_id) || [];

  const {
    data: tourDetails,
    isLoading: detailsLoading,
    error: detailsError
  } = useQuery({
    queryKey: [...FAVORITES_KEYS.details, favoriteTourIds],
    queryFn: () => favoritesService.getFavoriteToursDetails(favoriteTourIds),
    enabled: !!favorites && favorites.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const favoritesWithDetails: FavoriteWithDetails[] = favorites?.map(favorite => ({
    ...favorite,
    tour: tourDetails?.find(tour => tour.id === favorite.tour_id)
  })) || [];

  return {
    data: favoritesWithDetails,
    isLoading: favoritesLoading || detailsLoading,
    error: favoritesError || detailsError,
    isEmpty: favoritesWithDetails.length === 0,
    favoriteIds: favoriteTourIds,
  };
};

export const useAddToFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tourId: number) => favoritesService.addToFavorites(tourId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_KEYS.user });
      queryClient.invalidateQueries({ queryKey: FAVORITES_KEYS.details });
    },
    onError: (error) => {
      console.error('Failed to add to favorites:', error);
    },
  });
};

export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tourId: number) => favoritesService.removeFromFavorites(tourId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_KEYS.user });
      queryClient.invalidateQueries({ queryKey: FAVORITES_KEYS.details });
    },
    onError: (error) => {
      console.error('Failed to remove from favorites:', error);
    },
  });
};

export const useIsFavorite = (tourId: number) => {
  const { favoriteIds } = useFavoritesWithDetails();
  return favoriteIds.includes(tourId);
};

export const useToggleFavorite = () => {
  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();
  const { favoriteIds } = useFavoritesWithDetails();

  const toggleFavorite = (tourId: number) => {
    const isFavorite = favoriteIds.includes(tourId);
    
    if (isFavorite) {
      removeFromFavorites.mutate(tourId);
    } else {
      addToFavorites.mutate(tourId);
    }
  };

  return {
    toggleFavorite,
    isLoading: addToFavorites.isPending || removeFromFavorites.isPending,
    error: addToFavorites.error || removeFromFavorites.error,
  };
};