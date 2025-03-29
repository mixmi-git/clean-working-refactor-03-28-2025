import { useState, useEffect, useCallback } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Force-refresh the auth state from localStorage
  const refreshAuthState = useCallback(() => {
    const walletConnected = localStorage.getItem('mixmi-wallet-connected') === 'true';
    const walletAddress = localStorage.getItem('mixmi-wallet-address');
    console.log('Refreshing auth state from localStorage:', { walletConnected, walletAddress });
    
    if (walletConnected && walletAddress) {
      setIsAuthenticated(true);
      setUserAddress(walletAddress);
    } else {
      setIsAuthenticated(false);
      setUserAddress(null);
    }
    
    setIsInitialized(true);
  }, []);

  // Initialize auth state from localStorage on page load
  useEffect(() => {
    console.log('Initializing auth from localStorage');
    refreshAuthState();
  }, [refreshAuthState]);

  // Handle connection to Stacks wallet
  const connectWallet = useCallback(() => {
    console.log('Connecting wallet...');
    showConnect({
      appDetails: {
        name: 'Mixmi Profile',
        icon: window.location.origin + '/icon.png',
      },
      redirectTo: '/',
      onFinish: () => {
        // Check if user is signed in after connect dialog closes
        if (userSession.isUserSignedIn()) {
          const userData = userSession.loadUserData();
          const address = userData.profile.stxAddress.mainnet;
          
          console.log('Wallet connection finished with address:', address);
          
          // Persist to localStorage for page reloads
          localStorage.setItem('mixmi-wallet-connected', 'true');
          localStorage.setItem('mixmi-wallet-address', address);
          
          setIsAuthenticated(true);
          setUserAddress(address);
        }
      },
      userSession,
    });
  }, []);

  // Handle disconnection from Stacks wallet
  const disconnectWallet = useCallback(() => {
    console.log('Disconnecting wallet...');
    // Clear localStorage
    localStorage.removeItem('mixmi-wallet-connected');
    localStorage.removeItem('mixmi-wallet-address');
    
    // Clear state
    setIsAuthenticated(false);
    setUserAddress(null);
  }, []);

  // Direct debug methods for browser console
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).forceAuthRefresh = refreshAuthState;
      
      (window as any).debugAuth = () => {
        console.group('🔑 Auth Debug Info');
        console.log('Auth State:', { isAuthenticated, userAddress, isInitialized });
        console.log('localStorage wallet-connected:', localStorage.getItem('mixmi-wallet-connected'));
        console.log('localStorage wallet-address:', localStorage.getItem('mixmi-wallet-address'));
        console.log('userSession.isUserSignedIn():', userSession.isUserSignedIn());
        console.groupEnd();
        return 'Auth debug info logged to console';
      };
      
      (window as any).directAuth = (address?: string) => {
        const stxAddress = address || 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';
        console.log(`Setting direct auth with address ${stxAddress}`);
        
        localStorage.setItem('mixmi-wallet-connected', 'true');
        localStorage.setItem('mixmi-wallet-address', stxAddress);
        
        setIsAuthenticated(true);
        setUserAddress(stxAddress);
        
        return 'Auth state directly set. Refresh profile page to see changes.';
      };
    }
  }, [isAuthenticated, userAddress, isInitialized, refreshAuthState]);

  return {
    isAuthenticated,
    userAddress,
    connectWallet,
    disconnectWallet,
    isInitialized,
    refreshAuthState,
  };
}; 