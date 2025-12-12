import React, { useState, useCallback } from 'react';
import GameEngine from './components/GameEngine';
import IntroScreen from './components/IntroScreen';
import CRTOverlay from './components/CRTOverlay';
import Modal from './components/Modal';
import UIOverlay from './components/UIOverlay';
import { GameState, EntityType } from './types';
import { CONTENT_MAP } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('INTRO');
  const [activeContent, setActiveContent] = useState<EntityType | null>(null);
  const [previousState, setPreviousState] = useState<GameState>('PLAYING');
  
  // gameKey forces a complete remount of GameEngine for a clean replay
  const [gameKey, setGameKey] = useState(0);
  
  // Track which artifacts have been collected
  const [collectedItems, setCollectedItems] = useState<EntityType[]>([]);
  
  // Lifted score state
  const [currentScore, setCurrentScore] = useState(0);

  const handleStart = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const handleReplay = useCallback(() => {
      setGameKey(prev => prev + 1);
      setCollectedItems([]);
      setCurrentScore(0);
      setGameState('PLAYING');
  }, []);

  const handleOpenContent = (type: EntityType) => {
    setPreviousState(gameState === 'MENU_OPEN' ? 'PLAYING' : gameState);
    setGameState('MODAL_OPEN');
    setActiveContent(type);
  };

  const handleCloseModal = () => {
    // Check win condition
    const hasIllustration = collectedItems.includes(EntityType.ENEMY_ILLUSTRATION);
    const hasMusic = collectedItems.includes(EntityType.ENEMY_MUSIC);
    const hasBand = collectedItems.includes(EntityType.ENEMY_BAND);
    const allCollected = hasIllustration && hasMusic && hasBand;

    if (allCollected) {
        // LOGIC FIX:
        // If we are closing the Contact/Boss Mail modal (e.g. from "Send Love"), go to System Menu.
        // If we are closing a regular item modal (just finished the game), go to Win Screen.
        if (activeContent === EntityType.BOSS_MAIL) {
             setGameState('MENU_OPEN');
        } else {
             setGameState('WIN');
        }
    } else {
        setGameState('PLAYING');
    }
    setActiveContent(null);
  };
  
  const handleItemCollected = (type: EntityType) => {
      setCollectedItems(prev => {
          if (prev.includes(type)) return prev;
          return [...prev, type];
      });
  };

  const handleToggleMenu = () => {
    if (gameState === 'MENU_OPEN') {
      // If we toggle menu off, check if we should go back to WIN/Menu loop or Playing
      const hasIllustration = collectedItems.includes(EntityType.ENEMY_ILLUSTRATION);
      const hasMusic = collectedItems.includes(EntityType.ENEMY_MUSIC);
      const hasBand = collectedItems.includes(EntityType.ENEMY_BAND);
      const allCollected = hasIllustration && hasMusic && hasBand;

      if (allCollected) {
           setGameState('WIN'); 
      } else {
           setGameState(previousState);
      }
    } else {
      setPreviousState(gameState);
      setGameState('MENU_OPEN');
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      <CRTOverlay />

      {/* Main Game Layer - Key forces remount on replay */}
      <div className="absolute inset-0 z-0">
          <GameEngine 
            key={gameKey}
            gameState={gameState} 
            setGameState={setGameState} 
            onOpenContent={handleOpenContent}
            onItemCollected={handleItemCollected}
            collectedItems={collectedItems}
            onScoreUpdate={setCurrentScore}
          />
      </div>

      {/* UI Layers */}
      <UIOverlay 
        gameState={gameState}
        onToggleMenu={handleToggleMenu}
        onOpenContent={handleOpenContent}
        onReplay={handleReplay}
        collectedItems={collectedItems}
        score={currentScore}
      />

      {gameState === 'INTRO' && <IntroScreen onStart={handleStart} />}
      
      {gameState === 'MODAL_OPEN' && activeContent && (
        <Modal 
          data={CONTENT_MAP[activeContent]} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default App;