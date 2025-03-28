import { SocialLink } from '@/types';

/**
 * ProfileData interface for user profile information.
 * 
 * IMPORTANT NOTES:
 * 1. This interface has been standardized with app/types/index.ts
 * 2. Most fields match the definition in app/types/index.ts
 * 3. The hasEditedProfile field is intentionally omitted due to circular dependency issues
 * 4. Use this interface for components that only need profile data
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
  
  /** User's wallet address for Web3 functionality */
  walletAddress?: string;
  
  /** Controls whether wallet address is publicly visible */
  showWalletAddress?: boolean;
  
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
}

export interface PersonalInfoEditorProps {
  profile: ProfileData;
  onSave: (updates: Partial<ProfileData>) => void;
  onClose: () => void;
}

export interface PersonalInfoEditorModalProps extends PersonalInfoEditorProps {
  isOpen: boolean;
} 