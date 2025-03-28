import { createContext, useContext, ReactNode } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useMedia } from '../hooks/useMedia';
import { useSpotlight } from '../hooks/useSpotlight';
import { useShop } from '../hooks/useShop';
import { ProfileData, MediaItem, SpotlightItem, ShopItem } from '../types';

/**
 * Interface defining all the properties and methods available in the ProfileContext
 */
interface ProfileContextType {
  // Profile state and methods
  profile: ProfileData;
  isProfileLoading: boolean;
  updateProfile: (newProfile: ProfileData) => void;
  updateProfileField: (field: keyof ProfileData | 'profileInfo', value: any) => void;
  updateSectionVisibility: (section: keyof ProfileData['sectionVisibility'], isVisible: boolean) => void;
  updateStickerData: (sticker: { visible: boolean; image: string }) => void;

  // Media state and methods
  mediaItems: MediaItem[];
  isMediaLoading: boolean;
  addMediaItem: (item: MediaItem) => void;
  updateMediaItem: (id: string, updates: Partial<MediaItem>) => void;
  removeMediaItem: (id: string) => void;

  // Spotlight state and methods
  spotlightItems: SpotlightItem[];
  isSpotlightLoading: boolean;
  addSpotlightItem: (item: SpotlightItem) => void;
  updateSpotlightItem: (id: string, updates: Partial<SpotlightItem>) => void;
  removeSpotlightItem: (id: string) => void;

  // Shop state and methods
  shopItems: ShopItem[];
  isShopLoading: boolean;
  addShopItem: (item: ShopItem) => void;
  updateShopItem: (id: string, updates: Partial<ShopItem>) => void;
  removeShopItem: (id: string) => void;

  // Global state
  isLoading: boolean;
}

/**
 * Create the Profile context with a default undefined value
 * This will ensure components using the context are wrapped in a provider
 */
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

/**
 * Props for the ProfileProvider component
 */
interface ProfileProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps parts of the app that need access to the profile context
 */
export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  // Use all our hooks
  const {
    profile,
    isLoading: isProfileLoading,
    updateProfile,
    updateProfileField,
    updateSectionVisibility,
    updateStickerData,
  } = useProfile();

  const {
    mediaItems,
    isLoading: isMediaLoading,
    addMediaItem,
    updateMediaItem,
    removeMediaItem,
  } = useMedia();

  const {
    spotlightItems,
    isLoading: isSpotlightLoading,
    addSpotlightItem,
    updateSpotlightItem,
    removeSpotlightItem,
  } = useSpotlight();

  const {
    shopItems,
    isLoading: isShopLoading,
    addShopItem,
    updateShopItem,
    removeShopItem,
  } = useShop();

  // Combined loading state
  const isLoading = isProfileLoading || isMediaLoading || isSpotlightLoading || isShopLoading;

  // Combine all values into the context value
  const value: ProfileContextType = {
    // Profile
    profile,
    isProfileLoading,
    updateProfile,
    updateProfileField,
    updateSectionVisibility,
    updateStickerData,

    // Media
    mediaItems,
    isMediaLoading,
    addMediaItem,
    updateMediaItem,
    removeMediaItem,

    // Spotlight
    spotlightItems,
    isSpotlightLoading,
    addSpotlightItem,
    updateSpotlightItem,
    removeSpotlightItem,

    // Shop
    shopItems,
    isShopLoading,
    addShopItem,
    updateShopItem,
    removeShopItem,

    // Global
    isLoading,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

/**
 * Custom hook to use the profile context
 * Throws an error if used outside of a ProfileProvider
 */
export const useProfileContext = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  
  return context;
}; 