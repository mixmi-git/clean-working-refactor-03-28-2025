import { SocialLink } from '@/types';

// Base interface with only the fields used by PersonalInfoEditor
export interface ProfileData {
  id: string;
  name: string;
  title: string;
  bio: string;
  image?: string;
  walletAddress?: string;
  showWalletAddress?: boolean;
  socialLinks: SocialLink[];
  // Section visibility type is defined in @/types/index.ts
  sectionVisibility?: {
    spotlight?: boolean;
    media?: boolean;
    shop?: boolean;
    sticker?: boolean;
  };
  // Sticker configuration
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