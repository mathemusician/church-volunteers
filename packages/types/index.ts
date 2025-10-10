// Shared TypeScript types for the Church Volunteers application

export interface User {
  id: string;
  email: string;
  name: string | null;
  keycloak_id: string | null;
  role: 'admin' | 'coordinator' | 'volunteer';
  created_at: Date;
  updated_at: Date;
}

export interface Volunteer {
  id: string;
  user_id: string;
  phone: string;
  availability: Record<string, unknown>;
  skills: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: Date;
  end_time: Date;
  location: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface VolunteerAssignment {
  id: string;
  event_id: string;
  volunteer_id: string;
  status: 'pending' | 'confirmed' | 'declined' | 'completed';
  created_at: Date;
  updated_at: Date;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
