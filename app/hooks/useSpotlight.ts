/**
 * Custom hook for spotlight data management
 * 
 * This hook provides a clean interface for managing spotlight items with:
 * - Local state management
 * - Persistence to localStorage
 * - Type safety
 * 
 * Following the same pattern as useProfile and useMedia.
 */
import { useState, useEffect, useCallback } from 'react';
import { SpotlightItem } from '@/types';
import { useStorage, STORAGE_KEYS } from './useStorage';
import { exampleSpotlightItems } from '@/lib/example-content';

export function useSpotlight() {
  // Use storage hook for persistence
  const { getFromStorage, saveToStorage } = useStorage();
  
  // Spotlight state
  const [spotlightItems, setSpotlightItems] = useState<SpotlightItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted state on initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Load spotlight items from storage on mount
  useEffect(() => {
    if (!isMounted) return;
    
    try {
      // Load saved spotlight items if they exist
      const savedSpotlightItems = getFromStorage<SpotlightItem[] | null>(STORAGE_KEYS.SPOTLIGHT, null);
      
      if (savedSpotlightItems && Array.isArray(savedSpotlightItems)) {
        setSpotlightItems(savedSpotlightItems);
        console.log('📦 Loaded spotlight items from localStorage');
      } else {
        // Use example spotlight items if none exist
        setSpotlightItems(exampleSpotlightItems);
        // Save example items to storage to avoid future initial empty state
        saveToStorage(STORAGE_KEYS.SPOTLIGHT, exampleSpotlightItems);
        console.log('📦 Using example spotlight items as default');
      }
    } catch (error) {
      console.error('Error loading spotlight items from localStorage:', error);
      // Fall back to example spotlight items
      setSpotlightItems(exampleSpotlightItems);
    }
    
    // Mark loading as complete
    setIsLoading(false);
  }, [isMounted, getFromStorage, saveToStorage]);
  
  /**
   * Update spotlight items and persist to storage
   */
  const updateSpotlightItems = useCallback((updatedItems: SpotlightItem[]) => {
    saveToStorage(STORAGE_KEYS.SPOTLIGHT, updatedItems);
    setSpotlightItems(updatedItems);
    console.log('💾 Saved spotlight items to localStorage:', updatedItems.length);
  }, [saveToStorage]);
  
  /**
   * Add a new spotlight item
   */
  const addSpotlightItem = useCallback((newItem: Omit<SpotlightItem, 'id'>) => {
    const item: SpotlightItem = {
      ...newItem,
      id: `spotlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const updatedItems = [...spotlightItems, item];
    updateSpotlightItems(updatedItems);
    return item;
  }, [spotlightItems, updateSpotlightItems]);
  
  /**
   * Update a specific spotlight item
   */
  const updateSpotlightItem = useCallback((id: string, updates: Partial<SpotlightItem>) => {
    const updatedItems = spotlightItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    
    updateSpotlightItems(updatedItems);
  }, [spotlightItems, updateSpotlightItems]);
  
  /**
   * Remove a spotlight item
   */
  const removeSpotlightItem = useCallback((id: string) => {
    const updatedItems = spotlightItems.filter(item => item.id !== id);
    updateSpotlightItems(updatedItems);
  }, [spotlightItems, updateSpotlightItems]);
  
  return {
    spotlightItems,
    isLoading,
    updateSpotlightItems,
    addSpotlightItem,
    updateSpotlightItem,
    removeSpotlightItem
  };
} 