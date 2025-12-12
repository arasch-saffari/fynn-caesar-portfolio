import React, { useState, useEffect } from 'react';
import { Target, Gamepad2, Heart, Unlock } from 'lucide-react';

interface IntroScreenProps {
  onStart: () => void;
}

// --- PIXEL ART ASSETS (16x16 Grid) ---
// Enhanced with more details and better definition

const PixelSmiley = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" shapeRendering="crispEdges">
    <path fillRule="evenodd" clipRule="evenodd" d="M6 1H10V2H12V3H13V4H14V6H15V10H14V12H13V13H12V14H10V15H6V14H4V13H3V12H2V10H1V6H2V4H3V3H4V2H6V1ZM5 5H7V7H5V5ZM9 5H11V7H9V5ZM4 10H5V11H6V12H10V11H11V10H12V11H11V12H10V13H6V12H5V11H4V10Z" />
  </svg>
);

const PixelHeart = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" shapeRendering="crispEdges">
    <path fillRule="evenodd" clipRule="evenodd" d="M8 3H6V2H3V5H2V8H3V10H4V11H5V12H6V13H7V14H8V15H9V14H10V13H11V12H12V11H13V10H14V8H15V5H14V2H11V3H10V4H8V3ZM11 5H13V7H11V5Z" />
  </svg>
);

const PixelEye = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" shapeRendering="crispEdges">
    <path fillRule="evenodd" clipRule="evenodd" d="M2 8L3 6L5 4L8 3L11 4L13 6L14 8L13 10L11 12L8 13L5 12L3 10L2 8ZM8 5L6 8L8 11L10 8L8 5ZM8 7V9H9V7H8Z" />
  </svg>
);

const PatternRow = ({ 
  Icon, 
  color, 
  direction = 'left', 
  speed = 'duration-[20s]',
  opacity = 'opacity-100'
}: { 
  Icon: React.FC<{className?: string}>, 
  color: string, 
  direction?: 'left' | 'right',
  speed?: string,
  opacity?: string
}) => {
  // Increased count to ensure coverage on large screens with tighter gaps
  const items = Array.from({ length: 80 }); 
  
  return (
    <div className={`flex w-full overflow-hidden py-2 md:py-4 ${opacity} hover:opacity-100 transition-opacity duration-1000 ease-in-out`}>
      {/* Reduced gap for a denser, more cohesive pattern */}
      <div className={`flex shrink-0 gap-4 md:gap-8 ${direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'} ${speed}`}>
        {items.map((_, i) => (
          <Icon key={i} className={`w-6 h-6 md:w-8 md:h-8 ${color}`} />
        ))}
        {/* Duplicate for seamless loop */}
        {items.map((_, i) => (
          <Icon key={`dup-${i}`} className={`w-6 h-6 md:w-8 md:h-8 ${color}`} />
        ))}
      </div>
    </div>
  );
};

