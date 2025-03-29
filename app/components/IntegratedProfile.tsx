'use client';

import React, { useState, useEffect } from 'react';
import { ProfileProvider } from '../context/ProfileContext';
import { useProfileContext } from '../context/ProfileContext';
import ProfileView from './profile/ProfileView';
import { ProfileMode } from '@/types/ProfileMode';
import { SpotlightItem, ShopItem, MediaItem } from '@/types';
import { Navbar } from './Navbar';
import { useAuth } from '@/lib/auth';

// The IntegratedProfile component should be wrapped with the provider
export function IntegratedProfile() {
  return (
    <ProfileProvider>
      <IntegratedProfileContent />
    </ProfileProvider>
  );
}

// Inner component that uses the context values
function IntegratedProfileContent() {
  // Get all state and methods from the context
  const {
    // Profile
    profile,
    updateProfileField,
    updateSectionVisibility,
    updateStickerData,
    
    // Media
    mediaItems,
    addMediaItem,
    updateMediaItem,
    removeMediaItem,
    
    // Spotlight
    spotlightItems,
    addSpotlightItem,
    updateSpotlightItem,
    removeSpotlightItem,
    
    // Shop
    shopItems,
    addShopItem,
    updateShopItem,
    removeShopItem,
    
    // Global
    isLoading
  } = useProfileContext();

  // Component's local state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);

  // Use the auth hook for Stacks wallet integration
  const { 
    isAuthenticated, 
    userAddress, 
    connectWallet, 
    disconnectWallet,
    isInitialized,
    refreshAuthState
  } = useAuth();

  // Check for wallet connection on initial render
  useEffect(() => {
    // Force an auth state refresh on component mount
    refreshAuthState();
    
    // Also check localStorage directly in case the auth hook hasn't initialized yet
    const walletConnected = localStorage.getItem('mixmi-wallet-connected') === 'true';
    const walletAddress = localStorage.getItem('mixmi-wallet-address');
    
    console.log('Initial wallet check from localStorage:', { walletConnected, walletAddress });
    
    // If wallet is connected in localStorage but not yet in auth state, update the profile directly
    if (walletConnected && walletAddress && !isAuthenticated) {
      console.log('Found wallet in localStorage but not in auth state, updating profile');
      updateProfileField('walletAddress', walletAddress);
      updateProfileField('showWalletAddress', true);
      localStorage.setItem('profile_mode', ProfileMode.Edit);
    }
    
    // Expose a debugging utility for the browser console
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).checkProfileState = () => {
        console.group('🔍 Profile State Debug');
        console.log('Auth State:', { isAuthenticated, userAddress, isInitialized });
        console.log('Profile Data:', profile);
        console.log('Profile Mode:', localStorage.getItem('profile_mode'));
        console.log('Wallet Connected (localStorage):', localStorage.getItem('mixmi-wallet-connected'));
        console.log('Wallet Address (localStorage):', localStorage.getItem('mixmi-wallet-address'));
        console.groupEnd();
        return 'Profile state logged to console';
      };
      
      // Expose a function to manually set auth state for testing
      (window as any).setAuth = (state: boolean, address?: string) => {
        const testAddress = address || 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';
        console.log(`🔧 Setting auth state to ${state} with address ${testAddress}`);
        
        if (state) {
          // Set auth data in localStorage
          localStorage.setItem('mixmi-wallet-connected', 'true');
          localStorage.setItem('mixmi-wallet-address', testAddress);
          localStorage.setItem('profile_mode', ProfileMode.Edit);
          
          // Update profile
          updateProfileField('walletAddress', testAddress);
          updateProfileField('showWalletAddress', true);
          
          console.log('Auth state set to authenticated, reload page to see changes');
        } else {
          // Clear auth data
          localStorage.removeItem('mixmi-wallet-connected');
          localStorage.removeItem('mixmi-wallet-address');
          localStorage.setItem('profile_mode', ProfileMode.View);
          
          console.log('Auth state set to unauthenticated, reload page to see changes');
        }
        
        // Manually reload the page to ensure state is consistent
        return 'Auth state changed. Reload page to see changes.';
      };
    }
  // Remove profile from dependencies to avoid infinite loops
  // Only run this effect once on mount and when auth state changes
  }, [isAuthenticated, refreshAuthState, updateProfileField]);

  // Log authentication state changes to help with debugging
  useEffect(() => {
    // Only log changes that specifically involve authentication state
    console.log("IntegratedProfile auth state changed:", {
      isAuthenticated,
      userAddress,
      isInitialized
    });
    // Don't include profile.walletAddress in dependencies to avoid cycles
  }, [isAuthenticated, userAddress, isInitialized]);
  
  // When wallet is connected/disconnected, update the profile mode
  useEffect(() => {
    if (isInitialized) {
      // Get current profile mode from localStorage
      const currentMode = localStorage.getItem('profile_mode');
      
      if (isAuthenticated && userAddress) {
        console.log('Wallet connected, setting edit mode and updating profile');
        
        // Only update wallet address if it's changed or not set
        if (profile.walletAddress !== userAddress) {
          updateProfileField('walletAddress', userAddress);
          updateProfileField('showWalletAddress', true);
        }
        
        // Always ensure edit mode when authenticated
        if (currentMode !== ProfileMode.Edit) {
          console.log('Setting profile mode to edit');
          localStorage.setItem('profile_mode', ProfileMode.Edit);
        }
      } else if (!isAuthenticated) {
        console.log('Wallet disconnected, ensuring profile is in view mode');
        
        // Always ensure view mode when not authenticated
        if (currentMode !== ProfileMode.View) {
          console.log('Setting profile mode to view');
          localStorage.setItem('profile_mode', ProfileMode.View);
        }
      }
    }
  // Remove profile.walletAddress from dependencies and only depend on userAddress
  }, [isAuthenticated, userAddress, isInitialized, updateProfileField]);

  // Handle wallet connection
  const handleToggleWallet = async () => {
    try {
      setWalletLoading(true);
      setStatusMessage(isAuthenticated ? "Disconnecting wallet..." : "Connecting wallet...");
      
      if (isAuthenticated) {
        // Disconnect wallet
        await disconnectWallet();
        setStatusMessage("Wallet disconnected");
      } else {
        // Connect wallet
        await connectWallet();
        setStatusMessage("Wallet connected successfully!");
      }
      
      // Clear status message after a delay
      setTimeout(() => {
        setStatusMessage(undefined);
        setWalletLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error with wallet connection:', error);
      setStatusMessage("Error with wallet operation");
      setWalletLoading(false);
      
      // Clear error message after delay
      setTimeout(() => {
        setStatusMessage(undefined);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        isAuthenticated={isAuthenticated}
        isLoading={walletLoading}
        onLoginToggle={handleToggleWallet}
        statusMessage={statusMessage || (isLoading ? "Loading profile..." : undefined)}
        walletAddress={userAddress || profile.walletAddress}
      />
      
      <main className="flex-grow">
        {isLoading ? (
          // Loading state
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          // Main profile view
          <ProfileView
            profile={profile}
            mediaItems={mediaItems}
            spotlightItems={spotlightItems}
            shopItems={shopItems}
            isAuthenticated={isAuthenticated}
            onConfigClick={() => setIsConfigOpen(true)}
            onWalletClick={() => setIsWalletOpen(true)}
            onUpdateSectionVisibility={updateSectionVisibility}
            onUpdateStickerData={updateStickerData}
            onEditProfile={() => {
              localStorage.setItem('profile_mode', ProfileMode.Edit);
              updateProfileField('hasEditedProfile', true);
            }}
            onUpdateProfile={updateProfileField}
            onUpdateSpotlightItems={(items) => {
              items.forEach(item => {
                if (item.id) {
                  updateSpotlightItem(item.id, item);
                } else {
                  addSpotlightItem(item as SpotlightItem);
                }
              });
            }}
            onUpdateMediaItems={(items) => {
              items.forEach(item => {
                if (item.id) {
                  updateMediaItem(item.id, item);
                } else {
                  addMediaItem(item as MediaItem);
                }
              });
            }}
            onUpdateShopItems={(items) => {
              items.forEach(item => {
                if (item.id) {
                  updateShopItem(item.id, item);
                } else {
                  addShopItem(item as ShopItem);
                }
              });
            }}
          />
        )}
      </main>
    </div>
  );
} 