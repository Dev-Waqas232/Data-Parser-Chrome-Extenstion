export interface LinkedInProfile {
  id?: number;
  name: string | null;
  headline: string | null;
  location: string | null;
  about: string | null;
  profileUrl: string;
  scrapedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}
