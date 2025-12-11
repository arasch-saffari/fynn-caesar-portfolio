
export type Vector2 = {
  x: number;
  y: number;
};

export enum EntityType {
  PLAYER = 'PLAYER',
  PROJECTILE = 'PROJECTILE',
  ENEMY_ILLUSTRATION = 'ENEMY_ILLUSTRATION',
  ENEMY_MUSIC = 'ENEMY_MUSIC',
  ENEMY_BAND = 'ENEMY_BAND',
  BOSS_MAIL = 'BOSS_MAIL',
  PARTICLE = 'PARTICLE'
}

export type Entity = {
  id: string;
  type: EntityType;
  position: Vector2;
  velocity: Vector2;
  size: number;
  health: number;
  maxHealth?: number; // Added for health bar calculation if needed later
  color: string;
  rotation?: number;
  // Visual FX properties
  trail?: Vector2[]; // Stores previous positions for light trails
  hitFlash?: number; // Timer for white flash on impact
  wobbleOffset?: number; // Random offset for floating animation
};

export type GameState = 'INTRO' | 'PLAYING' | 'MODAL_OPEN' | 'MENU_OPEN' | 'GAME_OVER' | 'WIN';

export type ContentData = {
  title: string;
  description: string;
  links: { label: string; url: string }[];
  style: 'illustration' | 'music' | 'band' | 'contact';
};