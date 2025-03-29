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
  
  // Add local override for auth state if needed
  const [localAuthState, setLocalAuthState] = useState<boolean | null>(null);
  const [localWalletAddress, setLocalWalletAddress] = useState<string | null>(null);

  // Use the auth hook for Stacks wallet integration
  const { 
    isAuthenticated, 
    userAddress, 
    connectWallet, 
    disconnectWallet,
    isInitialized
  } = useAuth();
  
  // Check localStorage on mount for wallet connection
  useEffect(() => {
    // Direct check for wallet connection in localStorage
    if (typeof window !== 'undefined') {
      const connected = localStorage.getItem('mixmi-wallet-connected') === 'true';
      const address = localStorage.getItem('mixmi-wallet-address');
      
      console.log('Initial wallet check from localStorage:', { connected, address });
      
      if (connected && address) {
        setLocalAuthState(true);
        setLocalWalletAddress(address);
        
        // Update profile directly
        updateProfileField('walletAddress', address);
        updateProfileField('showWalletAddress', true);
        updateProfileField('hasEditedProfile', true);
        
        // Set profile mode
        localStorage.setItem('profile_mode', ProfileMode.Edit);
      }
    }
  }, [updateProfileField]);

  // When wallet is connected/disconnected, update the profile
  useEffect(() => {
    // Use local auth state override if available
    const effectiveIsAuthenticated = localAuthState !== null ? localAuthState : isAuthenticated;
    const effectiveUserAddress = localWalletAddress || userAddress;
    
    if (isInitialized) {
      if (effectiveIsAuthenticated && effectiveUserAddress) {
        console.log('Wallet connected, updating profile with address:', effectiveUserAddress);
        
        // Update profile with wallet address from Stacks
        updateProfileField('walletAddress', effectiveUserAddress);
        updateProfileField('showWalletAddress', true);
        
        // Enable edit mode since wallet is connected
        localStorage.setItem('profile_mode', ProfileMode.Edit);
        updateProfileField('hasEditedProfile', true);
        
        // Force localStorage update to ensure persistence
        try {
          const profileData = {
            ...profile,
            walletAddress: effectiveUserAddress,
            showWalletAddress: true,
            hasEditedProfile: true
          };
          localStorage.setItem('mixmi_profile_data', JSON.stringify(profileData));
        } catch (e) {
          console.error('Error updating profile in localStorage:', e);
        }
      } else if (!effectiveIsAuthenticated && profile.walletAddress) {
        console.log('Wallet disconnected, clearing wallet address from profile');
        
        // Clear wallet address when disconnected
        updateProfileField('walletAddress', '');
        updateProfileField('showWalletAddress', false);
        
        // Update localStorage
        try {
          const profileData = {
            ...profile,
            walletAddress: '',
            showWalletAddress: false
          };
          localStorage.setItem('mixmi_profile_data', JSON.stringify(profileData));
        } catch (e) {
          console.error('Error updating profile in localStorage:', e);
        }
      }
    }
  }, [isAuthenticated, userAddress, isInitialized, updateProfileField, profile, localAuthState, localWalletAddress]);

  // Handle wallet connection
  const handleToggleWallet = async () => {
    // Use effective authentication state (local override or from hook)
    const effectiveIsAuthenticated = localAuthState !== null ? localAuthState : isAuthenticated;
    
    try {
      setWalletLoading(true);
      setStatusMessage(effectiveIsAuthenticated ? "Disconnecting wallet..." : "Connecting wallet...");
      
      if (effectiveIsAuthenticated) {
        // Clear local override
        setLocalAuthState(null);
        setLocalWalletAddress(null);
        
        // Disconnect through hook
        await disconnectWallet();
        
        // Ensure UI updates by manually clearing localStorage values
        localStorage.removeItem('mixmi-wallet-connected');
        localStorage.removeItem('mixmi-wallet-address');
        localStorage.removeItem('mixmi-wallet-accounts');
        localStorage.setItem('profile_mode', ProfileMode.View);
        
        setStatusMessage("Wallet disconnected");
        
        // Force a page reload to ensure clean state
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // Connect wallet through hook
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

  // For UI purposes, use effective authentication state
  const effectiveIsAuthenticated = localAuthState !== null ? localAuthState : isAuthenticated;
  const effectiveUserAddress = localWalletAddress || userAddress || profile.walletAddress;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        isAuthenticated={effectiveIsAuthenticated}
        isLoading={walletLoading}
        onLoginToggle={handleToggleWallet}
        statusMessage={statusMessage || (isLoading ? "Loading profile..." : undefined)}
        walletAddress={effectiveUserAddress}
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
            isAuthenticated={effectiveIsAuthenticated}
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