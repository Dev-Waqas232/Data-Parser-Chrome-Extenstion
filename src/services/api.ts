import type { LinkedInProfile, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export const apiService = {
  async saveProfile(profile: Omit<LinkedInProfile, 'id' | 'scrapedAt' | 'createdAt' | 'updatedAt'>): Promise<LinkedInProfile> {
    const response = await fetch(`${API_BASE_URL}/linkedin-profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      throw new Error(`Failed to save profile: ${response.statusText}`);
    }

    const result: ApiResponse<LinkedInProfile> = await response.json();
    return result.data;
  },

  async getAllProfiles(): Promise<LinkedInProfile[]> {
    const response = await fetch(`${API_BASE_URL}/linkedin-profiles`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch profiles: ${response.statusText}`);
    }

    const result: ApiResponse<LinkedInProfile[]> = await response.json();
    return result.data;
  },

  async getProfileByUrl(url: string): Promise<LinkedInProfile | null> {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(`${API_BASE_URL}/linkedin-profiles/${encodedUrl}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }

    const result: ApiResponse<LinkedInProfile> = await response.json();
    return result.data;
  }
};