const IntroScreen: React.FC<IntroScreenProps> = ({ onStart }) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Enable Start via Enter key
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter' && showButton) {
              onStart();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart, showButton]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black overflow-hidden h-[100dvh]">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 flex flex-col justify-center items-center select-none pointer-events-none overflow-hidden">
         {/* Tilted Container */}
         <div className="w-[120%] -rotate-[6deg] flex flex-col gap-4 md:gap-8 origin-center">
            
            {/* Row 1: Acid Smileys (Fast Left) */}
            <PatternRow 
                Icon={PixelSmiley} 
                color="text-yellow-400" 
                direction="left" 
                speed="duration-[60s]" 
                opacity="opacity-30"
            />
            
            {/* Row 2: Pixel Hearts (Slow Right) */}
            <PatternRow 
                Icon={PixelHeart} 
                color="text-pink-500" 
                direction="right" 
                speed="duration-[100s]" 
                opacity="opacity-40"
            />
            
            {/* Row 3: Mystic Eyes (Medium Left) */}
            <PatternRow 
                Icon={PixelEye} 
                color="text-purple-400" 
                direction="left" 
                speed="duration-[80s]" 
                opacity="opacity-30"
            />
         </div>
      </div>
      
      {/* Vignette Overlay to focus center */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center gap-6 md:gap-10 p-4 w-full max-w-5xl h-full justify-center">
        
        {/* Main Title Block - Stacked Layout - Adjusted Text Sizes */}
        <div className="flex flex-col items-center justify-center w-full mix-blend-screen shrink-0">
          <h1 className="flex flex-col items-center leading-[0.85] tracking-tighter">
            {/* Top Line */}
            <span className="font-pixel text-[13vw] sm:text-7xl md:text-8xl lg:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-pink-300 via-white to-pink-500 animate-pulse drop-shadow-[0_0_20px_rgba(236,72,153,0.6)]">
              FYNN
            </span>
            {/* Bottom Line */}
            <span className="font-pixel text-[13vw] sm:text-7xl md:text-8xl lg:text-9xl text-transparent bg-clip-text bg-gradient-to-t from-pink-500 via-white to-pink-300 animate-pulse drop-shadow-[0_0_20px_rgba(236,72,153,0.6)]" style={{ animationDelay: '0.5s' }}>
              CAESAR
            </span>
          </h1>
          <span className="block text-pink-300 mt-6 md:mt-8 tracking-[0.3em] md:tracking-[0.6em] font-terminal text-xl md:text-3xl uppercase opacity-80 font-bold">
              Spread The Love
          </span>
        </div>

        {/* Gamified Mission Instructions - Mechanics Focused */}
        <div className="flex flex-col gap-6 bg-pink-950/40 border-2 border-pink-500/30 p-6 md:p-8 backdrop-blur-md w-full animate-in slide-in-from-bottom-10 fade-in duration-1000 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] max-w-3xl">
            <div className="text-center font-terminal text-pink-200 text-lg md:text-2xl tracking-widest border-b border-pink-500/30 pb-4 mb-2 uppercase">
                // SYSTEM INSTRUCTIONS
            </div>
            
            {/* Instructions Grid */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 text-center items-start">
                {/* Step 1: Aim */}
                <div className="flex flex-col items-center gap-3 md:gap-4 group">
                    <div className="w-12 h-12 md:w-20 md:h-20 flex items-center justify-center bg-black/40 rounded-full border border-pink-500/20 group-hover:border-pink-500/80 transition-colors">
                        <Gamepad2 className="w-6 h-6 md:w-10 md:h-10 text-cyan-400 group-hover:scale-110 transition-transform animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-pixel text-[10px] md:text-sm text-white mb-2">AIM & LOOK</span>
                        <span className="font-terminal text-[10px] md:text-sm text-white/50 hidden sm:block">MOUSE / TOUCH</span>
                    </div>
                </div>

                {/* Step 2: Shoot */}
                <div className="flex flex-col items-center gap-3 md:gap-4 group">
                    <div className="w-12 h-12 md:w-20 md:h-20 flex items-center justify-center bg-black/40 rounded-full border border-pink-500/20 group-hover:border-pink-500/80 transition-colors">
                        <Heart className="w-6 h-6 md:w-10 md:h-10 text-pink-500 fill-current group-hover:scale-110 transition-transform animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-pixel text-[10px] md:text-sm text-white mb-2">SEND LOVE</span>
                        <span className="font-terminal text-[10px] md:text-sm text-white/50 hidden sm:block">CLICK / SPACE</span>
                    </div>
                </div>

                {/* Step 3: Unlock */}
                <div className="flex flex-col items-center gap-3 md:gap-4 group">
                     <div className="w-12 h-12 md:w-20 md:h-20 flex items-center justify-center bg-black/40 rounded-full border border-pink-500/20 group-hover:border-pink-500/80 transition-colors">
                        <Unlock className="w-6 h-6 md:w-10 md:h-10 text-yellow-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-pixel text-[10px] md:text-sm text-white mb-2">UNLOCK MEMORIES</span>
                        <span className="font-terminal text-[10px] md:text-sm text-white/50 hidden sm:block">DISCOVER PROJECTS</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Start Button */}
        <div className={`transition-all duration-1000 shrink-0 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <button
            onClick={onStart}
            className="group relative px-10 py-6 md:px-24 md:py-8 bg-black border-2 border-pink-500 hover:border-pink-300 transition-all overflow-hidden rounded-full shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_40px_rgba(236,72,153,0.6)]"
          >
            <div className="absolute inset-0 bg-pink-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left mix-blend-overlay"></div>
            
            <div className="relative flex flex-col items-center gap-2">
                <span className="flex items-center gap-4 text-xl md:text-3xl font-pixel text-white group-hover:text-white transition-colors">
                <Target className="w-6 h-6 md:w-8 md:h-8 fill-current animate-pulse" />
                START EXPERIENCE
                </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;