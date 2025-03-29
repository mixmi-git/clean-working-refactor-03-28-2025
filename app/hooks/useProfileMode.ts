import { useState, useEffect } from 'react';
import { ProfileMode } from '@/types/ProfileMode';

/**
 * A hook to manage the profile mode (edit/view) based on authentication state
 * This provides a simpler interface for components to check if they should be in edit mode
 */
export function useProfileMode(isAuthenticated: boolean) {
  const [profileMode, setProfileMode] = useState<ProfileMode>(ProfileMode.View);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Update profile mode based on authentication state
  useEffect(() => {
    const updateMode = () => {
      try {
        // If authenticated, always set edit mode
        if (isAuthenticated) {
          console.log('Setting profile mode to Edit due to authentication');
          localStorage.setItem('profile_mode', ProfileMode.Edit);
          setProfileMode(ProfileMode.Edit);
          setIsEditMode(true);
          return;
        }
        
        // Otherwise, check localStorage for saved mode
        const savedMode = localStorage.getItem('profile_mode') as ProfileMode || ProfileMode.View;
        
        // If not authenticated, force view mode
        if (!isAuthenticated && savedMode === ProfileMode.Edit) {
          console.log('Forcing profile mode to View due to no authentication');
          localStorage.setItem('profile_mode', ProfileMode.View);
          setProfileMode(ProfileMode.View);
          setIsEditMode(false);
          return;
        }
        
        // Otherwise use the saved mode
        setProfileMode(savedMode);
        setIsEditMode(savedMode === ProfileMode.Edit);
      } catch (error) {
        console.error('Error updating profile mode:', error);
        setProfileMode(ProfileMode.View);
        setIsEditMode(false);
      }
    };
    
    updateMode();
    
    // Add listener for storage changes (in case mode is changed elsewhere)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'profile_mode') {
        updateMode();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);
  
  // Function to explicitly set mode
  const setMode = (mode: ProfileMode) => {
    // If setting to edit mode but not authenticated, don't allow it
    if (mode === ProfileMode.Edit && !isAuthenticated) {
      console.warn('Cannot set edit mode when not authenticated');
      return false;
    }
    
    // Otherwise update mode
    localStorage.setItem('profile_mode', mode);
    setProfileMode(mode);
    setIsEditMode(mode === ProfileMode.Edit);
    return true;
  };
  
  return {
    profileMode,
    isEditMode,
    setMode
  };
} 