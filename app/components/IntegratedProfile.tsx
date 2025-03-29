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
    isInitialized
  } = useAuth();
  
  // When wallet is connected/disconnected, update the profile
  useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated && userAddress) {
        console.log('Wallet connected, updating profile with address:', userAddress);
        
        // Update profile with wallet address
        updateProfileField('walletAddress', userAddress);
        updateProfileField('showWalletAddress', true);
        
        // Enable edit mode since wallet is connected
        localStorage.setItem('profile_mode', ProfileMode.Edit);
      } else if (!isAuthenticated) {
        console.log('Wallet disconnected, ensuring profile is in view mode');
        
        // Set view mode when disconnected
        localStorage.setItem('profile_mode', ProfileMode.View);
      }
    }
  }, [isAuthenticated, userAddress, isInitialized, updateProfileField]);

  // Handle wallet connection
  const handleToggleWallet = async () => {
    try {
      setWalletLoading(true);
      setStatusMessage(isAuthenticated ? "Disconnecting wallet..." : "Connecting wallet...");
      
      if (isAuthenticated) {
        // Disconnect through hook
        await disconnectWallet();
        
        // Set view mode as a fallback
        localStorage.setItem('profile_mode', ProfileMode.View);
        
        // Update profile data
        updateProfileField('walletAddress', '');
        updateProfileField('showWalletAddress', false);
        
        setStatusMessage("Wallet disconnected");
      } else {
        // Connect wallet through hook
        await connectWallet();
        
        // Add a fallback in case the app doesn't reload - check localStorage
        const walletAddress = localStorage.getItem('mixmi-wallet-address');
        if (walletAddress) {
          // Update profile data
          updateProfileField('walletAddress', walletAddress);
          updateProfileField('showWalletAddress', true);
          localStorage.setItem('profile_mode', ProfileMode.Edit);
        }
        
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