'use client';

import React, { useEffect } from 'react';
import { UserProfileContainer } from './profile/UserProfileContainer';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuth } from '@/lib/auth';
import { NavbarContainer } from './NavbarContainer';

export function UserProfile() {
  const { isAuthenticated, isTransitioning } = useAuthState();
  const { refreshAuthState } = useAuth();
  
  // Enhanced authentication state logging
  useEffect(() => {
    console.log('🔐 UserProfile Auth changed:', { 
      isAuthenticated,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated]);
  
  // Periodically refresh auth state
  useEffect(() => {
    // Only poll occasionally to avoid excessive updates
    const intervalId = setInterval(() => {
      console.log('UserProfile: Occasional auth refresh');
      refreshAuthState();
    }, 30000); // Reduced from 5000ms to 30000ms (30 seconds)
    
    return () => clearInterval(intervalId);
  }, [refreshAuthState]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <NavbarContainer isAuthenticated={isAuthenticated} />
      
      <main className="flex-grow">
        <UserProfileContainer 
          disableAuth={false}
        />
      </main>
    </div>
  );
}

export default UserProfile;