import axios from 'axios';

// Empty in development: Vite proxies /api and /uploads to the backend.
// Set VITE_API_ORIGIN (e.g. https://api.example.com) when the API is served from another origin.
const API_ORIGIN: string = import.meta.env.VITE_API_ORIGIN ?? '';

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
});

export const fileUrl = (path: string) => `${API_ORIGIN}${path}`;

export interface ServiceResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T | null;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption: string | null;
  tags: number[];
  createdOn: string;
}

// Mirrors Umniah.Backend.Data.Enums.ImageTags: the array index is the enum value.
export const IMAGE_TAGS = [
  'Christmas',
  'Valentine',
  "Mother's Day",
  'Graduation',
  'General',
  'Wedding',
  'Birth',
  'Men',
] as const;

export const errorMessage = (err: unknown, fallback: string) =>
  axios.isAxiosError<ServiceResponse<unknown>>(err) && err.response?.data?.message
    ? err.response.data.message
    : fallback;

// Mirrors Umniah.Backend.Data.Enums.GalleryTheme: the array index is the enum value.
// tag is the ImageTags value the gallery pre-selects while the theme is active.
export const GALLERY_THEMES = [
  { key: 'default', label: 'Default', tag: null },
  { key: 'christmas', label: 'Christmas', tag: 0 },
  { key: 'valentine', label: 'Valentine', tag: 1 },
  { key: 'graduation', label: 'Graduation', tag: 3 },
  { key: 'wedding', label: 'Wedding', tag: 5 },
] as const;

export interface GalleryThemeSetting {
  theme: number;
}

// Theme plus the custom messages shown alongside the theme's own text. Empty messages are null.
export interface GallerySettings {
  theme: number;
  bannerTextEn: string | null;
  bannerTextAr: string | null;
  bannerExpiresAt: string | null;
  heroTextEn: string | null;
  heroTextAr: string | null;
}

// A theme's hero message for the dashboard: the saved text (null when none) and the default it falls back to.
export interface ThemeHeroText {
  theme: number;
  heroTextEn: string | null;
  heroTextAr: string | null;
  defaultHeroTextEn: string;
  defaultHeroTextAr: string;
}

// The stored news strip message for the dashboard, returned even after it has expired. bannerExpiresAt is UTC ISO.
export interface GalleryText {
  bannerTextEn: string | null;
  bannerTextAr: string | null;
  bannerExpiresAt: string | null;
}
