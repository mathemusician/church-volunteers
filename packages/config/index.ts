// Shared configuration for the Church Volunteers application

export const APP_CONFIG = {
  name: 'Volunteers',
  description: 'A modern volunteer management system',
  version: '1.0.0',
} as const;

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
} as const;

export const AUTH_CONFIG = {
  sessionMaxAge: 30 * 24 * 60 * 60, // 30 days
  sessionUpdateAge: 24 * 60 * 60, // 24 hours
} as const;

export const PAGINATION_CONFIG = {
  defaultLimit: 10,
  maxLimit: 100,
} as const;

export const VOLUNTEER_SKILLS = [
  'Teaching',
  'Music',
  'Technical',
  'Administration',
  'Hospitality',
  'Youth Ministry',
  'Children Ministry',
  'Prayer',
  'Counseling',
  'Event Planning',
] as const;

export const VOLUNTEER_ROLES = ['admin', 'coordinator', 'volunteer'] as const;

export const EVENT_STATUS = ['pending', 'confirmed', 'declined', 'completed'] as const;
