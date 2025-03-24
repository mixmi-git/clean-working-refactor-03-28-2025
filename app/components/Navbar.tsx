import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';

interface NavbarProps {
  isAuthenticated: boolean;
  isLoading?: boolean;
  onLoginToggle: () => void;
  statusMessage?: string;
}

export function Navbar({ isAuthenticated, isLoading = false, onLoginToggle, statusMessage }: NavbarProps) {
  // Dev mode check
  const isDev = process.env.NODE_ENV === 'development';
  
  // For dev mode only - force toggle authentication
  const forceAuthToggle = () => {
    if (typeof window !== 'undefined' && (window as any).toggleAuth) {
      (window as any).toggleAuth();
    }
  };
  
  return (
    <header className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <a href="/" className="h-8 w-auto relative">
            <img
              src="/images/logos/Logotype_Main.svg"
              alt="mixmi"
              className="h-8 w-auto"
            />
          </a>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status message - shows when available */}
          {statusMessage && (
            <div className="text-xs text-cyan-400 animate-pulse mr-2">
              {statusMessage}
            </div>
          )}
          
          {/* Dev toggle button - only visible in development */}
          {isDev && (
            <Button
              onClick={forceAuthToggle}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              DEV: {isAuthenticated ? 'Disable Auth' : 'Enable Auth'}
            </Button>
          )}
          
          {/* Auth button - always visible */}
          <Button
            onClick={onLoginToggle}
            className="relative z-20 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>{isAuthenticated ? 'Disconnecting...' : 'Connecting...'}</span>
              </span>
            ) : (
              <span>{isAuthenticated ? '✓ Disconnect Wallet' : '🔑 Connect Wallet'}</span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
} 