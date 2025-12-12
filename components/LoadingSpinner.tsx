import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black gap-6">
      <div className="relative">
        <div className="absolute inset-0 bg-pink-500 blur-xl opacity-20 animate-pulse"></div>
        <Loader2 className="w-16 h-16 text-pink-500 animate-spin relative z-10" />
      </div>
      <div className="flex flex-col items-center gap-2">
         <span className="font-pixel text-white text-xl md:text-2xl animate-pulse tracking-widest">
            LOADING SYSTEM
         </span>
         <span className="font-terminal text-pink-400 text-sm md:text-base tracking-[0.5em]">
            INITIALIZING ASSETS...
         </span>
      </div>
    </div>
  );
};

export default LoadingSpinner;