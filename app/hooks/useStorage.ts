/**
 * Custom hook for storage operations with built-in type safety
 * This abstracts localStorage to improve testability and allow for 
 * future storage mechanism changes.
 */
import { useCallback } from 'react';

/**
 * Storage keys used in the application
 */
export const STORAGE_KEYS = {
  PROFILE: 'mixmi_profile_data',
  SPOTLIGHT: 'mixmi_spotlight_items',
  SHOP: 'mixmi_shop_items',
  MEDIA: 'mixmi_media_items',
  STICKER: 'mixmi_sticker_data',
  WALLET_CONNECTED: 'simple-wallet-connected',
  WALLET_ADDRESS: 'simple-wallet-address'
};

/**
 * Simple hook for localStorage operations with error handling and SSR safety
 * 
 * This hook is intentionally kept minimal to avoid introducing major changes to the existing code.
 * It provides a thin wrapper around localStorage operations with:
 *   - Server-side rendering safety checks
 *   - Error handling
 *   - Type safety
 * 
 * The functions match the original helper functions in IntegratedProfile to minimize
 * change impact and potential for breaking changes.
 */
export function useStorage() {
  /**
   * Safely get data from localStorage with fallback
   */
  const getFromStorage = useCallback(<T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.error(`Error retrieving ${key} from localStorage:`, error);
      return fallback;
    }
  }, []);

  /**
   * Safely save data to localStorage
   */
  const saveToStorage = useCallback(<T,>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, []);

  /**
   * Safely remove data from localStorage
   */
  const removeFromStorage = useCallback((key: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  }, []);

  return {
    getFromStorage,
    saveToStorage,
    removeFromStorage
  };
} 