import { AppConfig, UserSession, showConnect } from '@stacks/connect'
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

// Development mode flag for logging only
const DEV_MODE = process.env.NODE_ENV === 'development';

// Global state to track connection attempts
let connectionInProgress = false;
let connectionAttemptTimestamp = 0;

// Add a centralized toggleAuth function for development use
if (typeof window !== 'undefined' && DEV_MODE) {
  (window as any).toggleAuth = () => {
    console.log('🔄 Development auth toggle requested');
    
    // Check current state in localStorage
    const isCurrentlyAuthenticated = localStorage.getItem('mixmi-wallet-connected') === 'true';
    
    if (isCurrentlyAuthenticated) {
      // Handle logout - clear authentication data
      console.log('🔓 Dev toggle: Clearing auth data');
      
      // Clear all auth-related localStorage items
      const keysToRemove = Object.keys(localStorage).filter(key => 
        (key.includes('blockstack') || 
        key.includes('stacks') ||
        key.includes('authResponse') ||
        key.includes('mixmi-wallet-connected') ||
        key.includes('mixmi-wallet-address') ||
        key.includes('mixmi-wallet-accounts') ||
        key.includes('mixmi-last-auth-check'))
      );
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Error removing ${key}:`, e);
        }
      });
      
      // Set view mode
      localStorage.setItem('profile_mode', 'view');
      
      // Sign out from userSession
      if (userSession.isUserSignedIn()) {
        userSession.signUserOut('');
      }
      
      console.log('🔓 Dev toggle: Auth cleared');
    } else {
      // Handle login - set dummy authentication data
      console.log('🔒 Dev toggle: Setting mock auth data');
      
      // Create a dummy Stacks address
      const mockAddress = 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';
      
      // Set auth data in localStorage
      localStorage.setItem('mixmi-wallet-connected', 'true');
      localStorage.setItem('mixmi-wallet-address', mockAddress);
      localStorage.setItem('mixmi-wallet-accounts', JSON.stringify([mockAddress]));
      localStorage.setItem('mixmi-last-auth-check', new Date().toISOString());
      localStorage.setItem('profile_mode', 'edit');
      
      console.log('🔒 Dev toggle: Mock auth data set');
    }
    
    // Return the new state for reference
    return !isCurrentlyAuthenticated;
  };
  
  // Also set a flag variable for components to check
  (window as any).DEV_FORCE_AUTH = false;
}

// Helper function to get the current account from the Stacks wallet
const getCurrentAccount = async (userSession: UserSession): Promise<string[]> => {
  if (typeof window === 'undefined') return [];
  
  try {
    // @ts-ignore - window.StacksProvider is added by the Stacks wallet
    if (window.StacksProvider) {
      // @ts-ignore
      const accounts = await window.StacksProvider.getAccounts?.();
      return accounts && accounts.length > 0 ? accounts : [];
    }
    return [];
  } catch (error) {
    console.error('Error getting current account from Stacks wallet:', error);
    return [];
  }
};

// Add storage key for account profile mapping
const ACCOUNT_PROFILE_MAP_KEY = 'mixmi_account_profile_map';

// Helper function to get the profile ID for a specific wallet address
export const getProfileIdForAddress = (address: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Get the account-to-profile mapping from localStorage
    const mapString = localStorage.getItem(ACCOUNT_PROFILE_MAP_KEY);
    const map = mapString ? JSON.parse(mapString) : {};
    
    // Return the profile ID for this address, or null if not found
    return map[address] || null;
  } catch (error) {
    console.error('Error getting profile ID for address:', error);
    return null;
  }
};

// Helper function to associate a wallet address with a profile ID
export const setProfileIdForAddress = (address: string, profileId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Get the current mapping
    const mapString = localStorage.getItem(ACCOUNT_PROFILE_MAP_KEY);
    const map = mapString ? JSON.parse(mapString) : {};
    
    // Add or update the mapping
    map[address] = profileId;
    
    // Save back to localStorage
    localStorage.setItem(ACCOUNT_PROFILE_MAP_KEY, JSON.stringify(map));
    
    // Dispatch an event to notify components of the account change
    const event = new CustomEvent('account-changed', {
      detail: { address, profileId }
    });
    window.dispatchEvent(event);
  } catch (error) {
    console.error('Error setting profile ID for address:', error);
  }
};

// Helper function to check for session data in localStorage
const checkLocalStorageForSession = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    const sessionData = localStorage.getItem('blockstack-session');
    return !!sessionData;
  } catch (error) {
    console.error('Error checking localStorage for session:', error);
    return false;
  }
};

// Helper function to check if Stacks wallet is installed
const checkHasStacksWallet = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    // @ts-ignore - window.StacksProvider is added by the Stacks wallet
    return !!window.StacksProvider;
  } catch (error) {
    console.error('Error checking for Stacks wallet:', error);
    return false;
  }
};

// Add Leather wallet interfaces
declare global {
  interface Window {
    StacksProvider?: any;
    LeatherProvider?: {
      getAccounts: () => Promise<string[]>;
    };
  }
}

// Function to get available accounts from Leather wallet
const getLeatherAccounts = async (): Promise<string[]> => {
  if (typeof window === 'undefined') return [];
  
  try {
    // Check for Leather provider
    if (window.LeatherProvider?.getAccounts) {
      const accounts = await window.LeatherProvider.getAccounts();
      return accounts;
    }
    return [];
  } catch (error) {
    console.error('Error getting Leather accounts:', error);
    return [];
  }
};

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);

  // Function to connect wallet
  const connectWallet = useCallback(async () => {
    console.log("🔄 Connect wallet called at:", new Date().toISOString());
    
    // Set the tracking variable to prevent multiple connection attempts
    if (connectionInProgress) {
      console.log("⚠️ Connection already in progress, aborting");
      return;
    }
    
    // Track whether a connection is in progress
    connectionInProgress = true;
    connectionAttemptTimestamp = Date.now();
    console.log("🔌 Connection attempt started at:", new Date().toISOString());
    
    try {
      // Check if the user is already signed in
      if (userSession.isUserSignedIn()) {
        console.log("✅ User already signed in");
        setIsAuthenticated(true);
        const userData = userSession.loadUserData();
        setUserAddress(userData.profile.stxAddress.mainnet);
        connectionInProgress = false;
        return;
      }
      
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
                
                // Store critical data in localStorage for persistence across page reloads
                localStorage.setItem('mixmi-wallet-connected', 'true');
                localStorage.setItem('mixmi-wallet-provider', 'connect');
                localStorage.setItem('mixmi-wallet-accounts', JSON.stringify([address]));
                localStorage.setItem('mixmi-wallet-address', address);
                localStorage.setItem('mixmi-last-auth-check', new Date().toISOString());
                localStorage.setItem('profile_mode', 'edit');
                
                // Force page reload - simplest way to ensure clean state
                window.location.reload();
              } else if (userSession.isSignInPending()) {
                console.log("🔄 Handling pending sign in...");
                try {
                  const userData = await userSession.handlePendingSignIn();
                  const address = userData.profile.stxAddress.mainnet;
                  
                  console.log('✅ Pending sign in resolved! Address:', address);
                  
                  // Store for persistence
                  localStorage.setItem('mixmi-wallet-connected', 'true');
                  localStorage.setItem('mixmi-wallet-address', address);
                  localStorage.setItem('profile_mode', 'edit');
                  
                  // Force page reload
                  window.location.reload();
                } catch (e) {
                  console.error('Error handling pending sign in:', e);
                }
              } else {
                console.log("⚠️ Connect dialog finished but user not signed in");
              }
            } catch (error) {
              console.error("Error in onFinish callback:", error);
              
              // Even if there's an error, try to reload if there's data in localStorage
              if (localStorage.getItem('mixmi-wallet-connected') === 'true') {
                window.location.reload();
              }
            }
            
            connectionInProgress = false;
          },
          userSession: userSession,
        });
        
      } catch (error) {
        console.error("Error in wallet connection:", error);
        connectionInProgress = false;
      }
    } catch (error) {
      console.error("❌ Wallet connection error:", error);
      connectionInProgress = false;
    }
  }, []);

  // Make sure to console log when authentication state changes
  useEffect(() => {
    console.log("🔐 Auth state changed:", { 
      isAuthenticated, 
      userAddress,
      availableAccounts,
      currentAccount
    });
  }, [isAuthenticated, userAddress, availableAccounts, currentAccount]);

  // Add state for available accounts
  const [refreshCounter, setRefreshCounter] = useState(0)

  // Function to check auth status and update state
  const checkAuthStatus = useCallback(async () => {
    try {
      // First check: is the user signed in according to userSession
      if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData()
        console.log('Auth: User is signed in via session', userData)
        setIsAuthenticated(true)
        
        // Get the mainnet address from user data
        const mainnetAddress = userData.profile.stxAddress.mainnet
        setUserAddress(mainnetAddress)
        
        // Try to get the current account from the wallet - handle async properly
        try {
          const accounts = await getCurrentAccount(userSession)
          setCurrentAccount(accounts && accounts.length > 0 ? accounts[0] : null)
        } catch (accountError) {
          console.error('Error getting current account:', accountError)
          // Fallback to mainnet address
          setCurrentAccount(mainnetAddress)
        }
        
        // Update the profile ID mapping if needed
        const profileId = getProfileIdForAddress(mainnetAddress)
        if (!profileId) {
          // Create a new profile ID and associate it with this address
          const newProfileId = `profile_${Date.now()}`
          setProfileIdForAddress(mainnetAddress, newProfileId)
        }
        
        return
      }
      
      // Second check: look for blockstack-session data in localStorage
      if (typeof window !== 'undefined') {
        try {
          // Check when the last auth check was performed
          const lastAuthCheck = localStorage.getItem('mixmi-last-auth-check');
          const sessionData = localStorage.getItem('blockstack-session');
          
          // Check if we have recently verified auth status (within 10 minutes)
          const recentCheck = lastAuthCheck && 
            (new Date().getTime() - new Date(lastAuthCheck).getTime() < 10 * 60 * 1000);
          
          if (sessionData && (recentCheck || checkLocalStorageForSession())) {
            console.log('Auth: Found session data in localStorage');
            
            try {
              const parsed = JSON.parse(sessionData);
              if (parsed && parsed.userData && parsed.userData.profile) {
                const address = parsed.userData.profile.stxAddress?.mainnet;
                
                if (address) {
                  console.log('Auth: Restoring auth state from localStorage session');
                  setIsAuthenticated(true);
                  setUserAddress(address);
                  setCurrentAccount(address);
                  return;
                }
              }
            } catch (e) {
              console.error('Error parsing localStorage session:', e);
            }
          }
        } catch (e) {
          console.error('Auth: Error reading from localStorage:', e);
        }
      }
      
      // Third check: If we already have a userAddress set but isUserSignedIn is false
      // This handles edge cases where the session might not be detected but we know the user is connected
      if (userAddress) {
        console.log('Auth: User address exists but session not detected, keeping authenticated state');
        setIsAuthenticated(true);
        setCurrentAccount(userAddress);
        return;
      }
      
      // If none of the above checks pass, the user is not authenticated
      console.log('Auth: User is NOT signed in')
      setIsAuthenticated(false)
      setUserAddress(null)
      setCurrentAccount(null)
    } catch (error) {
      console.error('Auth: Error checking auth status', error)
      setIsAuthenticated(false)
      setUserAddress(null)
      setCurrentAccount(null)
    }
    setIsInitialized(true)
  }, [userAddress])

  // Force a refresh of the component state
  const forceRefresh = useCallback(() => {
    setRefreshCounter(prev => prev + 1)
  }, [])

  // Check for pending sign-ins and initialize auth state
  useEffect(() => {
    console.log('Auth: Initializing auth state')
    
    // Set a timeout to ensure we don't get stuck in loading state
    const initTimeout = setTimeout(() => {
      if (!isInitialized) {
        console.log('Auth: Forcing initialization after timeout')
        setIsInitialized(true)
      }
    }, 2000)
    
    // Clear any stale auth data on initial load
    // This ensures users always start in a logged-out state
    // unless they explicitly authenticate
    if (typeof window !== 'undefined') {
      const devMode = process.env.NODE_ENV === 'development';
      
      // In dev mode, force a clean state by removing any stale auth data
      if (devMode) {
        const keysToRemove = Object.keys(localStorage).filter(key => 
          (key.includes('blockstack') || 
          key.includes('stacks') ||
          key.includes('authResponse') ||
          key.includes('mixmi-last-auth-check')) &&
          // Don't remove content data
          !key.includes('mixmi_profile_data') &&
          !key.includes('mixmi_spotlight_items') &&
          !key.includes('mixmi_shop_items') &&
          !key.includes('mixmi_media_items') &&
          !key.includes('mixmi_sticker_data') &&
          !key.includes('mixmi_account_profile_map')
        );
        
        if (keysToRemove.length > 0) {
          console.log('Auth: Clearing stale auth data in development mode');
          keysToRemove.forEach(key => {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.error(`Error removing ${key}:`, e);
            }
          });
        }
      }
    }
    
    // Check if there's a pending sign-in to handle
    if (userSession.isSignInPending()) {
      console.log('Auth: Found pending sign-in, handling...')
      userSession.handlePendingSignIn()
        .then(userData => {
          console.log('Auth: Successfully handled pending sign-in', userData)
          setIsAuthenticated(true)
          setUserAddress(userData.profile.stxAddress.mainnet)
          setCurrentAccount(userData.profile.stxAddress.mainnet)
          setIsInitialized(true)
          clearTimeout(initTimeout)
        })
        .catch(error => {
          console.error('Auth: Error handling pending sign-in', error)
          setIsInitialized(true)
          clearTimeout(initTimeout)
        })
    } else {
      // No pending sign-in, just check current status
      checkAuthStatus().catch(err => {
        console.error('Error checking auth status:', err);
        setIsInitialized(true);
      });
      clearTimeout(initTimeout)
    }
    
    return () => {
      clearTimeout(initTimeout)
    }
  }, [checkAuthStatus, refreshCounter])

  // Add a polling mechanism to check for recent authentication
  useEffect(() => {
    // Only set up polling if we're actively trying to connect
    if (!connectionInProgress) return;
    
    console.log('Auth: Setting up connection polling');
    const pollInterval = setInterval(() => {
      // Stop polling if it's been more than 30 seconds since connection attempt
      const currentTime = Date.now();
      if (currentTime - connectionAttemptTimestamp > 30000) {
        console.log('Auth: Connection polling timeout reached');
        connectionInProgress = false;
        clearInterval(pollInterval);
        return;
      }

      console.log('Auth: Polling for authentication state...');
      // Re-check auth status
      try {
        if (userSession.isUserSignedIn()) {
          const userData = userSession.loadUserData();
          console.log('Auth: Polling detected successful sign-in!', userData);
          setIsAuthenticated(true);
          setUserAddress(userData.profile.stxAddress.mainnet);
          setCurrentAccount(userData.profile.stxAddress.mainnet);
          connectionInProgress = false;
          clearInterval(pollInterval);
        } else if (checkLocalStorageForSession()) {
          console.log('Auth: Polling found session data in localStorage');
          // Force a refresh to trigger a re-render and state re-check
          forceRefresh()
        }
      } catch (error) {
        console.error('Auth: Error during auth polling', error);
      }
    }, 1000); // Check every second
    
    return () => clearInterval(pollInterval);
  }, [checkAuthStatus, forceRefresh, refreshCounter]);

  const disconnectWallet = useCallback(() => {
    console.log('Auth: Disconnecting wallet...')
    try {
      // First clear all session data
      userSession.signUserOut('')  // Pass an empty string to prevent redirection issues
      
      // Manually clear any local storage data related to sessions
      if (typeof window !== 'undefined') {
        // Clear specific auth-related items
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.includes('blockstack') || 
          key.includes('stacks') ||
          key.includes('authResponse')
        );
        
        console.log('Auth: Clearing session data from localStorage:', keysToRemove);
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.error(`Error removing ${key}:`, e);
          }
        });
      }
      
      // Reset auth state
      setIsAuthenticated(false)
      setUserAddress(null)
      setCurrentAccount(null)
      
      // Force refresh to ensure UI updates
      setTimeout(() => {
        forceRefresh() // Ensure UI updates after disconnect
        console.log('Auth: Wallet disconnected and state refreshed!')
      }, 100);
    } catch (error) {
      console.error('Auth: Error disconnecting wallet', error)
      
      // Attempt recovery in case of failure
      setIsAuthenticated(false)
      setUserAddress(null)
      setCurrentAccount(null)
      forceRefresh()
    }
  }, [forceRefresh])

  // This function is called to check the current auth state
  const refreshAuthState = useCallback(() => {
    try {
      console.log('🔄 Refreshing auth state...');
      // Simplest check: see if userSession reports user is signed in
      const isSignedIn = userSession.isUserSignedIn();
      console.log(`👤 User signed in according to userSession: ${isSignedIn}`);
      
      // Also check localStorage for a recent wallet connection
      let hasWalletInLocalStorage = false;
      let storedAddress = '';
      if (typeof window !== 'undefined') {
        hasWalletInLocalStorage = localStorage.getItem('mixmi-wallet-connected') === 'true';
        storedAddress = localStorage.getItem('mixmi-wallet-address') || '';
        
        if (hasWalletInLocalStorage && storedAddress) {
          console.log('📦 Found wallet connection in localStorage:', storedAddress);
        }
      }
      
      // Set auth state based on userSession or localStorage
      if (isSignedIn || hasWalletInLocalStorage) {
        setIsAuthenticated(true);
        
        if (isSignedIn) {
          // Get address from userSession if available
          const userData = userSession.loadUserData();
          setUserAddress(userData.profile.stxAddress.mainnet);
        } else if (hasWalletInLocalStorage && storedAddress) {
          // Otherwise use address from localStorage
          setUserAddress(storedAddress);
        }
      } else {
        setIsAuthenticated(false);
        setUserAddress('');
      }
      
      // Mark as initialized
      setIsInitialized(true);
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      setIsInitialized(true);
    }
  }, []);

  // Make refreshAuthState globally available for other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshAuthState = refreshAuthState;
    }
    
    return () => {
      // Clean up when component unmounts
      if (typeof window !== 'undefined') {
        delete (window as any).refreshAuthState;
      }
    };
  }, [refreshAuthState]);

  // Function to switch between accounts
  const switchAccount = useCallback(async (address: string) => {
    if (!address) return;
    
    try {
      // Update current account
      setCurrentAccount(address);
      
      // Get or create profile ID for this account
      let profileId = getProfileIdForAddress(address);
      if (!profileId) {
        profileId = `profile_${address.slice(0, 10)}`;
        setProfileIdForAddress(address, profileId);
      }
      
      // Store the current account
      localStorage.setItem('current_account', address);
      
      // Emit an event that components can listen to
      const event = new CustomEvent('account-changed', {
        detail: { address, profileId }
      });
      window.dispatchEvent(event);
      
      console.log('🔄 Account switched:', { address, profileId });
    } catch (error) {
      console.error('Error switching accounts:', error);
    }
  }, []);

  // Effect to handle authentication state changes
  useEffect(() => {
    const handleAuthChange = async () => {
      if (isAuthenticated && userAddress) {
        // Get or create profile ID for this account
        let profileId = getProfileIdForAddress(userAddress);
        if (!profileId) {
          profileId = `profile_${userAddress.slice(0, 10)}`;
          setProfileIdForAddress(userAddress, profileId);
        }
        
        // Set current account
        setCurrentAccount(userAddress);
        
        // Get available accounts
        const accounts = await getCurrentAccount(userSession);
        setAvailableAccounts(accounts);
        
        // Emit account changed event
        const event = new CustomEvent('account-changed', {
          detail: { address: userAddress, profileId }
        });
        window.dispatchEvent(event);
        
        console.log('🔐 Auth state changed:', { userAddress, profileId, accounts });
      } else {
        // Clear account state when not authenticated
        setCurrentAccount(null);
        setAvailableAccounts([]);
      }
    };
    
    handleAuthChange();
  }, [isAuthenticated, userAddress]);

  // Effect to check for Leather accounts when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getLeatherAccounts().then(accounts => {
        if (accounts.length > 0) {
          setAvailableAccounts(accounts);
          
          // If no current account is set, use the first one
          if (!currentAccount) {
            const savedAccount = localStorage.getItem('mixmi-current-account');
            const accountToUse = savedAccount && accounts.includes(savedAccount) 
              ? savedAccount 
              : accounts[0];
            switchAccount(accountToUse);
          }
        }
      });
    }
  }, [isAuthenticated]);

  // Add additional debug helper
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
        
        console.log('  - mixmi-wallet-connected:', walletConnected);
        console.log('  - mixmi-wallet-provider:', walletProvider);
        console.log('  - mixmi-wallet-accounts:', walletAccounts);
        console.log('  - mixmi-wallet-address:', walletAddress);
        console.log('  - blockstack-session exists:', !!blockstackSession);
        console.log('  - profile_mode:', profileMode);
      } catch (e) {
        console.error('- Error reading localStorage:', e);
      }
      
      return 'Debug info logged to console';
    };
    
    // Add manual connect function
    (window as any).manualConnect = async () => {
      try {
        const { showConnect, AppConfig, UserSession } = await import('@stacks/connect');
        const appConfig = new AppConfig(['store_write']);
        
        showConnect({
          appDetails: {
            name: 'Mixmi Debug',
            icon: window.location.origin + '/favicon.ico',
          },
          redirectTo: window.location.origin,
          onFinish: () => {
            console.log('Manual connect finished');
            if (userSession.isUserSignedIn()) {
              const userData = userSession.loadUserData();
              console.log('Manual connect signed in:', userData);
              localStorage.setItem('mixmi-wallet-connected', 'true');
              localStorage.setItem('mixmi-wallet-address', userData.profile.stxAddress.mainnet);
              localStorage.setItem('profile_mode', 'edit');
              window.location.reload();
            } else {
              console.log('Manual connect did not sign in');
            }
          },
          userSession: userSession,
        });
        
        return 'Manual connect initiated';
      } catch (e: any) {
        console.error('Manual connect error:', e);
        return `Error: ${e.message || 'Unknown error'}`;
      }
    };
  }

  return {
    isAuthenticated,
    userAddress,
    connectWallet,
    disconnectWallet,
    refreshAuthState,
    isInitialized,
    availableAccounts,
    currentAccount,
    switchAccount,
    getProfileIdForAddress,
  }
}