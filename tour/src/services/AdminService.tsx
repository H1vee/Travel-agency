const API_BASE_URL = 'http://127.0.0.1:1323';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('tour_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export interface OverviewStats {
  total_tours: number;
  total_bookings: number;
  total_users: number;
  total_revenue: number;
  pending_count: number;
  confirmed_count: number;
  cancelled_count: number;
}

export interface MonthlyBookings {
  month: string;
  confirmed: number;
  pending: number;
  cancelled: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface PopularTour {
  id: number;
  title: string;
  bookings_count: number;
  revenue: number;
}

export interface AdminBooking {
  id: number;
  tour_title: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  seats: number;
  total_price: number;
  status: string;
  booked_at: string;
  user_id: number | null;
  is_guest_booking: boolean;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  last_login: string;
}

export interface AdminTour {
  id: number;
  title: string;
  price: number;
  rating: number;
  status_id: number;
  status_name: string;
  total_seats: number;
  description: string;
}

export interface AdminTourDetail {
  id: number;
  title: string;
  description: string;
  call_to_action: string;
  price: number;
  rating: number;
  status_id: number;
  status_name: string;
  detailed_description: string;
  total_seats: number;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  [key: string]: T[] | number;
}

class AdminService {
  // Analytics
  async getOverview(): Promise<OverviewStats> {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/overview`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch overview');
    return res.json();
  }

  async getBookingsByMonth(): Promise<MonthlyBookings[]> {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/bookings-by-month`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch bookings by month');
    return (await res.json()) || [];
  }

  async getRevenueByMonth(): Promise<MonthlyRevenue[]> {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/revenue-by-month`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch revenue by month');
    return (await res.json()) || [];
  }

  async getPopularTours(): Promise<PopularTour[]> {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/popular-tours`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch popular tours');
    return (await res.json()) || [];
  }

  // Bookings
  async getBookings(page = 1, limit = 20, status?: string): Promise<{ bookings: AdminBooking[]; total: number; page: number; total_pages: number }> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    const res = await fetch(`${API_BASE_URL}/admin/bookings?${params}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
  }

  async updateBookingStatus(id: number, status: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update booking status');
  }

  async exportBookingsCSV(status?: string): Promise<void> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const token = localStorage.getItem('tour_auth_token');
    const res = await fetch(`${API_BASE_URL}/admin/bookings/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to export bookings');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Users
  async getUsers(page = 1, limit = 20): Promise<{ users: AdminUser[]; total: number; page: number; total_pages: number }> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    const res = await fetch(`${API_BASE_URL}/admin/users?${params}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  }

  async getUserDetail(id: number): Promise<{ user: AdminUser & { bookings_count: number; total_spent: number }; bookings: AdminBooking[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user detail');
    return res.json();
  }

  // Tours
  async getTours(page = 1, limit = 20): Promise<{ tours: AdminTour[]; total: number; page: number; total_pages: number }> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    const res = await fetch(`${API_BASE_URL}/admin/tours?${params}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch tours');
    return res.json();
  }

  async getTourDetail(id: number): Promise<{ tour: AdminTourDetail; bookings_count: number }> {
    const res = await fetch(`${API_BASE_URL}/admin/tours/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch tour detail');
    return res.json();
  }

async createTour(data: Record<string, any>): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/tours`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create tour');
  }

  async updateTour(id: number, data: Record<string, any>): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/tours/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update tour');
  }

  async deleteTour(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/tours/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete tour');
  }
}

export const adminService = new AdminService();