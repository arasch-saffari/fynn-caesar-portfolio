import React, { useState, useEffect } from 'react';
import { ContentData } from '../types';
import { IMPRESSUM_TEXT, DATENSCHUTZ_TEXT } from '../constants';
import { X, ExternalLink, Mail, Copy, Check, PlayCircle, Scale, Shield } from 'lucide-react';

interface ModalProps {
  data: ContentData;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState<'impressum' | 'privacy' | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeLegalDoc) {
          setActiveLegalDoc(null); // Close legal modal first if open
      } else if (e.key === 'Escape') {
          onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, activeLegalDoc]);

  // Determine colors based on style - 90s Rave Palette
  let borderColor = 'border-white';
  let bgColor = 'bg-black';
  let textColor = 'text-white';
  let accentColor = 'text-white';
  let buttonHover = 'hover:bg-white/20';
  let shadowColor = 'rgba(255,255,255,0.5)';

  switch (data.style) {
    case 'illustration':
      borderColor = 'border-lime-400';
      textColor = 'text-lime-400';
      accentColor = 'text-lime-300';
      buttonHover = 'hover:bg-lime-400/20 hover:shadow-[0_0_15px_rgba(163,230,53,0.6)] hover:border-lime-300';
      shadowColor = 'rgba(163,230,53,0.8)';
      break;
    case 'music':
      borderColor = 'border-fuchsia-500';
      textColor = 'text-fuchsia-400';
      accentColor = 'text-fuchsia-300';
      buttonHover = 'hover:bg-fuchsia-500/20 hover:shadow-[0_0_15px_rgba(217,70,239,0.6)] hover:border-fuchsia-400';
      shadowColor = 'rgba(217,70,239,0.8)';
      break;
    case 'band':
      borderColor = 'border-yellow-400';
      textColor = 'text-yellow-400';
      accentColor = 'text-yellow-200';
      buttonHover = 'hover:bg-yellow-400/20 hover:shadow-[0_0_15px_rgba(250,204,21,0.6)] hover:border-yellow-300';
      shadowColor = 'rgba(250,204,21,0.8)';
      break;
    case 'contact':
      borderColor = 'border-pink-500';
      textColor = 'text-pink-500';
      accentColor = 'text-pink-300';
      buttonHover = 'hover:bg-pink-500/20 hover:shadow-[0_0_15px_rgba(236,72,153,0.6)] hover:border-pink-400';
      shadowColor = 'rgba(236,72,153,0.8)';
      break;
  }

  const handleCopy = () => {
      navigator.clipboard.writeText(data.description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // Helper to determine subtitle text
  const getSubtitle = () => {
      if (data.style === 'band') return 'D.I.Y. Acid Folk';
      if (data.style === 'illustration') return 'PSYCHODELIC INK';
      if (data.style === 'music') return 'INSIGHT FREQUENCIES';
      if (data.style === 'contact') return 'BE CONNECTED';
      return 'DATA DECODED';
  };

  // Helper to determine if subtitle should be large
  const isLargeSubtitle = data.style === 'band' || data.style === 'illustration' || data.style === 'music' || data.style === 'contact';

  // If a legal document is active, show the Legal Overlay instead/on top
  if (activeLegalDoc) {
      const legalText = activeLegalDoc === 'impressum' ? IMPRESSUM_TEXT : DATENSCHUTZ_TEXT;
      const legalTitle = activeLegalDoc === 'impressum' ? 'IMPRESSUM' : 'DATENSCHUTZ';
      
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
             style={{
                 paddingTop: 'calc(1rem + env(safe-area-inset-top))',
                 paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
             }}>
             <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col border-2 border-white bg-black shadow-[0_0_50px_rgba(255,255,255,0.2)] font-pixel overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/30 bg-gray-900/50">
                    <h2 className="text-white text-lg md:text-xl tracking-widest">{legalTitle}</h2>
                    <button 
                        onClick={() => setActiveLegalDoc(null)}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 text-gray-300 font-terminal text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                    {legalText}
                </div>
             </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300"
         style={{
             paddingTop: 'calc(1rem + env(safe-area-inset-top))',
             paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
         }}>
         
      <div 
        className={`relative w-full max-w-lg max-h-[90vh] flex flex-col border-4 ${borderColor} ${bgColor} font-pixel overflow-hidden rounded-sm mb-4`}
        style={{ boxShadow: `0 0 50px ${shadowColor}` }}
      >
        
        {/* Scanline decoration inside modal */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />

        {/* Header - Fixed at top */}
        <div className="relative p-6 pb-2 shrink-0 z-10 bg-inherit">
            <button 
            onClick={onClose}
            className={`absolute top-2 right-2 p-2 hover:bg-white/20 transition-colors z-20 rounded ${textColor}`}
            aria-label="Close"
            >
            <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center">
                <h2 className={`text-lg md:text-3xl text-center glitch-effect ${textColor} mb-2 uppercase tracking-widest font-bold drop-shadow-md`}>
                {data.title}
                </h2>
                <div className={`font-terminal uppercase ${accentColor} ${isLargeSubtitle ? 'text-sm md:text-xl tracking-[0.2em] font-bold mt-1' : 'text-[10px] tracking-[0.5em] opacity-70'} drop-shadow-sm`}>
                    {getSubtitle()}
                </div>
            </div>
             <div className={`w-full h-0.5 ${textColor} opacity-50 mt-4 bg-current`} />
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto p-6 pt-2 flex flex-col items-center gap-6 overscroll-contain">
            {data.style === 'contact' ? (
                <>
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-pink-500 blur-xl opacity-40 animate-pulse"></div>
                        <Mail className={`relative w-16 h-16 md:w-20 md:h-20 ${textColor} animate-bounce`} />
                    </div>
                    
                    <div className="flex flex-col gap-4 items-center w-full">
                        <div className="text-center space-y-2">
                             <p className="font-pixel text-white text-xs md:text-base tracking-wider">OPEN FOR INQUIRIES</p>
                             <p className="font-terminal text-pink-300 text-sm md:text-lg tracking-widest">BOOKING // COLLABORATIONS // COMMISSIONS</p>
                        </div>
                        
                        {/* Email & Copy Button - Responsive Container */}
                        <div className="flex w-full gap-2">
                            {/* Mail Link */}
                            <a 
                                href={`mailto:${data.description}`}
                                className={`flex-1 min-w-0 p-4 border-2 ${borderColor} bg-black/50 hover:bg-pink-500 hover:text-white transition-all text-center flex items-center justify-center cursor-pointer hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] group`}
                            >
                                <span className="font-terminal text-lg md:text-2xl lg:text-3xl font-bold text-pink-300 group-hover:text-white tracking-wider truncate max-w-full block">
                                    {data.description}
                                </span>
                            </a>

                            {/* Copy Button */}
                            <button
                                onClick={handleCopy}
                                className={`shrink-0 p-4 border-2 ${borderColor} bg-black/50 hover:bg-pink-500 hover:text-white transition-all flex items-center justify-center cursor-pointer`}
                                title="Copy to clipboard"
                            >
                                {copied ? <Check className="w-5 h-5 md:w-6 md:h-6 text-green-400 bg-white rounded-full p-0.5" /> : <Copy className={`w-5 h-5 md:w-6 md:h-6 ${textColor} hover:text-white`} />}
                            </button>
                        </div>
                        
                        <p className={`font-terminal text-xs h-4 ${copied ? 'text-lime-400' : 'text-transparent'} transition-colors`}>
                            ADDRESS COPIED TO CLIPBOARD
                        </p>
                    </div>

                    {/* Legal Buttons inside content - Simplified Visibility */}
                    <div className={`flex flex-wrap gap-4 md:gap-6 mt-4 pt-4 border-t ${borderColor} w-full justify-center opacity-70`}>
                        <button 
                            onClick={() => setActiveLegalDoc('impressum')}
                            className={`group flex items-center gap-2 text-[10px] md:text-xs font-terminal text-gray-400 hover:${textColor} transition-colors uppercase tracking-widest`}
                        >
                            <Scale className="w-3 h-3" />
                            <span className="group-hover:underline underline-offset-4">Impressum</span>
                        </button>
                        <button 
                            onClick={() => setActiveLegalDoc('privacy')}
                            className={`group flex items-center gap-2 text-[10px] md:text-xs font-terminal text-gray-400 hover:${textColor} transition-colors uppercase tracking-widest`}
                        >
                            <Shield className="w-3 h-3" />
                            <span className="group-hover:underline underline-offset-4">Datenschutz</span>
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Increased font size, weight, line-height and max-width for better readability */}
                    <p className={`font-terminal text-xl md:text-3xl leading-snug tracking-wide font-bold ${accentColor} text-center max-w-2xl drop-shadow-md whitespace-pre-line`}>
                        {data.description}
                    </p>
                    <div className="flex flex-col w-full gap-3 mt-2 relative z-10 pb-4">
                        {data.links.map((link, idx) => (
                        <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`group flex items-center justify-between p-3 md:p-4 border-2 ${borderColor} ${buttonHover} transition-all uppercase tracking-wider text-xs md:text-base ${textColor} hover:scale-[1.02] active:scale-95 shadow-lg bg-black/50`}
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
            
            <div className="mt-auto text-[10px] text-center opacity-50 font-terminal pb-2 text-white">
                PRESS [ESC] OR CLICK X TO CLOSE
            </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;