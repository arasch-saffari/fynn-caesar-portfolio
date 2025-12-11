import React, { useEffect } from 'react';
import { Menu, Mail, X, Gamepad2, Headphones, Palette, Users, Lock, Unlock, Heart, RefreshCcw, Zap } from 'lucide-react';
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
      <div className="fixed inset-0 z-30 pointer-events-none p-4 md:p-8 flex flex-col justify-between">
        
        {/* Top Bar: Progress & Menu */}
        <div className="flex justify-between items-start w-full">
          {/* Top Left: Stats */}
          <div className="flex flex-col gap-2 pointer-events-auto bg-black/80 backdrop-blur-md p-3 rounded-lg border-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)] transform hover:scale-105 transition-transform">
             <div className="flex items-center gap-2 mb-1 border-b border-pink-500/50 pb-1">
                 <Heart className="w-4 h-4 text-pink-500 fill-current animate-pulse" />
                 <span className="text-xs font-pixel text-pink-300">LOVE SCORE</span>
             </div>
             
             {/* Score Counter */}
             <div className="font-terminal text-2xl md:text-3xl text-white tracking-widest leading-none">
                 {score.toString().padStart(6, '0')}
             </div>
             
             {/* Progress Icons */}
             <div className="flex items-center gap-2 pt-1">
                <div className={`transition-all duration-500 ${hasIllustration ? 'text-green-400 scale-110 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'text-white/20'}`}>
                    <Palette className="w-5 h-5" />
                </div>
                <div className={`transition-all duration-500 ${hasMusic ? 'text-purple-400 scale-110 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]' : 'text-white/20'}`}>
                    <Headphones className="w-5 h-5" />
                </div>
                <div className={`transition-all duration-500 ${hasBand ? 'text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-white/20'}`}>
                    <Users className="w-5 h-5" />
                </div>
                
                {/* Lock Status */}
                <div className="w-px h-5 bg-white/20 mx-1"></div>
                
                {allCollected ? (
                     <div className="text-pink-500 animate-pulse drop-shadow-[0_0_10px_rgba(236,72,153,0.8)] flex items-center gap-1">
                         <Unlock className="w-4 h-4" />
                     </div>
                ) : (
                     <div className="text-white/30 flex items-center gap-1">
                         <Lock className="w-4 h-4" />
                     </div>
                )}
             </div>
          </div>
          
          {/* Top Right: Menu */}
          <button 
            onClick={onToggleMenu}
            className="pointer-events-auto bg-black/80 backdrop-blur-md border-2 border-white hover:border-pink-500 p-3 shadow-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all group rounded-lg hover:scale-110 active:scale-95"
          >
            {isMenuOpen ? <X className="w-8 h-8 text-pink-500" /> : <Menu className="w-8 h-8 text-white group-hover:text-pink-400" />}
          </button>
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-end">
          {/* Bottom Left: Controls Help */}
          <div className="bg-black/80 backdrop-blur-md p-3 rounded-lg border-l-4 border-pink-500 shadow-lg">
             {/* Desktop Controls */}
            <div className="hidden md:flex flex-col gap-1">
                 <div className="flex items-center gap-2 font-pixel text-xs text-pink-300">
                    <Gamepad2 className="w-4 h-4" /> CONTROLS
                 </div>
                 <div className="font-terminal text-sm text-white/80">
                    MOUSE = AIM <br/> SPACE/CLICK = FIRE
                 </div>
            </div>
            {/* Mobile Controls Hint */}
            <div className="block md:hidden">
                 <div className="font-pixel text-[10px] text-pink-300 animate-pulse">
                     TOUCH & DRAG TO FIRE
                 </div>
            </div>
          </div>
          
          {/* Bottom Right: Direct Contact Button */}
          <button 
            onClick={() => onOpenContent(EntityType.BOSS_MAIL)}
            className={`pointer-events-auto flex items-center gap-3 backdrop-blur-md border-2 px-6 py-3 transition-all group rounded-lg hover:scale-105 active:scale-95 shadow-xl
                ${allCollected 
                    ? 'bg-pink-600 border-white hover:bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.8)] animate-pulse' 
                    : 'bg-black/80 border-pink-500/50 hover:border-pink-500 hover:bg-black'
                }`}
          >
             <Mail className={`w-6 h-6 ${allCollected ? 'text-white' : 'text-pink-500 group-hover:text-white transition-colors'}`} />
             <span className={`font-pixel text-sm md:text-base ${allCollected ? 'text-white font-bold' : 'text-pink-500 group-hover:text-white transition-colors'}`}>
                 {allCollected ? 'CHANNEL OPEN' : 'CONTACT'}
             </span>
          </button>
        </div>
      </div>
      
      {/* WIN SCREEN OVERLAY - Interactive */}
      {isWin && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 pointer-events-auto animate-in fade-in duration-1000">
             <div className="flex flex-col items-center gap-8 bg-black/90 p-8 border-4 border-pink-500 rounded-2xl shadow-[0_0_50px_rgba(236,72,153,0.5)]">
                 <div className="text-center space-y-4">
                     <h1 className="font-pixel text-3xl md:text-5xl text-white drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] animate-pulse">
                         LOVE FREQUENCY
                     </h1>
                     <h2 className="font-pixel text-xl md:text-3xl text-pink-400">
                         ESTABLISHED
                     </h2>
                     <p className="font-terminal text-xl text-gray-300">
                         TOTAL SCORE: {score}
                     </p>
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
                        className="bg-black hover:bg-white/10 text-pink-300 font-pixel py-3 px-6 border-2 border-pink-500/50 hover:border-pink-300 flex items-center justify-center gap-3 transition-colors"
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
          <div className="w-full max-w-md border-2 border-green-500/50 bg-black p-6 relative overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            {/* Menu Decor */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-[scanline_2s_linear_infinite]" />
            
            <h2 className="font-pixel text-2xl text-center text-green-500 mb-8 glitch-effect">SYSTEM MENU</h2>
            
            <div className="flex flex-col gap-4">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  className="group flex items-center justify-between p-4 border border-white/10 hover:border-green-500 hover:bg-green-900/20 transition-all"
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