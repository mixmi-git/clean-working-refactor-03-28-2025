'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthState } from '../../hooks/useAuthState';
import ProfileView from './ProfileView';
import { Edit2 } from 'lucide-react';
import { exampleMediaItems, exampleSpotlightItems, exampleShopItems } from '@/lib/example-content';
import { ProfileMode, ProfileData, SpotlightItem, MediaItem, ShopItem, SocialLink } from '@/types';

// Re-export ProfileMode for backward compatibility
export { ProfileMode } from '@/types';

// Type aliases for backward compatibility
export type SpotlightItemType = SpotlightItem;
export type MediaItemType = MediaItem;
export type ShopItemType = ShopItem;
export type SocialLinkType = SocialLink;

// Storage keys for localStorage with dynamic profile ID support
const getStorageKeys = (profileId: string) => ({
  PROFILE: `mixmi_profile_data_${profileId}`,
  SPOTLIGHT: `mixmi_spotlight_items_${profileId}`,
  SHOP: `mixmi_shop_items_${profileId}`,
  MEDIA: `mixmi_media_items_${profileId}`,
  STICKER: `mixmi_sticker_data_${profileId}`
});

// For backwards compatibility
const LEGACY_STORAGE_KEYS = {
  PROFILE: 'mixmi_profile_data',
  SPOTLIGHT: 'mixmi_spotlight_items',
  SHOP: 'mixmi_shop_items',
  MEDIA: 'mixmi_media_items',
  STICKER: 'mixmi_sticker_data'
};

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

// Define the interfaces for our component props
export interface UserProfileContainerProps {
  initialProfile?: ProfileData;
  initialSpotlightItems?: SpotlightItemType[];
  initialShopItems?: ShopItemType[];
  initialMediaItems?: MediaItemType[];
  disableAuth?: boolean;
}

// Default profile structure
const DEFAULT_PROFILE: ProfileData = {
  id: '',
  name: 'Add Your Name',
  title: 'Add Your Title',
  bio: 'Tell your story here...',
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
    image: "/images/stickers/daisy-blue.png"
  },
  hasEditedProfile: false
};

// Development-only logging utility
const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

/**
 * UserProfileContainer - The main container for the profile page
 * Manages authentication, profile data, and edit-in-place functionality
 */
