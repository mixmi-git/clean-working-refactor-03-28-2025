/**
 * Custom hook for media data management
 * 
 * This hook provides a clean interface for managing media items with:
 * - Local state management
 * - Persistence to localStorage
 * - Type safety
 * 
 * Similar to useProfile, but specifically for media items.
 */
import { useState, useEffect, useCallback } from 'react';
import { MediaItem } from '@/types'; // Import from index.ts for consistency with examples
import { useStorage, STORAGE_KEYS } from './useStorage';
import { exampleMediaItems } from '@/lib/example-content';

// Create a utility type that's compatible with both MediaItem definitions
type CompatibleMediaItem = {
  id: string;
  type: string;
  title?: string;
  rawUrl?: string;
  embedUrl?: string;
};

export function useMedia() {
  // Use storage hook for persistence
  const { getFromStorage, saveToStorage } = useStorage();
  
  // Media state - Use the compatible type
  const [mediaItems, setMediaItems] = useState<CompatibleMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted state on initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Load media items from storage on mount
  useEffect(() => {
    if (!isMounted) return;
    
    try {
      // Load saved media items if they exist
      const savedMediaItems = getFromStorage<CompatibleMediaItem[] | null>(STORAGE_KEYS.MEDIA, null);
      
      if (savedMediaItems && Array.isArray(savedMediaItems)) {
        setMediaItems(savedMediaItems);
        console.log('📦 Loaded media items from localStorage');
      } else {
        // Use example media items if none exist
        setMediaItems(exampleMediaItems as CompatibleMediaItem[]);
        // Save example items to storage to avoid future initial empty state
        saveToStorage(STORAGE_KEYS.MEDIA, exampleMediaItems);
        console.log('📦 Using example media items as default');
      }
    } catch (error) {
      console.error('Error loading media items from localStorage:', error);
      // Fall back to example media items
      setMediaItems(exampleMediaItems as CompatibleMediaItem[]);
    }
    
    // Mark loading as complete
    setIsLoading(false);
  }, [isMounted, getFromStorage, saveToStorage]);
  
  /**
   * Update media items and persist to storage
   */
  const updateMediaItems = useCallback((updatedMediaItems: CompatibleMediaItem[]) => {
    saveToStorage(STORAGE_KEYS.MEDIA, updatedMediaItems);
    setMediaItems(updatedMediaItems);
    console.log('💾 Saved media items to localStorage:', updatedMediaItems.length);
  }, [saveToStorage]);
  
  /**
   * Add a new media item
   */
  const addMediaItem = useCallback((newItem: Omit<CompatibleMediaItem, 'id'>) => {
    const item: CompatibleMediaItem = {
      ...newItem,
      id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const updatedItems = [...mediaItems, item];
    updateMediaItems(updatedItems);
    return item;
  }, [mediaItems, updateMediaItems]);
  
  /**
   * Update a specific media item
   */
  const updateMediaItem = useCallback((id: string, updates: Partial<CompatibleMediaItem>) => {
    const updatedItems = mediaItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    
    updateMediaItems(updatedItems);
  }, [mediaItems, updateMediaItems]);
  
  /**
   * Remove a media item
   */
  const removeMediaItem = useCallback((id: string) => {
    const updatedItems = mediaItems.filter(item => item.id !== id);
    updateMediaItems(updatedItems);
  }, [mediaItems, updateMediaItems]);
  
  return {
    mediaItems: mediaItems as MediaItem[], // Cast back to MediaItem for external API consistency
    isLoading,
    updateMediaItems: updateMediaItems as (items: MediaItem[]) => void,
    addMediaItem,
    updateMediaItem,
    removeMediaItem
  };
} 