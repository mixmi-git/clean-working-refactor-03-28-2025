'use client';

import React, { useState } from 'react';
import { ProfileProvider } from '../context/ProfileContext';
import { useProfileContext } from '../context/ProfileContext';
import ProfileView from './profile/ProfileView';
import { ProfileMode } from '@/types/ProfileMode';
import { SpotlightItem, ShopItem, MediaItem } from '@/types';
import { Navbar } from './Navbar';

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

  // Connect wallet function (simplified for now)
  const connectWallet = async () => {
    try {
      setWalletLoading(true);
      // Simplified wallet connection logic
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 14);
      updateProfileField('walletAddress', mockAddress);
      updateProfileField('showWalletAddress', true);
      setTimeout(() => setWalletLoading(false), 500); // Simulate loading
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWalletLoading(false);
    }
  };

  // Handle edit profile
  const handleEditProfile = () => {
    localStorage.setItem('profile_mode', ProfileMode.Edit);
    updateProfileField('hasEditedProfile', true);
  };

  // Determine if wallet is connected
  const isAuthenticated = !!profile.walletAddress;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        isAuthenticated={isAuthenticated}
        isLoading={walletLoading}
        onLoginToggle={connectWallet}
        statusMessage={isLoading ? "Loading profile..." : undefined}
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
            onConfigClick={() => setIsConfigOpen(true)}
            onWalletClick={() => setIsWalletOpen(true)}
            onUpdateSectionVisibility={updateSectionVisibility}
            onUpdateStickerData={updateStickerData}
            onEditProfile={handleEditProfile}
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