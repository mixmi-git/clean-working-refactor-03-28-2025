/**
 * Custom hook for shop data management
 * 
 * This hook provides a clean interface for managing shop items with:
 * - Local state management
 * - Persistence to localStorage
 * - Type safety
 * 
 * Following the same pattern as useProfile, useMedia, and useSpotlight.
 */
import { useState, useEffect, useCallback } from 'react';
import { ShopItem } from '@/types';
import { useStorage, STORAGE_KEYS } from './useStorage';
import { exampleShopItems } from '@/lib/example-content';

export function useShop() {
  // Use storage hook for persistence
  const { getFromStorage, saveToStorage } = useStorage();
  
  // Shop state
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted state on initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Load shop items from storage on mount
  useEffect(() => {
    if (!isMounted) return;
    
    try {
      // Load saved shop items if they exist
      const savedShopItems = getFromStorage<ShopItem[] | null>(STORAGE_KEYS.SHOP, null);
      
      if (savedShopItems && Array.isArray(savedShopItems)) {
        setShopItems(savedShopItems);
        console.log('📦 Loaded shop items from localStorage');
      } else {
        // Use example shop items if none exist
        setShopItems(exampleShopItems);
        // Save example items to storage to avoid future initial empty state
        saveToStorage(STORAGE_KEYS.SHOP, exampleShopItems);
        console.log('📦 Using example shop items as default');
      }
    } catch (error) {
      console.error('Error loading shop items from localStorage:', error);
      // Fall back to example shop items
      setShopItems(exampleShopItems);
    }
    
    // Mark loading as complete
    setIsLoading(false);
  }, [isMounted, getFromStorage, saveToStorage]);
  
  /**
   * Update shop items and persist to storage
   */
  const updateShopItems = useCallback((updatedItems: ShopItem[]) => {
    saveToStorage(STORAGE_KEYS.SHOP, updatedItems);
    setShopItems(updatedItems);
    console.log('💾 Saved shop items to localStorage:', updatedItems.length);
  }, [saveToStorage]);
  
  /**
   * Add a new shop item
   */
  const addShopItem = useCallback((newItem: Omit<ShopItem, 'id'>) => {
    const item: ShopItem = {
      ...newItem,
      id: `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const updatedItems = [...shopItems, item];
    updateShopItems(updatedItems);
    return item;
  }, [shopItems, updateShopItems]);
  
  /**
   * Update a specific shop item
   */
  const updateShopItem = useCallback((id: string, updates: Partial<ShopItem>) => {
    const updatedItems = shopItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    
    updateShopItems(updatedItems);
  }, [shopItems, updateShopItems]);
  
  /**
   * Remove a shop item
   */
  const removeShopItem = useCallback((id: string) => {
    const updatedItems = shopItems.filter(item => item.id !== id);
    updateShopItems(updatedItems);
  }, [shopItems, updateShopItems]);
  
  return {
    shopItems,
    isLoading,
    updateShopItems,
    addShopItem,
    updateShopItem,
    removeShopItem
  };
} 