const UserProfileContainer: React.FC<UserProfileContainerProps> = ({
  initialProfile = DEFAULT_PROFILE,
  initialSpotlightItems = [],
  initialShopItems = [],
  initialMediaItems = [],
  disableAuth = false,
}) => {
  // Authentication state
  const { 
    isAuthenticated, 
    isTransitioning, 
    handleLoginToggle, 
    userAddress,
    currentAccount,
    availableAccounts,
    switchAccount,
    getProfileIdForAddress
  } = useAuthState();
  
  // Profile ID (based on current account)
  const [profileId, setProfileId] = useState<string>('default');
  
  // Listen for account changes
  useEffect(() => {
    const handleAccountChanged = (event: CustomEvent<{ address: string; profileId: string }>) => {
      console.log('🔄 Account changed:', event.detail);
      
      // Get appropriate storage keys based on profile ID
      const STORAGE_KEYS = getStorageKeys(event.detail.profileId);
      
      // Load profile data with the new account's wallet address
      const savedProfile = getFromStorage<ProfileData>(STORAGE_KEYS.PROFILE, {
        ...DEFAULT_PROFILE,
        walletAddress: event.detail.address,
        id: event.detail.profileId,
      });
      
      // Load other data
      const savedSpotlightItems = getFromStorage<SpotlightItemType[]>(STORAGE_KEYS.SPOTLIGHT, []);
      const savedShopItems = getFromStorage<ShopItemType[]>(STORAGE_KEYS.SHOP, []);
      const savedMediaItems = getFromStorage<MediaItemType[]>(STORAGE_KEYS.MEDIA, []);
      const savedSticker = getFromStorage<{ visible: boolean; image: string }>(
        STORAGE_KEYS.STICKER,
        {
          visible: true,
          image: "/images/stickers/daisy-blue.png"
        }
      );
      
      // Update state with the loaded data
      setProfile({
        ...savedProfile,
        sticker: savedSticker
      });
      setSpotlightItems(savedSpotlightItems);
      setShopItems(savedShopItems);
      setMediaItems(savedMediaItems);
      
      // Update profile ID after loading data
      setProfileId(event.detail.profileId);
      
      console.log('🔄 Loaded profile data for account:', event.detail.address, {
        profile: savedProfile,
        spotlightItems: savedSpotlightItems.length,
        shopItems: savedShopItems.length,
        mediaItems: savedMediaItems.length,
        sticker: savedSticker
      });
    };
    
    window.addEventListener('account-changed', handleAccountChanged as EventListener);
    return () => window.removeEventListener('account-changed', handleAccountChanged as EventListener);
  }, []);
  
  // Setup profile ID when authentication changes
  useEffect(() => {
    if (isAuthenticated && currentAccount) {
      // Get profile ID for this account
      const accountProfileId = getProfileIdForAddress(currentAccount);
      if (accountProfileId) {
        setProfileId(accountProfileId);
      } else {
        // Create a new profile ID for this account
        const newProfileId = `profile_${currentAccount.slice(0, 10)}`;
        setProfileId(newProfileId);
      }
    } else {
      // Not authenticated, use default profile
      setProfileId('default');
    }
  }, [isAuthenticated, currentAccount, getProfileIdForAddress]);
  
  // State for profile data
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [mediaItems, setMediaItems] = useState<MediaItemType[]>(initialMediaItems);
  const [spotlightItems, setSpotlightItems] = useState<SpotlightItemType[]>(initialSpotlightItems);
  const [shopItems, setShopItems] = useState<ShopItemType[]>(initialShopItems);
  
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Load data from localStorage on component mount or when profile ID changes
  useEffect(() => {
    // Only load data if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Get appropriate storage keys based on profile ID
      const STORAGE_KEYS = getStorageKeys(profileId);
      
      console.log('🔍 DEBUG: Storage keys being used:', STORAGE_KEYS);
      console.log('🔍 DEBUG: localStorage keys available:', Object.keys(localStorage).filter(key => 
        key.includes('mixmi_')));
      
      // Load profile data with the current account's wallet address
      const savedProfile = getFromStorage<ProfileData>(STORAGE_KEYS.PROFILE, {
        ...DEFAULT_PROFILE,
        walletAddress: currentAccount || '',
        id: profileId,
      });
      
      // Load other data
      const savedSpotlightItems = getFromStorage<SpotlightItemType[]>(STORAGE_KEYS.SPOTLIGHT, []);
      const savedShopItems = getFromStorage<ShopItemType[]>(STORAGE_KEYS.SHOP, []);
      const savedMediaItems = getFromStorage<MediaItemType[]>(STORAGE_KEYS.MEDIA, []);
      
      // Load sticker data
      const savedSticker = getFromStorage<ProfileData['sticker']>(
        STORAGE_KEYS.STICKER,
        DEFAULT_PROFILE.sticker
      ) as ProfileData['sticker'];

      // Always ensure sticker is visible and has an image
      const sticker = {
        visible: true,
        image: savedSticker?.image || DEFAULT_PROFILE.sticker?.image || "/images/stickers/daisy-blue.png"
      };
      
      // Check if this is a first-time user for this profile
      const isFirstTimeUser = !localStorage.getItem(STORAGE_KEYS.PROFILE) || 
        !savedProfile.hasEditedProfile;
      
      console.log('🔍 DEBUG: Is first time user:', isFirstTimeUser);
      console.log('🔍 DEBUG: Loaded profile:', savedProfile);
      console.log('🔍 DEBUG: Loaded spotlight items:', savedSpotlightItems?.length || 0);
      
      devLog('📦 Loading data for profile ID:', profileId, {
        isFirstTimeUser,
        savedProfile,
        spotlightItems: savedSpotlightItems?.length || 0,
        mediaItems: savedMediaItems?.length || 0,
        shopItems: savedShopItems?.length || 0,
        savedSticker
      });

      if (isFirstTimeUser) {
        // First time user - set up example content
        devLog('🎉 First-time user detected for profile ID:', profileId, 'Loading example content');
        
        const profileWithDefaults = {
          ...DEFAULT_PROFILE,
          id: profileId,
          walletAddress: currentAccount || '',
          sectionVisibility: {
            spotlight: true,
            media: true,
            shop: true,
            sticker: true
          },
          sticker: sticker
        };
        
        setProfile(profileWithDefaults);
        setSpotlightItems(exampleSpotlightItems);
        setShopItems(exampleShopItems);
        setMediaItems(exampleMediaItems);
        
        // Save example content to localStorage
        saveToStorage(STORAGE_KEYS.PROFILE, profileWithDefaults);
        saveToStorage(STORAGE_KEYS.SPOTLIGHT, exampleSpotlightItems);
        saveToStorage(STORAGE_KEYS.SHOP, exampleShopItems);
        saveToStorage(STORAGE_KEYS.MEDIA, exampleMediaItems);
        saveToStorage(STORAGE_KEYS.STICKER, sticker);
        
        devLog('📦 Saved example content for first-time user with profile ID:', profileId);
      } else {
        // Returning user - load their saved content
        devLog('🔄 Returning user with profile ID:', profileId, 'Loading saved content');
        setProfile({
          ...savedProfile,
          sticker: sticker
        });
        setSpotlightItems(savedSpotlightItems || []);
        setShopItems(savedShopItems || []);
        setMediaItems(savedMediaItems?.length > 0 ? savedMediaItems : [{
          id: Date.now().toString(),
          type: '',
          title: ''
        }]);
      }
    }
  }, [initialProfile, initialSpotlightItems, initialShopItems, initialMediaItems, profileId, currentAccount]);
  
  // Save profile data to localStorage
  const saveProfileData = (updatedProfile: ProfileData) => {
    // Get appropriate storage keys based on profile ID
    const STORAGE_KEYS = getStorageKeys(profileId);
      
    devLog('📦 Saving profile data for profile ID:', profileId, updatedProfile);
    
    // Save complete profile data
    const completeProfile = {
      ...updatedProfile,
      hasEditedProfile: true,
      walletAddress: currentAccount || '', // Ensure wallet address is saved
      id: profileId, // Ensure profile ID is saved
    };
    
    // Save to account-specific storage
    saveToStorage(STORAGE_KEYS.PROFILE, completeProfile);
    
    // Update the account-profile mapping
    if (currentAccount) {
      const mapString = localStorage.getItem('mixmi_account_profile_map');
      const map = mapString ? JSON.parse(mapString) : {};
      map[currentAccount] = profileId;
      localStorage.setItem('mixmi_account_profile_map', JSON.stringify(map));
      
      // Also save the profile ID to the account's specific storage
      localStorage.setItem(`mixmi_account_${currentAccount}_profile_id`, profileId);
    }
    
    setProfile(completeProfile);
    devLog('📦 Saved profile for profile ID:', profileId, completeProfile);
  };
  
  // Save spotlight items to localStorage
  const saveSpotlightItems = (items: SpotlightItemType[]) => {
    const STORAGE_KEYS = getStorageKeys(profileId);
    
    saveToStorage(STORAGE_KEYS.SPOTLIGHT, items);
    setSpotlightItems(items);
    devLog('📦 Saved spotlight items for profile ID:', profileId);
  };
  
  // Save media items to localStorage
  const saveMediaItems = (items: MediaItemType[]) => {
    const STORAGE_KEYS = getStorageKeys(profileId);
    
    saveToStorage(STORAGE_KEYS.MEDIA, items);
    setMediaItems(items);
    devLog('📦 Saved media items for profile ID:', profileId);
  };
  
  // Save shop items to localStorage
  const saveShopItems = (items: ShopItemType[]) => {
    const STORAGE_KEYS = getStorageKeys(profileId);
    
    saveToStorage(STORAGE_KEYS.SHOP, items);
    setShopItems(items);
    devLog('📦 Saved shop items for profile ID:', profileId);
  };
  
  // Save sticker data to localStorage
  const saveStickerData = (stickerData: { visible: boolean; image: string }) => {
    const STORAGE_KEYS = getStorageKeys(profileId);
    
    // Always ensure sticker is visible when saving
    const stickerToSave = {
      ...stickerData,
      visible: true
    };
    
    saveToStorage(STORAGE_KEYS.STICKER, stickerToSave);
    setProfile(prev => ({
      ...prev,
      sticker: stickerToSave
    }));
    devLog('📦 Saved sticker data for profile ID:', profileId);
  };
  
  // Handle section visibility changes
  const handleSectionVisibilityChange = (field: keyof ProfileData['sectionVisibility'], value: boolean) => {
    const updatedProfile = {
      ...profile,
      sectionVisibility: {
        ...profile.sectionVisibility,
        [field]: value
      }
    };
    
    saveProfileData(updatedProfile);
  };
  
  // Handle profile field updates
  const handleProfileUpdate = (field: keyof ProfileData, value: any) => {
    const updatedProfile = {
      ...profile,
      [field]: value,
      hasEditedProfile: true
    };
    
    saveProfileData(updatedProfile);
  };
  
  // Determine if user is authenticated for edit access
  const canEdit = disableAuth || isAuthenticated;
  
  // Debug controls - enable in development mode
  const DevControls = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white p-4 rounded-lg text-xs">
        <h3 className="font-semibold mb-2">Dev Controls</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span>Auth: </span>
            <span className={`px-2 py-1 rounded ${isAuthenticated ? 'bg-green-600' : 'bg-red-600'}`}>
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Edit Mode: </span>
            <span className={`px-2 py-1 rounded ${canEdit ? 'bg-green-600' : 'bg-red-600'}`}>
              {canEdit ? 'Enabled' : 'Disabled'}
            </span>
            <button 
              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  (window as any).toggleAuth?.();
                  window.location.reload();
                }
              }}
            >
              Toggle
            </button>
          </div>
          <div>
            <button
              className="px-2 py-1 mt-2 rounded bg-purple-600 hover:bg-purple-700 w-full"
              onClick={() => {
                // Clear all localStorage data and reload
                if (typeof window !== 'undefined') {
                  Object.keys(localStorage)
                    .filter(key => key.includes('mixmi_'))
                    .forEach(key => localStorage.removeItem(key));
                    
                  console.log('🧹 Cleared all profile data');
                  window.location.reload();
                }
              }}
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Debug logging for authentication
  useEffect(() => {
    console.log('🧩 UserProfileContainer Auth State:', {
      isAuthenticated,
      canEdit,
      userAddress,
      currentAccount,
      profileId,
      availableAccounts: availableAccounts?.length || 0
    });
  }, [isAuthenticated, canEdit, userAddress, currentAccount, profileId, availableAccounts]);
  
  // Render the profile with edit-in-place capability
  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes sticker-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-sticker-rotate {
          animation: sticker-rotate 12s linear infinite;
        }
      `}</style>
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col bg-gray-900">
          {/* Account Switcher for authenticated users */}
          {isAuthenticated && availableAccounts?.length > 1 && (
            <div className="bg-gray-800 border-b border-gray-700">
              <div className="container mx-auto px-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">Active Account:</span>
                    <select 
                      className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
                      value={currentAccount || ''}
                      onChange={(e) => switchAccount(e.target.value)}
                    >
                      {availableAccounts.map((account: string) => (
                        <option key={account} value={account}>
                          {account.slice(0, 6)}...{account.slice(-4)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-gray-500">
                    Profile ID: {profileId}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Pass everything to ProfileView, including edit callbacks */}
          <ProfileView
            profile={profile}
            mediaItems={mediaItems}
            spotlightItems={spotlightItems}
            shopItems={shopItems}
            isAuthenticated={canEdit}
            isTransitioning={isTransitioning}
            onUpdateProfile={handleProfileUpdate}
            onUpdateSpotlightItems={saveSpotlightItems}
            onUpdateMediaItems={saveMediaItems}
            onUpdateShopItems={saveShopItems}
            onUpdateStickerData={saveStickerData}
            onUpdateSectionVisibility={handleSectionVisibilityChange}
          />
          
          {/* Show dev controls in development */}
          {process.env.NODE_ENV === 'development' && <DevControls />}
        </div>
      )}
    </div>
  );
};

export { UserProfileContainer }; 