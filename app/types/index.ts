/**
 * This file exports all shared types for the application.
 * 
 * The ProfileMode enum is now imported from its own file to avoid circular dependencies.
 */

// Profile mode enum definition
export enum ProfileMode {
  View = 'view',
  Edit = 'edit',
  Theme = 'theme',
  PREVIEW = 'PREVIEW',
  LOADING = 'LOADING',
  SAVING = 'SAVING'
}

/**
 * SpotlightItem represents content featured in the Spotlight section
 */
export interface SpotlightItem {
  id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
}

/**
 * MediaItem represents embedded media content
 */
export interface MediaItem {
  id: string;
  type: string;
  title?: string;
  rawUrl?: string;
  embedUrl?: string;
}

/**
 * ShopItem represents products in the Shop section
 */
export interface ShopItem {
  id: string;
  title: string;
  description: string;
  image: string;
  price?: string;
  link?: string;
}

/**
 * SocialLink represents a social media link in the Profile
 */
export interface SocialLink {
  platform: string;
  url: string;
}

/**
 * ProfileData represents the user's complete profile information
 * 
 * IMPORTANT: This is the primary definition used by IntegratedProfile
 * Any changes here must be coordinated with app/types/profile.ts
 */
export interface ProfileData {
  /** Unique identifier for the profile */
  id: string;
  
  /** User's display name */
  name: string;
  
  /** User's professional title or role */
  title: string;
  
  /** User's biography or description */
  bio: string;
  
  /** Profile image URL - optional with fallback handling in UI */
  image?: string;
  
  /** Array of social media links */
  socialLinks: SocialLink[];
  
  /** Controls visibility of different profile sections */
  sectionVisibility?: {
    spotlight?: boolean;
    media?: boolean;
    shop?: boolean;
    sticker?: boolean;
  };
  
  /** Configuration for decorative sticker element */
  sticker?: {
    image: string;
    visible: boolean;
  };
  
  /** User's wallet address for Web3 functionality */
  walletAddress?: string;
  
  /** Controls whether wallet address is publicly visible */
  showWalletAddress?: boolean;
  
  /** Tracks whether the profile has been edited by the user */
  hasEditedProfile?: boolean;
} 