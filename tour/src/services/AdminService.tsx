const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('tour_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export interface OverviewStats {
  total_cars: number;
  active_cars: number;
  hidden_cars: number;
  total_inquiries: number;
  new_inquiries: number;
  processed_inquiries: number;
}

export interface Status {
  id: number;
  name: string;
}

export interface AdminCar {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  status_id: number;
  status_name: string;
}

// Editable car payload sent to create/update endpoints.
export interface CarInput {
  make: string;
  model: string;
  year: number;
  vin: string;
  price: number;
  mileage: number;
  fuel_type: string;
  engine: string;
  engine_capacity: number | null;
  battery_capacity: number | null;
  transmission: string;
  drive: string;
  body_type: string;
  color: string;
  seats: number;
  description: string;
  status_id: number;
  card_image: string;
  gallery_images: string[];
}

export interface AdminInquiry {
  id: number;
  car_id: number | null;
  car_label: string | null;
  request_type: string;
  contact_method: string;
  phone: string;
  name: string;
  message: string;
  status: string;
  created_at: string;
}

class AdminService {
  async getOverview(): Promise<OverviewStats> {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/overview`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch overview');
    return res.json();
  }

  async getStatuses(): Promise<Status[]> {
    const res = await fetch(`${API_BASE_URL}/admin/statuses`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch statuses');
    return (await res.json()) || [];
  }

  // ---- Cars ----
  async getCars(page = 1, limit = 20): Promise<{ cars: AdminCar[]; total: number; page: number; total_pages: number }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetch(`${API_BASE_URL}/admin/cars?${params}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch cars');
    return res.json();
  }

  async getCarDetail(id: number): Promise<{ car: Record<string, any>; card_image: string; gallery_images: string[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/cars/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch car detail');
    return res.json();
  }

  async createCar(data: CarInput): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/cars`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create car');
  }

  async updateCar(id: number, data: CarInput): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/cars/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update car');
  }

  async setCarStatus(id: number, statusId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/cars/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status_id: statusId }),
    });
    if (!res.ok) throw new Error('Failed to update status');
  }

  async deleteCar(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/cars/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete car');
  }

  // ---- Inquiries ----
  async getInquiries(page = 1, limit = 20, status?: string): Promise<{ inquiries: AdminInquiry[]; total: number; page: number; total_pages: number }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    const res = await fetch(`${API_BASE_URL}/admin/inquiries?${params}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch inquiries');
    return res.json();
  }

  async setInquiryStatus(id: number, status: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/inquiries/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update inquiry');
  }

  // ---- Image upload ----
  async uploadImage(file: File, type: 'card' | 'gallery'): Promise<string> {
    const token = localStorage.getItem('tour_auth_token');
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${API_BASE_URL}/admin/upload?type=${type}`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: form,
    });
    if (!res.ok) throw new Error('Failed to upload image');
    const data = await res.json();
    return data.url as string;
  }
}

export const adminService = new AdminService();
