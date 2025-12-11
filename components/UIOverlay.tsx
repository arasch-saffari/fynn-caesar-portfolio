import React, { useEffect } from 'react';
import { Menu, Mail, X, Gamepad2, Headphones, Palette, Users, Lock, Unlock, Heart, RefreshCcw } from 'lucide-react';
import { EntityType, GameState } from '../types';

interface UIOverlayProps {
  gameState: GameState;
  collectedItems: EntityType[];
  onToggleMenu: () => void;
  onOpenContent: (type: EntityType) => void;
  onReplay: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, collectedItems, onToggleMenu, onOpenContent, onReplay }) => {
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


  const menuItems = [
    { label: 'RESUME GAME', icon: Gamepad2, action: onToggleMenu, color: 'text-white' },
    { label: 'ILLUSTRATION', icon: Palette, action: () => onOpenContent(EntityType.ENEMY_ILLUSTRATION), color: 'text-green-400' },
    { label: 'MUSIC', icon: Headphones, action: () => onOpenContent(EntityType.ENEMY_MUSIC), color: 'text-purple-400' },
    { label: 'BAND PROJECT', icon: Users, action: () => onOpenContent(EntityType.ENEMY_BAND), color: 'text-yellow-400' },
    { label: 'CONTACT', icon: Mail, action: () => onOpenContent(EntityType.BOSS_MAIL), color: 'text-pink-500' },
  ];

  return (
    <>
      {/* HUD - Heads Up Display */}
      <div className="fixed inset-0 z-30 pointer-events-none p-4 flex flex-col justify-between">
        
        {/* Top Bar: Progress & Menu */}
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col gap-1">
             <div className="text-[10px] md:text-xs font-pixel text-pink-300/80 mix-blend-difference">
               HEARTS COLLECTED
             </div>
             {/* Progress Icons */}
             <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm p-2 border border-pink-500/20 rounded-lg">
                <div className={`transition-all duration-500 ${hasIllustration ? 'text-pink-500 scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'text-white/20'}`}>
                    <Heart className={`w-6 h-6 ${hasIllustration ? 'fill-current' : ''}`} />
                </div>
                <div className={`transition-all duration-500 ${hasMusic ? 'text-pink-500 scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'text-white/20'}`}>
                    <Heart className={`w-6 h-6 ${hasMusic ? 'fill-current' : ''}`} />
                </div>
                <div className={`transition-all duration-500 ${hasBand ? 'text-pink-500 scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'text-white/20'}`}>
                    <Heart className={`w-6 h-6 ${hasBand ? 'fill-current' : ''}`} />
                </div>
                
                {/* Lock Status */}
                <div className="w-px h-6 bg-white/20 mx-1"></div>
                
                {allCollected ? (
                     <div className="text-pink-500 animate-pulse drop-shadow-[0_0_10px_rgba(236,72,153,0.8)] flex items-center gap-1">
                         <Unlock className="w-5 h-5" />
                         <span className="font-pixel text-[8px] hidden md:inline">LOVE UNLOCKED</span>
                     </div>
                ) : (
                     <div className="text-white/30 flex items-center gap-1">
                         <Lock className="w-5 h-5" />
                     </div>
                )}
             </div>
          </div>
          
          <button 
            onClick={onToggleMenu}
            className="pointer-events-auto bg-black/50 backdrop-blur-md border border-white/20 p-2 hover:bg-white/20 transition-all group rounded"
          >
            {isMenuOpen ? <X className="w-6 h-6 text-red-500" /> : <Menu className="w-6 h-6 text-white group-hover:text-pink-400" />}
          </button>
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-end">
          {/* Desktop Controls */}
          <div className="hidden md:block text-pink-500/50 font-pixel text-xs">
            [WASD] MOVE • [SPACE] LOVE
          </div>
          
          {/* Mobile Controls Hint */}
          <div className="block md:hidden text-pink-500/50 font-pixel text-[10px] animate-pulse">
             TOUCH & DRAG TO SHARE LOVE
          </div>
          
          {/* Direct Contact Button */}
          <button 
            onClick={() => onOpenContent(EntityType.BOSS_MAIL)}
            className={`pointer-events-auto flex items-center gap-2 backdrop-blur-md border px-4 py-2 transition-all group animate-pulse
                ${allCollected 
                    ? 'bg-pink-600 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.6)] hover:bg-pink-500' 
                    : 'bg-pink-900/50 border-pink-500/30 hover:bg-pink-800/50'
                }`}
          >
             <Mail className={`w-5 h-5 ${allCollected ? 'text-white' : 'text-pink-300'}`} />
             <span className={`font-pixel text-xs ${allCollected ? 'text-white font-bold' : 'text-pink-300'} hidden md:inline`}>
                 {allCollected ? 'CHANNEL OPEN' : 'CONTACT'}
             </span>
          </button>
        </div>
      </div>
      
      {/* WIN SCREEN OVERLAY - Interactive */}
      {isWin && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 pointer-events-auto animate-in fade-in duration-1000">
             <div className="flex flex-col items-center gap-8">
                 <div className="text-center space-y-4">
                     <h1 className="font-pixel text-3xl md:text-5xl text-white drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] animate-pulse">
                         LOVE FREQUENCY
                     </h1>
                     <h2 className="font-pixel text-xl md:text-3xl text-pink-400">
                         ESTABLISHED
                     </h2>
                 </div>
                 
                 <div className="flex flex-col gap-4 w-full max-w-xs">
                     <button 
                        onClick={() => onOpenContent(EntityType.BOSS_MAIL)}
                        className="bg-pink-600 hover:bg-pink-500 text-white font-pixel py-4 px-8 border-4 border-white shadow-[0_0_30px_rgba(236,72,153,0.6)] hover:scale-105 transition-transform flex items-center justify-center gap-3"
                     >
                         <Mail className="w-6 h-6" />
                         SEND LOVE
                     </button>
                     
                     <button 
                        onClick={onReplay}
                        className="bg-black hover:bg-white/10 text-pink-300 font-pixel py-3 px-6 border border-pink-500/50 hover:border-pink-300 flex items-center justify-center gap-3 transition-colors"
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
        <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md border-2 border-green-500/50 bg-black p-6 relative overflow-hidden">
            {/* Menu Decor */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-[scanline_2s_linear_infinite]" />
            
            <h2 className="font-pixel text-2xl text-center text-green-500 mb-8 glitch-effect">SYSTEM MENU</h2>
            
            <div className="flex flex-col gap-4">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  className="group flex items-center justify-between p-4 border border-white/10 hover:border-white/50 hover:bg-white/5 transition-all"
                >
                  <span className={`font-pixel text-sm md:text-base ${item.color} group-hover:translate-x-2 transition-transform`}>
                    {item.label}
                  </span>
                  <item.icon className={`w-5 h-5 ${item.color} opacity-50 group-hover:opacity-100`} />
                </button>
              ))}
            </div>

            <div className="mt-8 text-center font-terminal text-gray-600 text-xs">
              SELECT MODULE TO LOAD
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UIOverlay;