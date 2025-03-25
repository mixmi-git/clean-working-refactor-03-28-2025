'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Copy, ExternalLink, Instagram, Edit } from 'lucide-react';
import { FaYoutube, FaSpotify, FaSoundcloud, FaLinkedinIn } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { SiTiktok } from 'react-icons/si';
import { ProfileData, SocialLink as SocialLinkType } from '@/types';
import { EditableField } from '../ui/editable-field';
import { HoverControls, EditButtonControl } from '../ui/hover-controls';
import { Button } from '../ui/button';
import { SocialLinksEditor } from './SocialLinksEditor';
import { ProfileInfoEditor } from './ProfileInfoEditor';

interface PersonalInfoSectionProps {
  profile: ProfileData;
  isAuthenticated?: boolean;
  onUpdateProfile?: (field: keyof ProfileData, value: any) => void;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  profile,
  isAuthenticated = false,
  onUpdateProfile
}) => {
  // State to control social links editor modal
  const [isSocialLinksEditorOpen, setIsSocialLinksEditorOpen] = useState(false);
  
  // State to control profile info editor modal
  const [isProfileInfoEditorOpen, setIsProfileInfoEditorOpen] = useState(false);
  
  // Social media icon mapping
  const getSocialIcon = (platform: string) => {
    const iconSize = 18;
    const iconStyle = { color: '#e4e4e7' }; // Softer white color (gray-200 equivalent)
    
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <FaYoutube size={iconSize} style={iconStyle} />;
      case 'instagram':
        return <Instagram size={iconSize} className="text-gray-200" />;
      case 'twitter':
        return <FaXTwitter size={iconSize} style={iconStyle} />;
      case 'linkedin':
        return <FaLinkedinIn size={iconSize} style={iconStyle} />;
      case 'spotify':
        return <FaSpotify size={iconSize} style={iconStyle} />;
      case 'soundcloud':
        return <FaSoundcloud size={iconSize} style={iconStyle} />;
      case 'tiktok':
        return <SiTiktok size={iconSize} style={iconStyle} />;
      default:
        return <span className="text-xs text-gray-200">{platform && platform.length > 0 ? platform[0].toUpperCase() : '?'}</span>;
    }
  };

  // Handle profile image change
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result && onUpdateProfile) {
        onUpdateProfile('image', e.target.result.toString());
      }
    };
    
    reader.readAsDataURL(file);
  };

  // Handle social links update
  const handleSocialLinksUpdate = (links: SocialLinkType[]) => {
    if (onUpdateProfile) {
      onUpdateProfile('socialLinks', links);
    }
  };
  
  // Handle profile info update
  const handleProfileInfoUpdate = (updates: { name: string; title: string; bio: string }) => {
    if (onUpdateProfile) {
      onUpdateProfile('name', updates.name);
      onUpdateProfile('title', updates.title);
      onUpdateProfile('bio', updates.bio);
    }
  };
  
  // Clipboard functionality for wallet address
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="py-6 md:py-8 lg:py-10 w-full">
      <div className="flex flex-col md:flex-row items-center md:items-center gap-8 md:gap-12">
        {/* Profile picture */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 overflow-hidden rounded-full">
          <Image
            src={profile.image || 'https://via.placeholder.com/192/1a202c/718096?text=Profile'}
            alt={profile.name}
            width={192}
            height={192}
            className="w-full h-full object-cover"
          />
          
          {isAuthenticated && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
              <label htmlFor="profile-image" className="cursor-pointer">
                <div className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 16v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1" />
                    <path d="M17 9v7" />
                    <path d="M12.5 3.5a2.12 2.12 0 0 1 3 3L9 13l-4 1 1-4Z" />
                  </svg>
                </div>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          )}
        </div>
        
        {/* Profile text info */}
        <div className="flex-1 text-center flex flex-col items-center justify-center">
          <div className="mb-8 relative group">
            <div className="mb-1">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-cyan-300">
                {profile.name || "Your Name"}
              </h1>
            </div>
            
            <div>
              <h2 className="text-base md:text-xl text-gray-300 mt-2">
                {profile.title || "What You Do"}
              </h2>
            </div>
            
            {isAuthenticated && (
              <button 
                onClick={() => setIsProfileInfoEditorOpen(true)}
                className="absolute -right-8 top-1/2 transform -translate-y-1/2 bg-gray-800/70 hover:bg-gray-700 text-white p-1.5 rounded-full transition-colors opacity-100 md:opacity-70 md:group-hover:opacity-100"
                aria-label="Edit profile info"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="mb-8 max-w-2xl w-full">
            <p className="text-xs md:text-sm leading-relaxed text-gray-300">
              {profile.bio || "Tell your story here..."}
            </p>
          </div>
          
          {/* Social links */}
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {profile.socialLinks && profile.socialLinks.length > 0 ? (
              // Display actual social links if they exist
              profile.socialLinks.map((link: SocialLinkType, index: number) => (
                <a
                  key={`${link.platform}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                  aria-label={link.platform}
                >
                  {getSocialIcon(link.platform)}
                </a>
              ))
            ) : (
              // Display placeholder icons when no social links exist
              <>
                <div className="inline-flex items-center justify-center p-2 bg-gray-800/60 rounded-full cursor-default opacity-60">
                  <Instagram size={18} className="text-gray-400" />
                </div>
                <div className="inline-flex items-center justify-center p-2 bg-gray-800/60 rounded-full cursor-default opacity-60">
                  <FaYoutube size={18} className="text-gray-400" />
                </div>
                <div className="inline-flex items-center justify-center p-2 bg-gray-800/60 rounded-full cursor-default opacity-60">
                  <FaXTwitter size={18} className="text-gray-400" />
                </div>
                <div className="inline-flex items-center justify-center p-2 bg-gray-800/60 rounded-full cursor-default opacity-60">
                  <FaSpotify size={18} className="text-gray-400" />
                </div>
              </>
            )}
            
            {isAuthenticated && (
              <EditButtonControl
                onEdit={() => setIsSocialLinksEditorOpen(true)}
                label="Edit Links"
                isAuthenticated={isAuthenticated}
                className="p-2 rounded-full"
              >
                <div className="w-[18px] h-[18px] flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full transition-colors">
                  <span className="text-xs text-gray-300">+</span>
                </div>
              </EditButtonControl>
            )}
          </div>
          
          {/* Social Links Editor Modal */}
          <SocialLinksEditor
            isOpen={isSocialLinksEditorOpen}
            onClose={() => setIsSocialLinksEditorOpen(false)}
            socialLinks={profile.socialLinks || []}
            onSave={handleSocialLinksUpdate}
          />
          
          {/* Profile Info Editor Modal */}
          <ProfileInfoEditor
            isOpen={isProfileInfoEditorOpen}
            onClose={() => setIsProfileInfoEditorOpen(false)}
            profile={profile}
            onSave={handleProfileInfoUpdate}
          />
          
          {/* Wallet address display - now inside the right column */}
          {profile.walletAddress && (
            <div className="w-full max-w-xs mx-auto px-3 py-2 bg-gray-800/50 rounded-lg flex items-center justify-between border border-gray-700/50 mt-4">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-300 truncate">
                  {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
                </div>
                {isAuthenticated && (
                  <button
                    onClick={() => onUpdateProfile?.('showWalletAddress', !(profile.showWalletAddress ?? true))}
                    className="text-xs text-gray-500 hover:text-gray-400"
                  >
                    {profile.showWalletAddress === false ? 'Show publicly' : 'Hide publicly'}
                  </button>
                )}
                {isAuthenticated && profile.showWalletAddress === false && (
                  <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">Hidden</span>
                )}
              </div>
              
              <button
                onClick={() => copyToClipboard(profile.walletAddress || '')}
                className="text-gray-400 hover:text-gray-300 p-1"
                aria-label="Copy wallet address"
              >
                {copied ? (
                  <span className="text-xs text-green-500">Copied!</span>
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PersonalInfoSection; 