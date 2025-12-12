import React, { useState, useCallback, Suspense, lazy } from 'react';
import IntroScreen from './components/IntroScreen';
import CRTOverlay from './components/CRTOverlay';
import Modal from './components/Modal';
import UIOverlay from './components/UIOverlay';
import LoadingSpinner from './components/LoadingSpinner';
import { GameState, EntityType } from './types';
import { CONTENT_MAP } from './constants';

// OPTIMIZATION: Lazy load the heavy GameEngine so IntroScreen loads instantly
const GameEngine = lazy(() => import('./components/GameEngine'));

// OPTIMIZATION: Memoize GameEngine to prevent re-renders when only UI state (score) changes
const MemoizedGameEngine = React.memo(GameEngine);

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

  const handleOpenContent = useCallback((type: EntityType) => {
    setPreviousState(current => current === 'MENU_OPEN' ? 'PLAYING' : current);
    setGameState('MODAL_OPEN');
    setActiveContent(type);
  }, []);

  const handleCloseModal = () => {
    // Check win condition
    const hasIllustration = collectedItems.includes(EntityType.ENEMY_ILLUSTRATION);
    const hasMusic = collectedItems.includes(EntityType.ENEMY_MUSIC);
    const hasBand = collectedItems.includes(EntityType.ENEMY_BAND);
    const allCollected = hasIllustration && hasMusic && hasBand;

    if (allCollected) {
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
  
  const handleItemCollected = useCallback((type: EntityType) => {
      setCollectedItems(prev => {
          if (prev.includes(type)) return prev;
          return [...prev, type];
      });
  }, []);

  const handleToggleMenu = useCallback(() => {
    setGameState(current => {
      if (current === 'MENU_OPEN') {
        const hasIllustration = collectedItems.includes(EntityType.ENEMY_ILLUSTRATION);
        const hasMusic = collectedItems.includes(EntityType.ENEMY_MUSIC);
        const hasBand = collectedItems.includes(EntityType.ENEMY_BAND);
        const allCollected = hasIllustration && hasMusic && hasBand;

        if (allCollected) return 'WIN';
        return previousState;
      } else {
        setPreviousState(current);
        return 'MENU_OPEN';
      }
    });
  }, [collectedItems, previousState]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      <CRTOverlay />

      {/* Main Game Layer - Wrapped in Suspense for Lazy Loading */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<LoadingSpinner />}>
          <MemoizedGameEngine 
            key={gameKey}
            gameState={gameState} 
            setGameState={setGameState} 
            onOpenContent={handleOpenContent}
            onItemCollected={handleItemCollected}
            collectedItems={collectedItems}
            onScoreUpdate={setCurrentScore}
          />
        </Suspense>
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