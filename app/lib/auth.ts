import { AppConfig, UserSession, showConnect } from '@stacks/connect'
// Import modern methods
import { showConnect as legacyShowConnect } from '@stacks/connect'
import { useCallback, useEffect, useState } from 'react'

// Add interface for Stacks user data
interface StacksUserData {
  profile: {
    stxAddress: {
      mainnet: string;
      testnet: string;
    };
    // Add a property to store the currently selected account
    currentAccount?: string;
  };
}

// Extend UserSession type to include loadUserData
declare module '@stacks/connect' {
  interface UserSession {
    isSignInPending(): boolean;
    handlePendingSignIn(): Promise<StacksUserData>;
    isUserSignedIn(): boolean;
    loadUserData(): StacksUserData;
    signUserOut(redirectTo: string): void;
  }
}

// Create a single instance of UserSession to use across the app
const appConfig = new AppConfig(['store_write'])
const userSession = new UserSession({ appConfig })

// Add interface for modern API responses
interface ConnectResponse {
  addresses?: {
    stx?: Array<{
      address: string;
      publicKey?: string;
    }>;
    btc?: Array<{
      address: string;
      publicKey?: string;
    }>;
  };
}

// Development mode flag for logging only
const DEV_MODE = process.env.NODE_ENV === 'development';

// Global state to track connection attempts
let connectionInProgress = false;
let connectionAttemptTimestamp = 0;

// Modern connect API is only available in browser
let connect: (options?: any) => Promise<ConnectResponse>;
let request: (options?: any, method?: string, params?: any) => Promise<any>;
let disconnect: () => void;
let isConnected: () => boolean;

if (typeof window !== 'undefined') {
  try {
    // Dynamic imports for modern API
    const modernApi = require('@stacks/connect');
    connect = modernApi.connect;
    request = modernApi.request;
    disconnect = modernApi.disconnect;
    isConnected = modernApi.isConnected;
    
    if (DEV_MODE) {
      console.log('Modern Stacks wallet API loaded:', { 
        connect: !!connect,
        request: !!request, 
        disconnect: !!disconnect,
        isConnected: !!isConnected
      });
    }
  } catch (e) {
    console.error('Error loading modern Stacks wallet API:', e);
    // Fallback placeholders
    connect = async () => { 
      console.error('Modern connect API not available');
      return {} as ConnectResponse;
    };
    request = async () => {
      console.error('Modern request API not available');
      return null;
    };
    disconnect = () => {
      console.error('Modern disconnect API not available');
    };
    isConnected = () => false;
  }
}

// Add a centralized toggleAuth function for development use
if (typeof window !== 'undefined' && DEV_MODE) {
  // Make wallet connection debug helpers available
  (window as any).debugWalletConnection = () => {
    console.log('🔍 Wallet connection debug:');
    console.log('- userSession.isUserSignedIn():', userSession.isUserSignedIn());
    console.log('- userSession.isSignInPending():', userSession.isSignInPending());
    try {
      if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        console.log('- User data:', userData);
      } else {
        console.log('- No user data (not signed in)');
      }
    } catch (e) {
      console.error('- Error loading user data:', e);
    }
    
    // Check localStorage
    console.log('- localStorage items:');
    try {
      const walletConnected = localStorage.getItem('mixmi-wallet-connected');
      const walletProvider = localStorage.getItem('mixmi-wallet-provider');
      const walletAccounts = localStorage.getItem('mixmi-wallet-accounts');
      const walletAddress = localStorage.getItem('mixmi-wallet-address');
      const blockstackSession = localStorage.getItem('blockstack-session');
      const profileMode = localStorage.getItem('profile_mode');
      const isConnectedValue = isConnected();
      
      console.log('  - mixmi-wallet-connected:', walletConnected);
      console.log('  - mixmi-wallet-provider:', walletProvider);
      console.log('  - mixmi-wallet-accounts:', walletAccounts);
      console.log('  - mixmi-wallet-address:', walletAddress);
      console.log('  - blockstack-session exists:', !!blockstackSession);
      console.log('  - profile_mode:', profileMode);
      console.log('  - isConnected():', isConnectedValue);
    } catch (e) {
      console.error('- Error reading localStorage:', e);
    }
    
    return 'Debug info logged to console';
  };
  
  // Add manual connect function
  (window as any).manualConnect = async () => {
    try {
      console.log('🔄 Attempting modern connect call...');
      const response = await connect();
      console.log('📱 Connect response:', response);
      
      if (response?.addresses?.stx?.[0]?.address) {
        const address = response.addresses.stx[0].address;
        console.log('✅ Connected with address:', address);
        
        // Store in localStorage for compatibility with older code
        localStorage.setItem('mixmi-wallet-connected', 'true');
        localStorage.setItem('mixmi-wallet-address', address);
        localStorage.setItem('profile_mode', 'edit');
        
        console.log('Auth state set, reload page to see changes');
        return `Connected with address ${address}. Reload page to see changes.`;
      } else {
        console.log('❌ Connect failed - no address returned');
        return 'Connect failed - no address returned';
      }
    } catch (e: any) {
      console.error('Manual connect error:', e);
      return `Error: ${e.message || 'Unknown error'}`;
    }
  };
  
  // Add a direct manual authentication function
  (window as any).forceAuth = (address?: string) => {
    try {
      console.log('💪 Force authenticating...');
      
      // Use provided address or a default one
      const walletAddress = address || 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';
      
      // Set auth data in localStorage
      localStorage.setItem('mixmi-wallet-connected', 'true');
      localStorage.setItem('mixmi-wallet-address', walletAddress);
      localStorage.setItem('mixmi-wallet-accounts', JSON.stringify([walletAddress]));
      localStorage.setItem('mixmi-last-auth-check', new Date().toISOString());
      localStorage.setItem('profile_mode', 'edit');
      
      console.log('✅ Force auth completed with address:', walletAddress);
      console.log('Please reload the page to see changes take effect');
      
      return 'Auth forced successfully. Reload the page.';
    } catch (e) {
      console.error('Error forcing auth:', e);
      return 'Error forcing auth';
    }
  };
}

