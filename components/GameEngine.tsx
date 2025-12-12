import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Entity, EntityType, Vector2 } from '../types';
import { PROJECTILE_SPEED } from '../constants';

interface GameEngineProps {
  setGameState: (state: GameState) => void;
  gameState: GameState;
  onOpenContent: (type: EntityType) => void;
  onItemCollected: (type: EntityType) => void;
  collectedItems: EntityType[];
  onScoreUpdate: (score: number) => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ setGameState, gameState, onOpenContent, onItemCollected, collectedItems, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Track dimensions
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const isMobileRef = useRef(window.innerWidth < 768);
  
  // OPTIMIZATION: Use refs for high-frequency logic
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  
  // Calculate game scale
  const getGameScale = (w: number) => {
      if (w < 600) return 0.8; // Mobile
      if (w < 1440) return 1.0; // Laptop/Desktop
      return Math.min(1.5, 1.0 + (w - 1440) / 3000); // Capped scaling for ultrawide
  };
  
  const gameScale = getGameScale(dimensions.width);
  
  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        setDimensions({ width, height });
        isMobileRef.current = width < 768;
        
        // Safety bounds check for player
        if (playerPos.current) {
            playerPos.current.x = Math.min(Math.max(playerPos.current.x, 20), width - 20);
            playerPos.current.y = Math.min(playerPos.current.y, height - 100); 
        }
    };
    
    // Throttled resize observer could be better, but native event is okay for now
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize); 
    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Game State Refs
  const playerPos = useRef<Vector2>({ x: window.innerWidth / 2, y: window.innerHeight - 100 });
  const playerRotation = useRef<number>(0);
  
  // Input tracking
  const mousePos = useRef<Vector2>({ x: window.innerWidth / 2, y: 0 });
  // New: Track if input is coming from touch to apply offsets
  const isTouchInput = useRef<boolean>(false); 
  
  const isFiring = useRef<boolean>(false);
  const muzzleFlash = useRef<number>(0);
  
  const keysPressed = useRef<Set<string>>(new Set());
  const entities = useRef<Entity[]>([]);
  const particles = useRef<Entity[]>([]);
  const floatingTexts = useRef<Entity[]>([]); 
  
  const lastShotTime = useRef<number>(0);
  const lastHitTime = useRef<number>(0);
  const frameId = useRef<number>(0);
  const stars = useRef<{x: number, y: number, z: number, alpha: number}[]>([]);
  const screenShake = useRef<number>(0);
  const winSequenceStarted = useRef<boolean>(false);
  const timeRef = useRef<number>(0);

  // Initialize Stars
  useEffect(() => {
    stars.current = [];
    // PERFORMANCE: Cap star count on mobile
    const density = isMobileRef.current ? 4000 : 3000;
    const starCount = Math.floor((window.innerWidth * window.innerHeight) / density);
    
    for(let i=0; i<starCount; i++) {
        const depth = Math.pow(Math.random(), 2); 
        stars.current.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            z: depth * 2.5 + 0.2, 
            alpha: 0.1 + Math.random() * 0.5
        });
    }
  }, [dimensions]);

  // Initialize Level
  const initLevel = useCallback(() => {
    winSequenceStarted.current = false;
    const newEntities: Entity[] = [];
    const { width, height } = dimensions;
    const scale = getGameScale(width);
    const enemySize = 75 * scale; 
    const centerX = width / 2;
    const spreadX = Math.min(width * 0.35, 500 * scale); 

    if (!collectedItems.includes(EntityType.ENEMY_ILLUSTRATION)) {
        newEntities.push({
            id: 'illustration-invader',
            type: EntityType.ENEMY_ILLUSTRATION,
            position: { x: centerX - spreadX, y: height * 0.25 },
            velocity: { x: 1.5 * scale, y: 0.5 * scale },
            size: enemySize,
            health: 3, 
            maxHealth: 3,
            color: '#4ade80',
            rotation: 0,
            trail: [],
            wobbleOffset: Math.floor(Math.random() * 100)
        });
    }

    if (!collectedItems.includes(EntityType.ENEMY_MUSIC)) {
        newEntities.push({
            id: 'music-invader',
            type: EntityType.ENEMY_MUSIC,
            position: { x: centerX, y: height * 0.2 },
            velocity: { x: 2 * scale, y: 0 },
            size: enemySize,
            health: 3,
            maxHealth: 3,
            color: '#d8b4fe',
            rotation: 0,
            trail: [],
            wobbleOffset: Math.floor(Math.random() * 100)
        });
    }

    if (!collectedItems.includes(EntityType.ENEMY_BAND)) {
        newEntities.push({
            id: 'band-invader',
            type: EntityType.ENEMY_BAND,
            position: { x: centerX + spreadX, y: height * 0.25 },
            velocity: { x: -1.5 * scale, y: 0.8 * scale },
            size: enemySize,
            health: 3,
            maxHealth: 3,
            color: '#facc15',
            rotation: 0,
            trail: [],
            wobbleOffset: Math.floor(Math.random() * 100)
        });
    }
    
    entities.current = newEntities;

  }, [collectedItems, dimensions]);

  useEffect(() => {
    if (gameState === 'PLAYING' && entities.current.length === 0 && !winSequenceStarted.current) {
      initLevel();
    }
  }, [gameState, initLevel]);

  // Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        keysPressed.current.add(e.code);
        if (e.code === 'Space') isFiring.current = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        keysPressed.current.delete(e.code);
        if (e.code === 'Space') isFiring.current = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const triggerWinSequence = useCallback(() => {
    winSequenceStarted.current = true;
    setGameState('WIN'); 
  }, [setGameState]);

  const spawnFloatingText = (x: number, y: number, text: string, color: string, scale: number) => {
      floatingTexts.current.push({
          id: Math.random().toString(),
          type: EntityType.FLOATING_TEXT,
          position: { x, y },
          velocity: { x: (Math.random() - 0.5) * 1 * scale, y: -2 * scale }, 
          size: 16 * scale,
          health: 60,
          color: color,
          text: text,
          opacity: 1
      });
  };

  const updateCombo = () => {
      const now = Date.now();
      if (now - lastHitTime.current < 1500) { 
          comboRef.current = Math.min(comboRef.current + 1, 99);
      } else {
          comboRef.current = 1;
      }
      lastHitTime.current = now;
  };

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const createExplosion = (x: number, y: number, color: string, baseCount = 15, speed = 8) => {
        screenShake.current = Math.min(screenShake.current + 8, 25);
        
        // PERFORMANCE: Reduce particles on mobile
        const count = isMobileRef.current ? Math.floor(baseCount * 0.5) : baseCount;

        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = (Math.random() * speed + 2) * gameScale;
            const life = 30 + Math.random() * 30;
            particles.current.push({
                id: Math.random().toString(),
                type: EntityType.PARTICLE,
                position: {x, y},
                velocity: { 
                    x: Math.cos(angle) * velocity, 
                    y: Math.sin(angle) * velocity 
                },
                size: (Math.random() * 3 + 1) * gameScale,
                health: life,
                color: Math.random() > 0.6 ? '#ffffff' : color 
            });
        }
    };

    const update = () => {
        timeRef.current += 1;
        const { width, height } = dimensions;
        
        const SAFE_TOP = 80 * gameScale; 
        const SAFE_BOTTOM = 120 * gameScale; 
        const BASE_PLAYER_Y = height - SAFE_BOTTOM;

        // --- PLAYER MOVEMENT INTERPOLATION ---
        // UX: Mobile Touch Offset - If touch input, aim slightly above finger so user sees ship
        const targetY = isTouchInput.current 
            ? mousePos.current.y - (80 * gameScale) 
            : mousePos.current.y;
            
        // Smoothly lerp towards mouse position for fluid movement
        const lerpFactor = 0.15; // Smoothness factor
        playerPos.current.x += (mousePos.current.x - playerPos.current.x) * lerpFactor;
        
        // Allow Y movement but bound it strongly near bottom
        let desiredY = targetY;
        // Clamp Y to not go too high or too low
        desiredY = Math.max(height * 0.6, Math.min(desiredY, height - 80));
        
        // Apply recoil to Y
        const recoilY = (muzzleFlash.current > 0) ? 4 * gameScale : 0;
        playerPos.current.y += (desiredY + recoilY - playerPos.current.y) * 0.1;

        // Shake decay
        if (screenShake.current > 0) {
            screenShake.current *= 0.9;
            if (screenShake.current < 0.5) screenShake.current = 0;
        }

        if (muzzleFlash.current > 0) muzzleFlash.current--;

        if (Date.now() - lastHitTime.current > 1500 && comboRef.current > 0) {
            comboRef.current = 0;
        }

        if (gameState !== 'PLAYING' && gameState !== 'WIN') return;

        // 1. Aiming
        const dx = mousePos.current.x - playerPos.current.x;
        const dy = mousePos.current.y - playerPos.current.y; // Aim at actual finger/mouse
        let angle = Math.atan2(dy, dx);
        playerRotation.current = angle + Math.PI / 2;

        // 2. Shooting
        if ((keysPressed.current.has('Space') || isFiring.current) && !winSequenceStarted.current) {
            const now = Date.now();
            if (now - lastShotTime.current > 100) { 
                const fireAngle = playerRotation.current - Math.PI / 2; 
                muzzleFlash.current = 3; 

                const pSpeed = PROJECTILE_SPEED * gameScale;
                const offset = 30 * gameScale;

                entities.current.push({
                    id: Math.random().toString(),
                    type: EntityType.PROJECTILE,
                    position: { 
                        x: playerPos.current.x + Math.cos(fireAngle) * offset, 
                        y: playerPos.current.y + Math.sin(fireAngle) * offset 
                    },
                    velocity: { 
                        x: Math.cos(fireAngle) * pSpeed, 
                        y: Math.sin(fireAngle) * pSpeed 
                    },
                    size: 4 * gameScale,
                    health: 1,
                    color: '#ff00ff', 
                    rotation: playerRotation.current,
                    trail: []
                });
                lastShotTime.current = now;
            }
        }

        // 3. Stars Logic
        const parallaxX = (mousePos.current.x - width / 2) * 0.05;

        stars.current.forEach(star => {
            star.y += star.z * 0.5 * gameScale;
            star.x -= parallaxX * star.z * 0.05;

            if (star.y > height) {
                star.y = -5;
                star.x = Math.random() * width;
            }
            if (star.x < 0) star.x += width;
            if (star.x > width) star.x -= width;

            if (Math.random() < 0.005) {
                star.alpha = 0.1 + Math.random() * 0.3;
            }
        });

        // 4. Entity Logic & Physics
        // OPTIMIZATION: Use for-loop instead of forEach for better performance on mobile
        for (let i = 0; i < entities.current.length; i++) {
            const entity = entities.current[i];
            
            // Trail logic
            if (entity.trail) {
                entity.trail.push({x: entity.position.x, y: entity.position.y});
                if (entity.trail.length > 8) entity.trail.shift();
            }

            if (entity.hitFlash && entity.hitFlash > 0) entity.hitFlash--;

            // Movement Logic
            if (entity.type === EntityType.PROJECTILE) {
                entity.position.x += entity.velocity.x;
                entity.position.y += entity.velocity.y;
            } else if (entity.type.includes('ENEMY')) {
                // ... (Enemy logic remains mostly same, just optimized execution)
                 const t = timeRef.current;
                 const boundLeft = 50 * gameScale;
                 const boundRight = width - (50 * gameScale);
                 const boundTop = SAFE_TOP;
                 const boundBottom = height - (200 * gameScale);

                 // ... [Existing Enemy Movement Logic - kept intact for brevity but executed here] ...
                 if (entity.type === EntityType.ENEMY_ILLUSTRATION) {
                    entity.position.x += entity.velocity.x;
                    entity.position.y += entity.velocity.y;
                    
                    if (entity.position.x <= boundLeft) { entity.position.x = boundLeft; entity.velocity.x *= -1; }
                    if (entity.position.x >= boundRight) { entity.position.x = boundRight; entity.velocity.x *= -1; }
                    if (entity.position.y <= boundTop) { entity.position.y = boundTop; entity.velocity.y *= -1; }
                    if (entity.position.y >= boundBottom) { entity.position.y = boundBottom; entity.velocity.y *= -1; }

                    if (Math.random() < 0.05) {
                        if (Math.random() < 0.25) {
                            entity.velocity.x *= 0.1;
                            entity.velocity.y *= 0.1;
                        } else {
                            const speed = (5 + Math.random() * 5) * gameScale;
                            const angle = Math.floor(Math.random() * 8) * (Math.PI / 4); 
                            entity.velocity.x = Math.cos(angle) * speed;
                            entity.velocity.y = Math.sin(angle) * speed * 0.5;
                        }
                    }
                    entity.velocity.x *= 0.96;
                    entity.velocity.y *= 0.96;
                    
                    const minSpeed = 0.5 * gameScale;
                    if (Math.abs(entity.velocity.x) < minSpeed) entity.velocity.x += (Math.random() - 0.5);
                    if (Math.abs(entity.velocity.y) < minSpeed) entity.velocity.y += (Math.random() - 0.5);
                    entity.rotation = Math.sin(t * 0.1) * 0.1 + (entity.velocity.x * 0.05);

                } else if (entity.type === EntityType.ENEMY_MUSIC) {
                    entity.position.x += entity.velocity.x;
                    if (entity.position.x <= boundLeft || entity.position.x >= boundRight) entity.velocity.x *= -1;
                    const drift = Math.sin(t * 0.015) * 1.0 * gameScale;
                    const primaryWave = Math.cos(t * 0.05) * 2.5 * gameScale;
                    const secondaryWave = Math.sin(t * 0.12) * 1.2 * gameScale;
                    entity.position.y += drift + primaryWave + secondaryWave;
                    if (entity.position.y < boundTop) entity.position.y = boundTop;
                    if (entity.position.y > boundBottom) entity.position.y = boundBottom;
                    entity.rotation = Math.cos(t * 0.05) * 0.2;

                } else if (entity.type === EntityType.ENEMY_BAND) {
                    // Logic for Band dodge...
                     const detectRadius = 150 * gameScale;
                    let dodgeX = 0;
                    let dodgeY = 0;
                    // Note: Optimized search could be added here, but filter is okay for 3 enemies
                    const threats = entities.current.filter(e => 
                        e.type === EntityType.PROJECTILE && 
                        Math.abs(e.position.x - entity.position.x) < detectRadius &&
                        Math.abs(e.position.y - entity.position.y) < detectRadius
                    );
                    if (threats.length > 0) {
                        const closest = threats[0]; // Simplified: just run from first threat found
                        const angle = Math.atan2(entity.position.y - closest.position.y, entity.position.x - closest.position.x);
                        const urgency = 1.2 * gameScale;
                        dodgeX = Math.cos(angle) * urgency;
                        dodgeY = Math.sin(angle) * urgency;
                    }
                    entity.velocity.x += dodgeX;
                    entity.velocity.y += dodgeY;
                    entity.position.x += entity.velocity.x;
                    entity.position.y += entity.velocity.y;
                    
                    if (entity.position.x <= boundLeft) { entity.position.x = boundLeft; entity.velocity.x *= -0.8; }
                    if (entity.position.x >= boundRight) { entity.position.x = boundRight; entity.velocity.x *= -0.8; }
                    if (entity.position.y <= boundTop) { entity.position.y = boundTop; entity.velocity.y *= -0.8; }
                    if (entity.position.y >= boundBottom) { entity.position.y = boundBottom; entity.velocity.y *= -0.8; }

                    if (Math.random() < 0.04) {
                        const dashSpeed = (2 + Math.random() * 6) * gameScale;
                        const angle = Math.random() * Math.PI * 2;
                        entity.velocity.x += Math.cos(angle) * dashSpeed;
                        entity.velocity.y += Math.sin(angle) * dashSpeed;
                    }
                    entity.velocity.x *= 0.93;
                    entity.velocity.y *= 0.93;
                    const speed = Math.hypot(entity.velocity.x, entity.velocity.y);
                    const maxSpeed = 10 * gameScale;
                    if (speed > maxSpeed) {
                        const scale = maxSpeed / speed;
                        entity.velocity.x *= scale;
                        entity.velocity.y *= scale;
                    }
                    if (speed < 0.5 * gameScale) {
                        entity.velocity.x += (Math.random()-0.5);
                        entity.velocity.y += (Math.random()-0.5);
                    }
                    const currentRotation = entity.rotation || 0;
                    entity.rotation = currentRotation + (entity.velocity.x * 0.03);
                }
            }
        }

        // 5. Particles Physics (Optimized loop)
        for (let i = particles.current.length - 1; i >= 0; i--) {
            const p = particles.current[i];
            p.position.x += p.velocity.x;
            p.position.y += p.velocity.y;
            p.velocity.x *= 0.92; 
            p.velocity.y *= 0.92;
            p.size *= 0.96; 
            p.health--;
            if (p.health <= 0) {
                particles.current.splice(i, 1);
            }
        }

        // 6. Floating Text Physics
        for (let i = floatingTexts.current.length - 1; i >= 0; i--) {
            const txt = floatingTexts.current[i];
            txt.position.x += txt.velocity.x;
            txt.position.y += txt.velocity.y;
            txt.health--;
            txt.opacity = Math.max(0, txt.health / 30);
            if (txt.health <= 0) {
                floatingTexts.current.splice(i, 1);
            }
        }

        // Cleanup offscreen entities (in reverse to safely splice)
        for (let i = entities.current.length - 1; i >= 0; i--) {
            const e = entities.current[i];
            const isOffscreen = e.position.x < -100 || e.position.x > width + 100 ||
                                e.position.y < -100 || e.position.y > height + 100;
            if (isOffscreen || e.health <= 0) {
                entities.current.splice(i, 1);
            }
        }

        // 7. Collision Detection (Optimized: Avoid array.filter inside loop)
        if (!winSequenceStarted.current) {
            // Identify enemies first
            const enemiesIndices: number[] = [];
            for(let i=0; i<entities.current.length; i++) {
                if(entities.current[i].type.includes('ENEMY')) enemiesIndices.push(i);
            }

            // Iterate projectiles
            for (let i = entities.current.length - 1; i >= 0; i--) {
                const proj = entities.current[i];
                if (proj.type !== EntityType.PROJECTILE) continue;

                let hit = false;
                for (const enemyIndex of enemiesIndices) {
                    const enemy = entities.current[enemyIndex];
                    if (enemy.health <= 0) continue; // Skip already dead in this frame

                    const dx = proj.position.x - enemy.position.x;
                    const dy = proj.position.y - enemy.position.y;
                    const distSq = dx*dx + dy*dy;
                    const minDist = enemy.size + proj.size;

                    if (distSq < minDist * minDist) {
                        hit = true;
                        proj.health = 0; // Mark projectile for deletion next frame
                        enemy.health--;
                        enemy.hitFlash = 4;
                        updateCombo();
                        createExplosion(proj.position.x, proj.position.y, '#fff', 5, 5);
                        
                        const hitPoints = 303;
                        scoreRef.current += hitPoints;
                        onScoreUpdate(scoreRef.current);
                        
                        spawnFloatingText(enemy.position.x, enemy.position.y - (20 * gameScale), `${hitPoints}`, '#fff', gameScale);

                        if (enemy.health <= 0) {
                            createExplosion(enemy.position.x, enemy.position.y, enemy.color, 30, 12);
                            onItemCollected(enemy.type); 
                            onOpenContent(enemy.type);
                            spawnFloatingText(enemy.position.x, enemy.position.y - (40 * gameScale), "NICE!", enemy.color, gameScale);
                        }
                        break; // Projectile hits one enemy max
                    }
                }
                // If projectile hit something, it's effectively dead, will be cleaned up next frame loop
            }
            
            // Check win condition
            let enemiesAlive = 0;
            for(let i=0; i<entities.current.length; i++) {
                if(entities.current[i].type.includes('ENEMY') && entities.current[i].health > 0) enemiesAlive++;
            }
            
            if (enemiesAlive === 0 && !winSequenceStarted.current && scoreRef.current > 0) {
                 if (collectedItems.length === 3) {
                     triggerWinSequence();
                 }
            }
        } else {
            // Win fireworks
            if (Math.random() < 0.1) {
                 const x = Math.random() * width;
                 const y = Math.random() * (height / 2);
                 const colors = ['#f472b6', '#ec4899', '#be185d', '#fda4af'];
                 createExplosion(x, y, colors[Math.floor(Math.random() * colors.length)], 40, 18);
            }
        }
    };

    const draw = () => {
        // ... [Draw function largely the same, optimized for readability]
        if (!ctx) return;
        const { width, height } = dimensions;

        ctx.fillStyle = '#050308';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        if (screenShake.current > 0) {
            const dx = (Math.random() - 0.5) * screenShake.current;
            const dy = (Math.random() - 0.5) * screenShake.current;
            ctx.translate(dx, dy);
        }

        // Draw Grid
        const time = timeRef.current;
        ctx.lineWidth = 1; 
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.15)'; 
        ctx.beginPath();
        const vanishingPointY = -height * 0.2; 
        const gridWidth = width * 3;
        const gridSpacing = 200 * gameScale; 
        const centerX = width / 2;
        for (let i = -gridWidth; i <= gridWidth; i += gridSpacing) {
             ctx.moveTo(centerX, vanishingPointY);
             ctx.lineTo(i + centerX, height);
        }
        ctx.stroke();

        const speed = 0.5 * gameScale; 
        const hSpacing = 120 * gameScale; 
        const gridOffset = (time * speed) % hSpacing;
        ctx.beginPath();
        for (let i = 0; i < height; i += hSpacing) {
            const y = i + gridOffset;
            if (y > height) continue;
            const alpha = Math.max(0, (y / height) * 0.2); 
            ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Draw Stars
        stars.current.forEach(star => {
            ctx.fillStyle = `rgba(200, 200, 255, ${star.alpha})`;
            const size = Math.max(0.8, star.z * 1.5 * gameScale);
            ctx.fillRect(star.x, star.y, size, size);
        });

        // Draw Trails
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        entities.current.forEach(e => {
            if (e.trail && e.trail.length > 1 && e.type === EntityType.PROJECTILE) {
                ctx.beginPath();
                ctx.strokeStyle = e.color;
                ctx.lineWidth = e.size;
                ctx.shadowBlur = 10;
                ctx.shadowColor = e.color;
                ctx.moveTo(e.trail[0].x, e.trail[0].y);
                for(let i=1; i<e.trail.length; i++) {
                    ctx.lineTo(e.trail[i].x, e.trail[i].y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        });

        // Draw Entities
        entities.current.forEach(e => {
            if (e.health <= 0) return; 

            // Hover check
            let isHovered = false;
            if (e.type.includes('ENEMY') && !isTouchInput.current) { // No hover effects on touch
                const dx = e.position.x - mousePos.current.x;
                const dy = e.position.y - mousePos.current.y;
                const hitRadius = (e.size / 2) + 20; 
                if (dx*dx + dy*dy < hitRadius*hitRadius) {
                    isHovered = true;
                }
            }
            
            ctx.save();
            ctx.translate(e.position.x, e.position.y);
            
            const isHit = e.hitFlash && e.hitFlash > 0;
            
            if (e.type.includes('ENEMY')) {
                 ctx.rotate(e.rotation || 0);
                 const offset = e.wobbleOffset || 0;
                 const freq = 20 + (offset % 15);
                 const amp = 3 * gameScale;
                 const hover = Math.sin(timeRef.current / freq + offset) * amp;
                 ctx.translate(0, hover);
            } else if (e.type === EntityType.PROJECTILE) {
                ctx.rotate(e.rotation || 0);
            }

            if (e.type === EntityType.PROJECTILE) {
                ctx.fillStyle = '#fff'; 
                ctx.shadowBlur = 15;
                ctx.shadowColor = e.color;
                ctx.beginPath();
                ctx.arc(0, 0, e.size, 0, Math.PI*2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                const color = isHit ? '#ffffff' : e.color;
                ctx.strokeStyle = color;
                
                if (isHovered && !isHit) {
                    ctx.lineWidth = 5 * gameScale;
                    ctx.shadowBlur = 30 + Math.sin(timeRef.current * 0.2) * 15;
                    ctx.shadowColor = color;
                } else {
                    ctx.lineWidth = 3 * gameScale; 
                    ctx.shadowBlur = isHit ? 20 : 15;
                    ctx.shadowColor = color;
                }
                
                if (e.type === EntityType.ENEMY_ILLUSTRATION) {
                    if (!isHit) {
                        const pulse = Math.abs(Math.sin(timeRef.current * 0.1)) * 10 * gameScale;
                        ctx.shadowBlur = 10 + pulse;
                        ctx.shadowColor = e.color;
                    }
                    const radius = e.size / 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, radius, 0, Math.PI * 2);
                    ctx.stroke();
                    if (!isHit) {
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(0, 0, radius * 0.4, 0, Math.PI*2);
                        ctx.fill();
                    }
                } else if (e.type === EntityType.ENEMY_MUSIC) {
                    ctx.beginPath();
                    const width = e.size;
                    const barCount = 5;
                    const step = width / barCount;
                    const startX = -width / 2;
                    for(let i=0; i<barCount; i++) {
                        const h = (width * 0.3) + Math.random() * (width * 0.3);
                        const x = startX + (i * step) + (step/2);
                        ctx.moveTo(x, -h);
                        ctx.lineTo(x, h);
                    }
                    ctx.stroke();
                } else if (e.type === EntityType.ENEMY_BAND) {
                    if (!isHit && !winSequenceStarted.current) {
                        const jitter = 1.5 * gameScale;
                        ctx.translate((Math.random() - 0.5) * jitter, (Math.random() - 0.5) * jitter);
                    }
                    const s = e.size * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(0, -s);
                    ctx.lineTo(s, s * 0.8);
                    ctx.lineTo(-s, s * 0.8);
                    ctx.closePath();
                    ctx.stroke();
                }

                if (!isHit) {
                    ctx.rotate(-(e.rotation || 0)); 
                    ctx.fillStyle = '#fff';
                    const fontSize = Math.max(10, e.size * 0.25);
                    ctx.font = `${fontSize}px "Press Start 2P"`;
                    ctx.textAlign = 'center';
                    let label = "";
                    if (e.type === EntityType.ENEMY_ILLUSTRATION) label = "ILLUSTRATION";
                    else if (e.type === EntityType.ENEMY_MUSIC) label = "MUSIC";
                    else if (e.type === EntityType.ENEMY_BAND) label = "BAND";
                    ctx.fillText(label, 0, -e.size * 0.8);
                }
                ctx.shadowBlur = 0;
            }
            ctx.restore();
        });

        // Draw Particles
        particles.current.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.health / 30;
            ctx.beginPath();
            ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Draw Texts
        floatingTexts.current.forEach(txt => {
            if (txt.text) {
                ctx.save();
                ctx.fillStyle = txt.color;
                ctx.globalAlpha = txt.opacity || 1;
                const fontSize = Math.max(12, 12 * gameScale);
                ctx.font = `${fontSize}px "Press Start 2P"`;
                ctx.textAlign = 'center';
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 4;
                ctx.fillText(txt.text, txt.position.x, txt.position.y);
                ctx.restore();
            }
        });

        // Draw Player
        const { x, y } = playerPos.current;
        const idleY = Math.sin(timeRef.current / 20) * (2 * gameScale);

        ctx.save();
        ctx.translate(x, y + idleY);
        ctx.rotate(playerRotation.current);
        ctx.scale(gameScale, gameScale);
        
        if (muzzleFlash.current > 0) {
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#ff00ff';
            ctx.beginPath();
            ctx.arc(0, -35, 20 + Math.random() * 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ec4899';
        ctx.fillStyle = '#fff';
        
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(14, 14);
        ctx.lineTo(0, 8);
        ctx.lineTo(-14, 14);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(6, 16);
        ctx.lineTo(-6, 16);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.restore();
    };

    const loop = () => {
        update();
        draw();
        frameId.current = requestAnimationFrame(loop);
    };

    if (gameState === 'PLAYING' || gameState === 'WIN') {
        frameId.current = requestAnimationFrame(loop);
    } else {
        draw();
    }

    return () => cancelAnimationFrame(frameId.current);
  }, [gameState, onOpenContent, triggerWinSequence, onItemCollected, collectedItems, onScoreUpdate, dimensions, gameScale]);

  // Handle Input Mapping
  const handleUpdateInput = (clientX: number, clientY: number) => {
    mousePos.current = {
        x: clientX,
        y: clientY
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isFiring.current = true;
    isTouchInput.current = true;
    const t = e.touches[0];
    handleUpdateInput(t.clientX, t.clientY);
  };
  const handleTouchEnd = () => { isFiring.current = false; };
  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    isTouchInput.current = true;
    handleUpdateInput(t.clientX, t.clientY);
  };
  const handleMouseDown = (e: React.MouseEvent) => {
      isFiring.current = true;
      isTouchInput.current = false;
      handleUpdateInput(e.clientX, e.clientY);
  };
  const handleMouseUp = () => { isFiring.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
      isTouchInput.current = false;
      handleUpdateInput(e.clientX, e.clientY);
  };
  const handleMouseLeave = () => { isFiring.current = false; };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="block cursor-crosshair active:cursor-crosshair touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};

export default GameEngine;