'use client';

import { useState, useCallback, useEffect } from 'react'
import { Navbar } from './Navbar'
import { useAuth } from '@/lib/auth'

/**
 * NavbarContainer handles authentication logic and renders the Navbar
 * This pattern helps isolate auth logic from the main profile component
 */

// Define the props for NavbarContainer
export interface NavbarContainerProps {
  isAuthenticated?: boolean
}

// Simplified Navbar Container that uses the auth hook consistently
export function NavbarContainer({ 
  isAuthenticated: propIsAuthenticated
}: NavbarContainerProps) {
  const { isAuthenticated: authIsAuthenticated, connectWallet, disconnectWallet, refreshAuthState, isInitialized, userAddress } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined)
  
  const devMode = process.env.NODE_ENV === 'development';
  
  // Use provided authentication state if available, otherwise use from hook
  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : authIsAuthenticated;
  
  // Simple implementation of handleLoginToggle using the auth hook directly
  const handleLoginToggle = useCallback(async () => {
    try {
      console.log('NavbarContainer: Login toggle called');
      setIsLoading(true);
      
      if (isAuthenticated) {
        console.log('NavbarContainer: Disconnecting wallet');
        setStatusMessage('Disconnecting wallet...');
        await disconnectWallet();
        setStatusMessage('Wallet disconnected');
        
        // Wait for the auth state to update
        setTimeout(() => {
          refreshAuthState();
          setIsLoading(false);
          setStatusMessage(undefined);
        }, 500);
      } else {
        console.log('NavbarContainer: Connecting wallet');
        setStatusMessage('Connecting wallet...');
        await connectWallet();
        setStatusMessage('Wallet connected');
        
        // Wait for the auth state to update
        setTimeout(() => {
          refreshAuthState();
          setIsLoading(false);
          setStatusMessage(undefined);
        }, 500);
      }
    } catch (error) {
      console.error('Error in login toggle:', error);
      setStatusMessage('Error connecting wallet');
      setIsLoading(false);
      
      // Clear error message after delay
      setTimeout(() => {
        setStatusMessage(undefined);
      }, 3000);
    }
  }, [isAuthenticated, connectWallet, disconnectWallet, refreshAuthState]);

  return (
    <Navbar
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
      onLoginToggle={handleLoginToggle}
      statusMessage={statusMessage}
      walletAddress={userAddress || undefined}
    />
  )
} 