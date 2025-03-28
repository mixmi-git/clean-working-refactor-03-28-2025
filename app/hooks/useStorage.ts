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
 * Hook that provides type-safe localStorage interactions with error handling
 */
export function useStorage() {
  /**
   * Get data from storage
   * @param key - Storage key
   * @param fallback - Default value if key doesn't exist or parsing fails
   * @returns The stored value or fallback
   */
  const getItem = useCallback(<T>(key: string, fallback: T): T => {
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
   * Save data to storage
   * @param key - Storage key
   * @param value - Value to store
   * @returns true if operation succeeded, false otherwise
   */
  const setItem = useCallback(<T>(key: string, value: T): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      return false;
    }
  }, []);

  /**
   * Remove data from storage
   * @param key - Storage key to remove
   * @returns true if operation succeeded, false otherwise
   */
  const removeItem = useCallback((key: string): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  }, []);

  /**
   * Clear all storage
   * @returns true if operation succeeded, false otherwise
   */
  const clearAll = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }, []);

  return {
    getItem,
    setItem,
    removeItem,
    clearAll,
    KEYS: STORAGE_KEYS
  };
} 