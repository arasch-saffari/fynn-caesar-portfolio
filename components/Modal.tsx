import React, { useState, useEffect } from 'react';
import { ContentData } from '../types';
import { X, ExternalLink, Mail, Copy, Check, PlayCircle } from 'lucide-react';

interface ModalProps {
  data: ContentData;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Determine colors based on style
  let borderColor = 'border-white';
  let bgColor = 'bg-gray-900';
  let textColor = 'text-white';
  let accentColor = 'text-white';
  let buttonHover = 'hover:bg-white/10';

  switch (data.style) {
    case 'illustration':
      borderColor = 'border-green-400';
      bgColor = 'bg-black';
      textColor = 'text-green-400';
      accentColor = 'text-green-300';
      buttonHover = 'hover:bg-green-900/30';
      break;
    case 'music':
      borderColor = 'border-purple-500';
      bgColor = 'bg-indigo-950';
      textColor = 'text-purple-300';
      accentColor = 'text-purple-200';
      buttonHover = 'hover:bg-purple-900/30';
      break;
    case 'band':
      borderColor = 'border-yellow-400';
      bgColor = 'bg-gray-900';
      textColor = 'text-yellow-400';
      accentColor = 'text-yellow-200';
      buttonHover = 'hover:bg-yellow-900/30';
      break;
    case 'contact':
      borderColor = 'border-pink-500';
      bgColor = 'bg-pink-950';
      textColor = 'text-pink-300';
      accentColor = 'text-pink-200';
      buttonHover = 'hover:bg-pink-900/30';
      break;
  }

  const handleCopy = () => {
      navigator.clipboard.writeText("booking@fynn-caesar.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300"
         style={{
             paddingTop: 'calc(1rem + env(safe-area-inset-top))',
             paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
         }}>
      <div className={`relative w-full max-w-lg max-h-[90vh] flex flex-col border-4 ${borderColor} ${bgColor} shadow-[0_0_50px_rgba(0,0,0,0.8)] font-pixel overflow-hidden rounded-sm`}>
        
        {/* Scanline decoration inside modal */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />

        {/* Header - Fixed at top */}
        <div className="relative p-6 pb-2 shrink-0 z-10 bg-inherit">
            <button 
            onClick={onClose}
            className="absolute top-2 right-2 p-2 hover:bg-white/20 transition-colors z-20 rounded"
            aria-label="Close"
            >
            <X className={`w-6 h-6 ${textColor}`} />
            </button>

            <div className="flex flex-col items-center">
                <h2 className={`text-lg md:text-3xl text-center glitch-effect ${textColor} mb-2 uppercase tracking-widest font-bold`}>
                {data.title}
                </h2>
                <div className={`text-[10px] font-terminal uppercase tracking-[0.5em] ${accentColor} opacity-70`}>
                    DATA DECODED
                </div>
            </div>
             <div className="w-full h-0.5 bg-current opacity-50 mt-4" />
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto p-6 pt-2 flex flex-col items-center gap-6 overscroll-contain">
            {data.style === 'contact' ? (
                <>
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-pink-500 blur-xl opacity-20 animate-pulse"></div>
                        <Mail className={`relative w-16 h-16 md:w-20 md:h-20 ${textColor} animate-bounce`} />
                    </div>
                    
                    <div className="flex flex-col gap-4 items-center w-full">
                        <div className="text-center space-y-2">
                             <p className="font-pixel text-white text-xs md:text-base">CHANNEL OPEN FOR INQUIRIES</p>
                             <p className="font-terminal text-gray-400 text-xs">BOOKING // COLLABORATIONS // COMMISSIONS</p>
                        </div>
                        
                        <div className="flex w-full max-w-sm gap-2">
                            {/* Mail Link */}
                            <a 
                                href={`mailto:${data.description}`}
                                className="flex-1 p-4 border-2 border-pink-500 bg-black/50 hover:bg-pink-500 hover:text-white transition-all text-center flex items-center justify-center cursor-pointer hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] group"
                            >
                                <span className="font-terminal text-sm md:text-xl text-pink-300 group-hover:text-white tracking-wider truncate">
                                    {data.description}
                                </span>
                            </a>

                            {/* Copy Button */}
                            <button
                                onClick={handleCopy}
                                className="shrink-0 p-4 border-2 border-pink-500 bg-black/50 hover:bg-pink-500 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check className="w-5 h-5 text-green-400 bg-white rounded-full p-0.5" /> : <Copy className="w-5 h-5 text-pink-300 hover:text-white" />}
                            </button>
                        </div>
                        
                        <p className={`font-terminal text-xs h-4 ${copied ? 'text-green-400' : 'text-transparent'} transition-colors`}>
                            ADDRESS COPIED TO CLIPBOARD
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <p className={`font-terminal text-base md:text-xl leading-relaxed ${accentColor} text-center max-w-md`}>
                        {data.description}
                    </p>
                    <div className="flex flex-col w-full gap-3 mt-2 relative z-10 pb-4">
                        {data.links.map((link, idx) => (
                        <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`group flex items-center justify-between p-3 md:p-4 border-2 ${borderColor} ${buttonHover} transition-all uppercase tracking-wider text-xs md:text-base ${textColor} hover:scale-[1.02] active:scale-95 shadow-lg`}
                        >
                            <span className="font-bold flex items-center gap-2">
                                <PlayCircle className="w-4 h-4 md:w-5 md:h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {link.label}
                            </span>
                            <ExternalLink className="w-4 h-4 md:w-5 md:h-5 opacity-70 group-hover:opacity-100" />
                        </a>
                        ))}
                    </div>
                </>
            )}
            
            <div className="mt-auto text-[10px] text-center opacity-50 font-terminal pb-2">
                PRESS [ESC] OR CLICK X TO CLOSE
            </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;