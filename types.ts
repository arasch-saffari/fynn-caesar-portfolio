
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
  PARTICLE = 'PARTICLE',
  FLOATING_TEXT = 'FLOATING_TEXT'
}

export type Entity = {
  id: string;
  type: EntityType;
  position: Vector2;
  velocity: Vector2;
  size: number;
  health: number;
  maxHealth?: number; 
  color: string;
  rotation?: number;
  // Visual FX properties
  trail?: Vector2[]; 
  hitFlash?: number; 
  wobbleOffset?: number;
  // Text property for FloatingText entities
  text?: string; 
  opacity?: number;
};

export type GameState = 'INTRO' | 'PLAYING' | 'MODAL_OPEN' | 'MENU_OPEN' | 'GAME_OVER' | 'WIN';

export type ContentData = {
  title: string;
  description: string;
  links: { label: string; url: string }[];
  style: 'illustration' | 'music' | 'band' | 'contact';
};