// Main authentication hook used throughout the app
export const useAuth = () => {
  // Track authentication state and user address
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  // Track more detailed state for debugging
  const [currentAccount, setCurrentAccount] = useState<string | null>(null)
  const [pendingConnect, setPendingConnect] = useState<boolean>(false)
  const [pendingSignIn, setPendingSignIn] = useState<boolean>(false)
  const [lastAuthCheck, setLastAuthCheck] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  
  // Force-refresh the auth state from localStorage
  const refreshAuthState = useCallback(() => {
    if (DEV_MODE) console.log("🔄 Refreshing auth state...");
    
    try {
      // First check if isConnected() reports true (modern API)
      const modernConnected = isConnected();
      
      // Also check localStorage for compatibility with older code
      const walletConnected = localStorage.getItem('mixmi-wallet-connected') === 'true';
      const walletAddress = localStorage.getItem('mixmi-wallet-address');
      
      // Update timestamp for debugging
      const timestamp = new Date().toISOString();
      localStorage.setItem('mixmi-last-auth-check', timestamp);
      setLastAuthCheck(timestamp);
      
      if (DEV_MODE) {
        console.log("Auth state refresh:", {
          modernConnected,
          walletConnected,
          walletAddress,
          timestamp
        });
      }
      
      // Set authenticated if either modern or legacy connection is detected
      if ((modernConnected || walletConnected) && walletAddress) {
        setIsAuthenticated(true);
        setUserAddress(walletAddress);
        setCurrentAccount(walletAddress);
        setAuthError(null);
      } else {
        setIsAuthenticated(false);
        setUserAddress(null);
        setCurrentAccount(null);
      }
      
      setIsInitialized(true);
      setPendingConnect(false);
      setPendingSignIn(false);
    } catch (e: any) {
      console.error("Error in refreshAuthState:", e);
      setAuthError(e.message || "Unknown error refreshing auth state");
      setIsInitialized(true);
      setPendingConnect(false);
      setPendingSignIn(false);
    }
  }, []);
  
  // Initialize auth state on component mount
  useEffect(() => {
    if (DEV_MODE) console.log("🔄 Initializing auth state...");
    refreshAuthState();
    
    // Check for pending sign-in (from redirect)
    if (userSession.isSignInPending()) {
      setPendingSignIn(true);
      if (DEV_MODE) console.log("🔄 Handling pending sign-in...");
      
      userSession.handlePendingSignIn()
        .then((userData) => {
          if (DEV_MODE) console.log("✅ Sign-in successful:", userData);
          const address = userData.profile.stxAddress.mainnet;
          
          // Store auth data for persistence across page reloads
          localStorage.setItem('mixmi-wallet-connected', 'true');
          localStorage.setItem('mixmi-wallet-address', address);
          localStorage.setItem('profile_mode', 'edit');
          
          setIsAuthenticated(true);
          setUserAddress(address);
          setCurrentAccount(address);
          setPendingSignIn(false);
          setAuthError(null);
        })
        .catch((err) => {
          console.error("❌ Error handling pending sign-in:", err);
          setAuthError(err.message || "Error handling pending sign-in");
          setPendingSignIn(false);
        });
    }
  }, [refreshAuthState]);
  
  // Connect wallet using modern API
  const connectWallet = useCallback(async () => {
    console.log("🔄 Connect wallet called at:", new Date().toISOString());
    
    // Prevent multiple connection attempts in quick succession
    const now = Date.now();
    if (connectionInProgress || (now - connectionAttemptTimestamp < 3000)) {
      console.log("⏳ Connect already in progress or too soon after last attempt");
      return;
    }
    
    connectionInProgress = true;
    connectionAttemptTimestamp = now;
    setPendingConnect(true);
    
    try {
      console.log("🔄 Using modern connect API...");
      
      // First try the modern connect approach
      const response = await connect({
        appDetails: {
          name: 'Mixmi',
          icon: window.location.origin + '/favicon.ico',
        },
      });
      
      console.log("✅ Connect response:", response);
      
      if (response?.addresses?.stx?.[0]?.address) {
        const address = response.addresses.stx[0].address;
        console.log("✅ Connected with address:", address);
        
        // Store critical data in localStorage for persistence
        localStorage.setItem('mixmi-wallet-connected', 'true');
        localStorage.setItem('mixmi-wallet-provider', 'connect');
        localStorage.setItem('mixmi-wallet-accounts', JSON.stringify([address]));
        localStorage.setItem('mixmi-wallet-address', address);
        localStorage.setItem('mixmi-last-auth-check', new Date().toISOString());
        localStorage.setItem('profile_mode', 'edit');
        
        // Update React state directly - no need for page reload
        setIsAuthenticated(true);
        setUserAddress(address);
        setCurrentAccount(address);
        setAuthError(null);
        
        console.log("✅ Authentication state updated, wallet connected!");
      } else {
        console.log("❌ No address found in connect response");
        setAuthError("No address returned from wallet");
      }
    } catch (error: any) {
      console.error("❌ Error connecting wallet:", error);
      setAuthError(error.message || "Error connecting wallet");
      
      // Try fallback to showConnect for legacy wallets
      console.log("🔄 Falling back to legacy connect...");
      
      try {
        // Dynamically import minimal dependencies
        const { showConnect } = await import('@stacks/connect');
        
        console.log("🔧 Showing Stacks wallet connection dialog");
        
        showConnect({
          appDetails: {
            name: 'Mixmi',
            icon: window.location.origin + '/favicon.ico',
          },
          redirectTo: window.location.origin + '/integrated',
          onFinish: async () => {
            console.log('✅ Connect dialog finished, checking session...');
            
            try {
              // Check if user is signed in after connect dialog closes
              if (userSession.isUserSignedIn()) {
                const userData = userSession.loadUserData();
                const address = userData.profile.stxAddress.mainnet;
                
                console.log('✅ User signed in! Address:', address);
                
                // Store critical data in localStorage for persistence
                localStorage.setItem('mixmi-wallet-connected', 'true');
                localStorage.setItem('mixmi-wallet-provider', 'connect');
                localStorage.setItem('mixmi-wallet-accounts', JSON.stringify([address]));
                localStorage.setItem('mixmi-wallet-address', address);
                localStorage.setItem('mixmi-last-auth-check', new Date().toISOString());
                localStorage.setItem('profile_mode', 'edit');
                
                // Update React state directly - no need for page reload
                setIsAuthenticated(true);
                setUserAddress(address);
                setCurrentAccount(address);
                setAuthError(null);
                
                console.log('✅ Authentication state updated, wallet connected!');
              } else {
                console.log('❌ User not signed in after connect dialog');
                setAuthError("User not signed in after connect dialog");
              }
            } catch (err: any) {
              console.error('❌ Error in onFinish callback:', err);
              setAuthError(err.message || "Error in connect finish callback");
            }
          },
          userSession
        });
      } catch (fallbackError: any) {
        console.error("❌ Both modern and legacy connect failed:", fallbackError);
        setAuthError("Failed to connect wallet: " + (fallbackError.message || "Unknown error"));
      }
    } finally {
      connectionInProgress = false;
      setPendingConnect(false);
    }
  }, []);
  
  // Disconnect wallet - modern implementation
  const disconnectWallet = useCallback(() => {
    console.log("🔄 Disconnecting wallet...");
    
    try {
      // Use modern disconnect if available
      disconnect();
      
      // Also clear localStorage for compatibility
      localStorage.removeItem('mixmi-wallet-connected');
      localStorage.removeItem('mixmi-wallet-provider');
      localStorage.removeItem('mixmi-wallet-accounts');
      localStorage.removeItem('mixmi-wallet-address');
      localStorage.setItem('profile_mode', 'view');
      
      // Also try legacy signout
      if (userSession.isUserSignedIn()) {
        userSession.signUserOut('/integrated');
      }
      
      // Update React state
      setIsAuthenticated(false);
      setUserAddress(null);
      setCurrentAccount(null);
      
      console.log("✅ Wallet disconnected");
    } catch (error: any) {
      console.error("❌ Error disconnecting wallet:", error);
    }
  }, []);
  
  // Return values needed by components
  return {
    isAuthenticated,
    userAddress,
    connectWallet,
    disconnectWallet,
    refreshAuthState,
    isInitialized,
    currentAccount,
    pendingConnect,
    pendingSignIn,
    lastAuthCheck,
    authError
  }
}