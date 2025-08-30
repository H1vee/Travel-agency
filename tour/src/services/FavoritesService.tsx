export interface FavoriteItem {
  tour_id: number;
  title: string;
}

export interface TourCard {
  id: number;
  title: string;
  price: number;
  imageSrc?: string;
}

export interface AddFavoriteRequest {
  tour_id: number;
}

class FavoritesService {
  private baseURL = 'http://127.0.0.1:1323';

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('tour_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getUserFavorites(): Promise<FavoriteItem[]> {
    try {
      const response = await fetch(`${this.baseURL}/user-favorites`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch favorites');
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch favorites error:', error);
      throw error;
    }
  }

  async getFavoriteToursDetails(favoriteIds: number[]): Promise<TourCard[]> {
    if (favoriteIds.length === 0) return [];

    try {
      const idsParam = favoriteIds.join(',');
      const response = await fetch(`${this.baseURL}/tours-search-by-ids?ids=${idsParam}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tour details');
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch tour details error:', error);
      throw error;
    }
  }

  async addToFavorites(tourId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/user-favorites`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ tour_id: tourId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to favorites');
      }
    } catch (error) {
      console.error('Add to favorites error:', error);
      throw error;
    }
  }

  async removeFromFavorites(tourId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/user-favorites/${tourId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove from favorites');
      }
    } catch (error) {
      console.error('Remove from favorites error:', error);
      throw error;
    }
  }
}

export const favoritesService = new FavoritesService();