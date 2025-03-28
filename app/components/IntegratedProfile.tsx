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
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);

  // Wallet simulation vars
  const WALLET_ADDRESSES = [
    '0x8a5e9F03A54c77B67f7D0b1B39B3f6F5a9F3a76C', // Test address 1
    '0xDe9c0582fB4efC9BF95aE1C8AF87fE53B796d841', // Test address 2
    '0x7F5a9F03A54c77B67f7D0b1B39B3f6F5a9F3a76C'  // Test address 3
  ];

  // Connect wallet function with more realistic implementation
  const connectWallet = async () => {
    try {
      setWalletLoading(true);
      setStatusMessage("Connecting wallet...");
      
      // Simulate network delay for a more realistic wallet connection
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      if (!profile.walletAddress) {
        // If not connected, pick a random address
        const randomIndex = Math.floor(Math.random() * WALLET_ADDRESSES.length);
        const address = WALLET_ADDRESSES[randomIndex];
        
        // Update profile with the wallet address
        updateProfileField('walletAddress', address);
        updateProfileField('showWalletAddress', true);
        setStatusMessage("Wallet connected successfully!");
        
        // Enable edit mode since wallet is now connected
        localStorage.setItem('profile_mode', ProfileMode.Edit);
        updateProfileField('hasEditedProfile', true);
        
        console.log('✅ Connected to wallet:', address);
      } else {
        // If already connected, disconnect
        updateProfileField('walletAddress', '');
        updateProfileField('showWalletAddress', false);
        setStatusMessage("Wallet disconnected");
        console.log('❌ Disconnected wallet');
      }
      
      // Clear status message after a delay
      setTimeout(() => {
        setStatusMessage(undefined);
        setWalletLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setStatusMessage("Error connecting wallet");
      setWalletLoading(false);
      
      // Clear error message after delay
      setTimeout(() => {
        setStatusMessage(undefined);
      }, 3000);
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
        statusMessage={statusMessage || (isLoading ? "Loading profile..." : undefined)}
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