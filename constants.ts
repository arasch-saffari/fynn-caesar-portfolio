import { ContentData, EntityType } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const PLAYER_SPEED = 0.5; // Changed to acceleration force
export const PLAYER_FRICTION = 0.92;
export const PLAYER_MAX_SPEED = 8;
export const PROJECTILE_SPEED = 12;
export const ENEMY_SPEED = 2;

export const CONTENT_MAP: Record<string, ContentData> = {
  [EntityType.ENEMY_ILLUSTRATION]: {
    title: "ILLUSTRATION",
    description: "Permanent trippy visuals.",
    style: "illustration",
    links: [
      { label: "INSTAGRAM", url: "https://www.instagram.com/candyflip.tattoos/" }
    ]
  },
  [EntityType.ENEMY_MUSIC]: {
    title: "MUSIC",
    description: "Solo Sonic Explorations. Beats from the void.",
    style: "music",
    links: [
      { label: "INSTAGRAM", url: "https://www.instagram.com/insight_frequencies/" },
      { label: "SOUNDCLOUD", url: "https://on.soundcloud.com/vlxFtABNWgMialXNXP" }
    ]
  },
  [EntityType.ENEMY_BAND]: {
    title: "SATIVA IM EXIL",
    description: "Illusion Respektive. The Duo Project.",
    style: "band",
    links: [
      { label: "INSTAGRAM", url: "https://www.instagram.com/sativa.im.exil/?hl=de" },
      { label: "BANDCAMP", url: "https://sativaimexil.bandcamp.com/album/illusion-respektive" },
      { label: "SPOTIFY", url: "https://open.spotify.com/intl-de/artist/1INpSDJvTFEeAICSF2XMAo" }
    ]
  },
  [EntityType.BOSS_MAIL]: {
    title: "STAY IN TOUCH",
    description: "booking@fynn-caesar.com",
    style: "contact",
    links: []
  }
};