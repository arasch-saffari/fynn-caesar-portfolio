import React, { useState, useEffect } from 'react';
import { Heart, Target, Gamepad2, Zap, LockOpen } from 'lucide-react';

interface IntroScreenProps {
  onStart: () => void;
}

// Minimal Pixel Art SVGs
const Alien1 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 11 8" className={className} fill="currentColor">
    <path d="M2 0h7v1H2V0zm-1 1h1v1H1V1zm9 0h1v1h-1V1zM0 2h1v1H0V2zm10 0h1v1h-1V2zM0 3h3v2H0V3zm8 0h3v2H8V3zM3 3h1v1H3V3zm4 0h1v1H7V3zm-4 2h1v1H3V5zm4 0h1v1H7V5zm-4 1h1v1H2V6zm1 0h1v1H3V6zm3 0h1v1H7V6zm-2 0h1v1H5V6zm3 0h1v1H8V6zm-7 1h1v1H1V7zm8 0h1v1H9V7z" />
  </svg>
);

const HeartPixel = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 10 9" className={className} fill="currentColor">
    <path d="M2 0h2v1h2V0h2v1h1v2h1v3H9v1H8v1H7v1H5v-1H4v-1H3v-1H1V6H0V3h1V1h1V0z" />
  </svg>
);

const PatternRow = ({ 
  Icon, 
  color, 
  direction = 'left', 
  speed = 'duration-[20s]' 
}: { 
  Icon: React.FC<{className?: string}>, 
  color: string, 
  direction?: 'left' | 'right',
  speed?: string
}) => {
  const items = Array.from({ length: 20 }); 
  return (
    <div className="flex w-full overflow-hidden py-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
      <div className={`flex shrink-0 gap-12 ${direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'} ${speed}`}>
        {items.map((_, i) => (
          <Icon key={i} className={`w-12 h-12 md:w-16 md:h-16 ${color} drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]`} />
        ))}
        {items.map((_, i) => (
          <Icon key={`dup-${i}`} className={`w-12 h-12 md:w-16 md:h-16 ${color} drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]`} />
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
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 flex flex-col justify-center items-center opacity-30 select-none pointer-events-none">
         <div className="w-[120%] -rotate-6 scale-110 flex flex-col gap-8">
            <PatternRow Icon={HeartPixel} color="text-pink-500" direction="left" speed="duration-[30s]" />
            <PatternRow Icon={Alien1} color="text-purple-400" direction="right" speed="duration-[25s]" />
            <PatternRow Icon={HeartPixel} color="text-red-500" direction="left" speed="duration-[28s]" />
         </div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center gap-6 md:gap-12 p-4 w-full max-w-4xl">
        
        {/* Main Title Block - Stacked Layout */}
        <div className="flex flex-col items-center justify-center w-full mix-blend-screen">
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
          <span className="block text-pink-300 mt-6 tracking-[0.5em] font-terminal text-lg md:text-2xl uppercase opacity-80">
              Spread The Love
          </span>
        </div>

        {/* Gamified Mission Instructions - Mechanics Focused */}
        <div className="flex flex-col gap-4 bg-pink-950/40 border-2 border-pink-500/30 p-4 md:p-8 backdrop-blur-md w-full animate-in slide-in-from-bottom-10 fade-in duration-1000 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="text-center font-terminal text-pink-200 text-lg md:text-2xl tracking-widest border-b border-pink-500/30 pb-3 mb-2 uppercase">
                // SYSTEM INSTRUCTIONS
            </div>
            
            {/* Instructions Grid */}
            <div className="grid grid-cols-3 gap-4 text-center items-start">
                {/* Step 1: Aim (Updated from Dodge) */}
                <div className="flex flex-col items-center gap-3 group">
                    <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-black/40 rounded-full border border-pink-500/20 group-hover:border-pink-500/80 transition-colors">
                        <Gamepad2 className="w-6 h-6 md:w-8 md:h-8 text-cyan-400 group-hover:scale-110 transition-transform animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-pixel text-[9px] md:text-xs text-white mb-1">AIM & LOOK</span>
                        <span className="font-terminal text-[10px] md:text-xs text-white/50 hidden sm:block">MOUSE / TOUCH</span>
                    </div>
                </div>

                {/* Step 2: Shoot (Clarified controls) */}
                <div className="flex flex-col items-center gap-3 group">
                    <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-black/40 rounded-full border border-pink-500/20 group-hover:border-pink-500/80 transition-colors">
                        <Zap className="w-6 h-6 md:w-8 md:h-8 text-pink-500 fill-current group-hover:scale-110 transition-transform animate-bounce" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-pixel text-[9px] md:text-xs text-white mb-1">SEND LOVE</span>
                        <span className="font-terminal text-[10px] md:text-xs text-white/50 hidden sm:block">CLICK / SPACE</span>
                    </div>
                </div>

                {/* Step 3: Unlock */}
                <div className="flex flex-col items-center gap-3 group">
                     <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-black/40 rounded-full border border-pink-500/20 group-hover:border-pink-500/80 transition-colors">
                        <LockOpen className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-pixel text-[9px] md:text-xs text-white mb-1">UNLOCK MEMORIES</span>
                        <span className="font-terminal text-[10px] md:text-xs text-white/50 hidden sm:block">DISCOVER PROJECTS</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Start Button */}
        <div className={`transition-all duration-1000 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <button
            onClick={onStart}
            className="group relative px-10 py-5 md:px-16 md:py-6 bg-black border-2 border-pink-500 hover:border-pink-300 transition-all overflow-hidden rounded-full shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_40px_rgba(236,72,153,0.6)]"
          >
            <div className="absolute inset-0 bg-pink-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left mix-blend-overlay"></div>
            
            <div className="relative flex flex-col items-center gap-2">
                <span className="flex items-center gap-3 text-lg md:text-2xl font-pixel text-white group-hover:text-white transition-colors">
                <Target className="w-5 h-5 md:w-6 md:h-6 fill-current animate-pulse" />
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