import { useState, useEffect } from 'react';
import type { LinkedInProfile } from '../types';
import { apiService } from '../services/api';

export const useStoredProfiles = () => {
  const [profiles, setProfiles] = useState<LinkedInProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedProfiles = await apiService.getAllProfiles();
      setProfiles(fetchedProfiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (profile: LinkedInProfile) => {
    try {
      const savedProfile = await apiService.saveProfile(profile);
      setProfiles(prev => {
        const existingIndex = prev.findIndex(p => p.profileUrl === profile.profileUrl);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = savedProfile;
          return updated;
        }
        return [savedProfile, ...prev];
      });
      return savedProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
      throw err;
    }
  };

  const checkIfProfileExists = async (url: string): Promise<LinkedInProfile | null> => {
    try {
      return await apiService.getProfileByUrl(url);
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return {
    profiles,
    loading,
    error,
    fetchProfiles,
    saveProfile,
    checkIfProfileExists,
  };
};
