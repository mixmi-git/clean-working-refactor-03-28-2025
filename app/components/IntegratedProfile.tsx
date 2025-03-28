'use client';

import React, { useEffect, useState } from 'react';
import { ProfileData } from '@/types';
import { MediaItem } from '@/types';
import ProfileView from './profile/ProfileView';
import Link from 'next/link';
import { ProfileMode } from '@/types/ProfileMode';
import { useProfile } from '@/hooks/useProfile';
import { useMedia } from '@/hooks/useMedia';
import { useSpotlight } from '@/hooks/useSpotlight';
import { useShop } from '@/hooks/useShop';

// Default profile for development and testing
const DEFAULT_PROFILE: ProfileData = {
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

export function IntegratedProfile() {
  // Use hooks for state management
  const { 
    profile, 
    isLoading: profileLoading, 
    updateProfile,
    updateProfileField: handleProfileUpdate,
    updateSectionVisibility: handleSectionVisibilityChange,
    updateStickerData: saveStickerData 
  } = useProfile();
  
  // Use media hook for media items state management
  const {
    mediaItems,
    isLoading: mediaLoading,
    updateMediaItems: saveMediaItems
  } = useMedia();
  
  // Use spotlight hook for spotlight items state management
  const {
    spotlightItems,
    isLoading: spotlightLoading,
    updateSpotlightItems: saveSpotlightItems
  } = useSpotlight();
  
  // Use shop hook for shop items state management
  const {
    shopItems,
    isLoading: shopLoading,
    updateShopItems: saveShopItems
  } = useShop();
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Helper function to safely get data from localStorage
  const getFromStorage = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.error(`Error retrieving ${key} from localStorage:`, error);
      return fallback;
    }
  };
  
  // Helper function to safely save data to localStorage
  const saveToStorage = <T,>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };
  
  // Simple storage keys
  const STORAGE_KEYS = {
    PROFILE: 'mixmi_profile_data',
    SPOTLIGHT: 'mixmi_spotlight_items',
    SHOP: 'mixmi_shop_items',
    MEDIA: 'mixmi_media_items',
    STICKER: 'mixmi_sticker_data'
  };
  
  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Check localStorage on mount for existing wallet connection
  useEffect(() => {
    if (!isMounted) return;

    // Check for wallet connection 
    const connected = localStorage.getItem('simple-wallet-connected') === 'true';
    const address = localStorage.getItem('simple-wallet-address');
    
    if (connected && address) {
      setIsAuthenticated(true);
      setUserAddress(address);
      console.log('✅ Restored wallet connection from localStorage:', address);
    }
  }, [isMounted]);
  
  // Force loading complete after all hooks have loaded their data
  useEffect(() => {
    if (isMounted && !profileLoading && !mediaLoading && !spotlightLoading && !shopLoading) {
      // All hooks have finished loading, set loading to false
      console.log('🔄 All data has been loaded from hooks');
      setIsLoading(false);
    }
  }, [isMounted, profileLoading, mediaLoading, spotlightLoading, shopLoading]);
  
  // Update connectWallet function to use the new updateProfile
  const connectWallet = async () => {
    try {
      setWalletStatus('connecting');
      
      // Simulate connecting to wallet for demo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock wallet connection
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 14);
      setUserAddress(mockAddress);
      setIsAuthenticated(true);
      
      // Store in localStorage
      localStorage.setItem('simple-wallet-connected', 'true');
      localStorage.setItem('simple-wallet-address', mockAddress);
      
      // Update profile with wallet address
      updateProfile({
        ...profile,
        walletAddress: mockAddress
      });
      
      setWalletStatus('connected');
      console.log('✅ Connected wallet:', mockAddress);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWalletStatus('error');
    }
  };
  
  const disconnectWallet = () => {
    setIsAuthenticated(false);
    setUserAddress(null);
    localStorage.removeItem('simple-wallet-connected');
    localStorage.removeItem('simple-wallet-address');
    
    // Update profile
    updateProfile({
      ...profile,
      walletAddress: undefined
    });
    
    console.log('❌ Disconnected wallet');
  };
  
  // Move to edit mode with existing profile data
  const handleEditProfile = () => {
    localStorage.setItem('profile_mode', ProfileMode.Edit);
    handleProfileUpdate('hasEditedProfile', true);
  };
  
  // Loading state handling
  if (isLoading || profileLoading || mediaLoading || spotlightLoading || shopLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-200 w-1/2 mx-auto rounded mb-4"></div>
          <div className="h-4 bg-gray-200 w-1/3 mx-auto rounded"></div>
        </div>
        <p className="mt-4 text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
          <h1 className="text-2xl font-bold mb-2 md:mb-0">Profile Integration Demo</h1>
          <div className="flex space-x-2">
            {!isAuthenticated ? (
              <button
                onClick={connectWallet}
                disabled={walletStatus === 'connecting'}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {walletStatus === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <button
                onClick={disconnectWallet}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Disconnect Wallet
              </button>
            )}
            <button
              onClick={handleEditProfile}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
        
        {userAddress && (
          <p className="mb-4 text-gray-600">
            Connected: <span className="font-mono bg-gray-100 p-1 rounded">{userAddress}</span>
          </p>
        )}
        
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Instructions</h2>
          <p className="text-gray-700">
            This is a demonstration of the user profile system. You can connect a wallet (simulated), edit your profile, and see changes in real-time.
            All data is stored in your browser's localStorage.
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <ProfileView 
          profile={profile} 
          mediaItems={mediaItems}
          spotlightItems={spotlightItems}
          shopItems={shopItems}
          isAuthenticated={isAuthenticated}
          onEditProfile={handleEditProfile}
          onUpdateProfile={handleProfileUpdate}
          onUpdateSpotlightItems={saveSpotlightItems}
          onUpdateMediaItems={saveMediaItems}
          onUpdateShopItems={saveShopItems}
          onUpdateStickerData={saveStickerData}
          onUpdateSectionVisibility={handleSectionVisibilityChange}
        />
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Profile Data</h2>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </div>
    </div>
  );
} 