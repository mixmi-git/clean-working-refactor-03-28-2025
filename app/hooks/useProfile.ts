/**
 * Custom hook for profile data management
 * 
 * This hook provides a clean interface for managing profile data with:
 * - Local state management
 * - Persistence to localStorage
 * - Type safety
 * 
 * This initial implementation is intentionally minimal to reduce risk.
 */
import { useState, useEffect, useCallback } from 'react';
import { ProfileData } from '@/types';
import { useStorage, STORAGE_KEYS } from './useStorage';

// Default profile for development and testing
export const DEFAULT_PROFILE: ProfileData = {
  id: 'default',
  name: 'Add Your Name',
  title: 'Add Your Title',
  bio: 'Tell us about yourself...',
  image: '/images/placeholder-profile.jpg',
  socialLinks: [],
  sectionVisibility: {
    spotlight: true,
    media: true,
    shop: true,
    sticker: true
  },
  sticker: {
    visible: true,
    image: '/images/stickers/daisy-blue.png'
  },
  walletAddress: '',
  showWalletAddress: true,
  hasEditedProfile: false
};

export function useProfile() {
  // Use storage hook for persistence
  const { getFromStorage, saveToStorage } = useStorage();
  
  // Profile state
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted state on initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Load profile from storage on mount
  useEffect(() => {
    if (!isMounted) return;
    
    try {
      // Load saved profile if it exists
      const savedProfile = getFromStorage<ProfileData | null>(STORAGE_KEYS.PROFILE, null);
      
      if (savedProfile) {
        // Ensure sticker is always visible for consistency
        if (savedProfile.sticker) {
          savedProfile.sticker.visible = true;
        }
        
        setProfile(savedProfile);
        console.log('📦 Loaded profile from localStorage');
      } else {
        // Use default profile if none exists
        setProfile(DEFAULT_PROFILE);
      }
    } catch (error) {
      console.error('Error loading profile from localStorage:', error);
      // Fall back to default profile
      setProfile(DEFAULT_PROFILE);
    }
    
    // Mark loading as complete
    setIsLoading(false);
  }, [isMounted, getFromStorage]);
  
  /**
   * Update profile data and persist to storage
   */
  const updateProfile = useCallback((updatedProfile: ProfileData) => {
    saveToStorage(STORAGE_KEYS.PROFILE, updatedProfile);
    setProfile(updatedProfile);
  }, [saveToStorage]);
  
  /**
   * Update a specific field of the profile
   */
  const updateProfileField = useCallback((field: keyof ProfileData | 'profileInfo', value: any) => {
    const updatedProfile = {
      ...profile,
      ...(field === 'profileInfo' ? value : { [field]: value }),
      hasEditedProfile: true
    };
    
    updateProfile(updatedProfile);
  }, [profile, updateProfile]);
  
  /**
   * Update section visibility
   */
  const updateSectionVisibility = useCallback((field: keyof ProfileData['sectionVisibility'], value: boolean) => {
    const updatedProfile = {
      ...profile,
      sectionVisibility: {
        ...profile.sectionVisibility,
        [field]: value
      }
    };
    
    updateProfile(updatedProfile);
  }, [profile, updateProfile]);
  
  /**
   * Update sticker data
   */
  const updateStickerData = useCallback((stickerData: { visible: boolean; image: string }) => {
    const updatedProfile = {
      ...profile,
      sticker: stickerData
    };
    
    updateProfile(updatedProfile);
  }, [profile, updateProfile]);
  
  return {
    profile,
    isLoading,
    updateProfile,
    updateProfileField,
    updateSectionVisibility,
    updateStickerData
  };
} 