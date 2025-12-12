import React, { useEffect } from 'react';
import { Menu, Mail, X, Gamepad2, Headphones, Palette, Users, RefreshCcw, Heart } from 'lucide-react';
import { EntityType, GameState } from '../types';

interface UIOverlayProps {
  gameState: GameState;
  collectedItems: EntityType[];
  score: number;
  onToggleMenu: () => void;
  onOpenContent: (type: EntityType) => void;
  onReplay: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, collectedItems, score, onToggleMenu, onOpenContent, onReplay }) => {
  if (gameState === 'INTRO') return null;

  const isMenuOpen = gameState === 'MENU_OPEN';
  const isWin = gameState === 'WIN';

  const hasIllustration = collectedItems.includes(EntityType.ENEMY_ILLUSTRATION);
  const hasMusic = collectedItems.includes(EntityType.ENEMY_MUSIC);
  const hasBand = collectedItems.includes(EntityType.ENEMY_BAND);
  const allCollected = hasIllustration && hasMusic && hasBand;

  // Replay via Enter key when in Win state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isWin) {
          onReplay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWin, onReplay]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
          onToggleMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, onToggleMenu]);


  const menuItems = [
    { label: 'RESUME GAME', icon: Gamepad2, action: onToggleMenu, color: 'text-white' },
    { label: 'MUSIC', icon: Headphones, action: () => onOpenContent(EntityType.ENEMY_MUSIC), color: 'text-fuchsia-400' },
    { label: 'BAND PROJECT', icon: Users, action: () => onOpenContent(EntityType.ENEMY_BAND), color: 'text-yellow-400' },
    { label: 'ILLUSTRATION', icon: Palette, action: () => onOpenContent(EntityType.ENEMY_ILLUSTRATION), color: 'text-lime-400' },
    { label: 'CONTACT', icon: Mail, action: () => onOpenContent(EntityType.BOSS_MAIL), color: 'text-pink-500' },
  ];

  return (
    <>
      {/* HUD - Heads Up Display */}
      <div 
        className="fixed inset-0 z-30 pointer-events-none p-4 md:p-8 flex flex-col justify-between"
        style={{
            paddingTop: 'calc(1rem + env(safe-area-inset-top))',
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
            paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
            paddingRight: 'calc(1rem + env(safe-area-inset-right))',
        }}
      >
        
        {/* Top Bar: Progress & Menu */}
        <div className="flex justify-between items-start w-full">
          
          {/* Top Left: LOVE SCORE - 90s Rave Style */}
          <div className="pointer-events-auto flex flex-col items-start select-none filter drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]">
             {/* Header */}
             <div className="flex items-center gap-2 mb-1 pl-1">
                 <Heart className="w-3 h-3 md:w-4 md:h-4 text-pink-500 fill-pink-500 animate-pulse" />
                 <span className="font-pixel text-[10px] md:text-xs text-pink-400 tracking-[0.2em] uppercase" style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.8)' }}>
                    LOVE SCORE
                 </span>
             </div>
             
             {/* The Numbers - Gradient Fill & Bold */}
             <div className="font-pixel text-3xl md:text-5xl tracking-widest leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-pink-300 to-pink-600" style={{ WebkitTextStroke: '1px rgba(236,72,153,0.3)' }}>
                 {score.toString().padStart(4, '0')}
             </div>
          </div>
          
          {/* Top Right: Menu Button - Larger Hit Area for Mobile */}
          <button 
            onClick={onToggleMenu}
            className="pointer-events-auto bg-black/80 backdrop-blur-md border-2 border-white/50 hover:border-cyan-400 hover:text-cyan-400 text-white p-3 md:p-3 shadow-lg hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all group rounded-lg active:scale-95"
            aria-label="Open Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6 md:w-8 md:h-8" /> : <Menu className="w-6 h-6 md:w-8 md:h-8" />}
          </button>
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-end gap-4">
          {/* Bottom Left: Controls Help */}
          <div className="bg-black/80 backdrop-blur-md p-2 md:p-3 rounded-lg border-l-4 border-cyan-400 shadow-lg pointer-events-auto shrink-0">
             {/* Desktop Controls */}
            <div className="hidden lg:flex flex-col gap-1">
                 <div className="flex items-center gap-2 font-pixel text-xs text-cyan-300">
                    <Gamepad2 className="w-4 h-4" /> CONTROLS
                 </div>
                 <div className="font-terminal text-sm text-white/80">
                    MOUSE = AIM <br/> SPACE/CLICK = FIRE
                 </div>
            </div>
            {/* Mobile/Tablet Controls Hint - Visible below lg breakpoint */}
            <div className="block lg:hidden">
                 <div className="font-pixel text-[10px] text-cyan-300 animate-pulse whitespace-nowrap">
                     TOUCH & DRAG
                 </div>
            </div>
          </div>
          
          {/* Bottom Right: Direct Contact Button - Enhanced for Touch */}
          <button 
            onClick={() => onOpenContent(EntityType.BOSS_MAIL)}
            className={`pointer-events-auto flex items-center justify-center gap-2 md:gap-3 backdrop-blur-md border-2 px-5 py-3 md:px-6 md:py-3 transition-all group rounded-lg hover:scale-105 active:scale-95 shadow-xl min-w-[140px] md:min-w-0
                ${allCollected 
                    ? 'bg-pink-600 border-white hover:bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.8)] animate-pulse' 
                    : 'bg-black/80 border-pink-500 hover:border-pink-400 hover:shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                }`}
          >
             <Mail className={`w-5 h-5 md:w-6 md:h-6 ${allCollected ? 'text-white' : 'text-pink-500 group-hover:text-pink-400 transition-colors'}`} />
             <span className={`font-pixel text-xs md:text-base whitespace-nowrap ${allCollected ? 'text-white font-bold' : 'text-pink-500 group-hover:text-pink-400 transition-colors'}`}>
                 {allCollected ? 'OPEN FOR INQUIRIES' : 'CONTACT'}
             </span>
          </button>
        </div>
      </div>
      
      {/* WIN SCREEN OVERLAY */}
      {isWin && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 pointer-events-auto animate-in fade-in duration-1000">
             <div className="flex flex-col items-center gap-6 md:gap-8 bg-black p-6 md:p-8 border-4 border-pink-500 rounded-2xl shadow-[0_0_80px_rgba(236,72,153,0.6)] max-w-lg w-full relative overflow-hidden">
                 {/* Background Glow */}
                 <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-black to-purple-900/20 pointer-events-none" />

                 <div className="text-center space-y-3 md:space-y-4 relative z-10">
                     <h1 className="font-pixel text-2xl md:text-5xl text-white drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] animate-pulse">
                         LOVE FREQUENCY
                     </h1>
                     <h2 className="font-pixel text-lg md:text-3xl text-pink-400 tracking-widest">
                         ESTABLISHED
                     </h2>
                     <p className="font-terminal text-lg md:text-xl text-gray-300">
                         TOTAL SCORE: <span className="text-white text-2xl">{score}</span>
                     </p>
                 </div>
                 
                 <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
                     <button 
                        onClick={() => onOpenContent(EntityType.BOSS_MAIL)}
                        className="bg-pink-600 hover:bg-pink-500 text-white font-pixel py-4 px-6 md:px-8 border-4 border-white shadow-[0_0_30px_rgba(236,72,153,0.6)] hover:scale-105 transition-transform flex items-center justify-center gap-3 text-sm md:text-base"
                     >
                         <Mail className="w-5 h-5 md:w-6 md:h-6" />
                         SEND LOVE
                     </button>
                     
                     <button 
                        onClick={onReplay}
                        className="bg-black hover:bg-white/10 text-cyan-400 font-pixel py-4 px-6 border-2 border-cyan-500/50 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center gap-3 transition-all text-sm md:text-base"
                     >
                         <RefreshCcw className="w-4 h-4" />
                         REPLAY
                     </button>
                 </div>
             </div>
          </div>
      )}

      {/* System Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md border-2 border-lime-400 bg-black p-6 relative overflow-hidden shadow-[0_0_40px_rgba(163,230,53,0.3)]">
            {/* Menu Decor - Scanline */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-lime-500 to-transparent animate-[scanline_2s_linear_infinite]" />
            
            <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-white/20 pb-4">
                <h2 className="font-pixel text-xl md:text-2xl text-lime-400 glitch-effect tracking-widest">SYSTEM MENU</h2>
                <button 
                    onClick={onToggleMenu} 
                    className="text-lime-400 p-2 -mr-2 hover:text-white transition-colors"
                    aria-label="Close Menu"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            
            <div className="flex flex-col gap-3 md:gap-4">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  className="group flex items-center justify-between p-4 md:p-4 border border-white/10 hover:border-white bg-white/5 hover:bg-white/10 transition-all active:scale-[0.98] min-h-[60px]"
                >
                  <span className={`font-pixel text-sm md:text-base ${item.color} group-hover:translate-x-2 transition-transform tracking-wider`}>
                    {item.label}
                  </span>
                  <item.icon className={`w-6 h-6 ${item.color} opacity-70 group-hover:opacity-100 group-hover:shadow-[0_0_10px_currentColor]`} />
                </button>
              ))}
            </div>

            <div className="mt-8 text-center font-terminal text-gray-500 text-xs tracking-widest">
              SELECT MODULE TO LOAD
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UIOverlay;