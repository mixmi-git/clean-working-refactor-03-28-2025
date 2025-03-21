'use client'

import Image from "next/image"

interface StickerDisplayProps {
  sticker?: {
    visible: boolean;
    image: string;
  };
}

export default function StickerDisplay({
  sticker = { 
    visible: true, 
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/daisy-blue-1sqZRfemKwLyREL0Eo89EfmQUT5wst.png" 
  }
}: StickerDisplayProps) {
  // If sticker is not visible, don't render anything
  if (!sticker.visible) {
    return null;
  }

  return (
    <div className="w-full flex justify-center mt-16 mb-12">
      <div className="w-32 h-32">
        <Image
          src={sticker.image}
          alt="Profile sticker"
          width={128}
          height={128}
          className="w-full h-full object-contain drop-shadow-lg"
          priority
          unoptimized
        />
      </div>
    </div>
  );
} 