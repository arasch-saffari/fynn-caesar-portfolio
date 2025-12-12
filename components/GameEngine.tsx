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
  // Track logical dimensions (CSS pixels)
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  
  // Calculate a scale factor for the game world based on width
  // REVISED: Drastically reduced desktop scaling to fix "zoomed in" / "undefined" look.
  // Mobile (< 600px) remains strictly at 0.8 as requested.
  const getGameScale = (w: number) => {
      if (w < 600) return 0.8; // Mobile: DO NOT CHANGE
      
      // Desktop/Tablet:
      // Reset to 1.0 base scale for crispness.
      // Only scale up very slightly for very large screens (> 1440px)
      if (w < 1440) return 1.0;
      
      // Very gentle scaling for large screens:
      // At 1920px: 1.0 + (480 / 3000) ~= 1.16
      // Much better than previous ~2.0+
      return 1.0 + (w - 1440) / 3000; 
  };
  
  const gameScale = getGameScale(dimensions.width);

  // Sync local score to parent
  useEffect(() => {
      onScoreUpdate(score);
  }, [score, onScoreUpdate]);
  
  // Handle Window Resize with Debounce and Logic Updates
  useEffect(() => {
    const handleResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        setDimensions({ width, height });
        
        // Ensure player doesn't get stuck off-screen
        if (playerPos.current) {
            playerPos.current.x = Math.min(Math.max(playerPos.current.x, 20), width - 20);
            playerPos.current.y = Math.min(playerPos.current.y, height - 100); 
        }
    };
    
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

  // Initialize Stars - Fewer stars for a cleaner look
  useEffect(() => {
    stars.current = [];
    const starCount = Math.floor((window.innerWidth * window.innerHeight) / 3000); // Reduced density
    
    for(let i=0; i<starCount; i++) {
        const depth = Math.pow(Math.random(), 2); 
        stars.current.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            z: depth * 2.5 + 0.2, 
            alpha: 0.1 + Math.random() * 0.5 // Lower base alpha
        });
    }
  }, []);

  // Initialize Level
  const initLevel = useCallback(() => {
    winSequenceStarted.current = false;
    const newEntities: Entity[] = [];
    const { width, height } = dimensions;
    const scale = getGameScale(width);
    
    // Adjusted enemy size calculation
    const enemySize = 75 * scale; 

    // Adjust spawn positions
    const centerX = width / 2;
    
    // REVISED SPREAD LOGIC:
    // Ensure enemies stay within viewport.
    // Use 35% of width instead of 60% (which pushed them offscreen).
    // Clamp to a max pixel value for desktop aesthetics.
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

  // Input Handling
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
          setCombo(c => Math.min(c + 1, 99));
      } else {
          setCombo(1);
      }
      lastHitTime.current = now;
  };

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // --- HIGH DPI SCALING FIX ---
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);
    // ----------------------------

    const createExplosion = (x: number, y: number, color: string, count = 15, speed = 8) => {
        screenShake.current = Math.min(screenShake.current + 8, 25);
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
        
        // Define safe areas for game logic (keep entities away from edges/UI)
        const SAFE_TOP = 80 * gameScale; 
        const SAFE_BOTTOM = 120 * gameScale; 
        const BASE_PLAYER_Y = height - SAFE_BOTTOM;

        // Shake decay
        if (screenShake.current > 0) {
            screenShake.current *= 0.9;
            if (screenShake.current < 0.5) screenShake.current = 0;
        }

        if (muzzleFlash.current > 0) muzzleFlash.current--;

        if (Date.now() - lastHitTime.current > 1500 && combo > 0) {
            setCombo(0);
        }

        if (gameState !== 'PLAYING' && gameState !== 'WIN') return;

        // 1. Turret Aiming
        const dx = mousePos.current.x - playerPos.current.x;
        const dy = mousePos.current.y - playerPos.current.y;
        let angle = Math.atan2(dy, dx);
        playerRotation.current = angle + Math.PI / 2;

        // 2. Shooting
        if ((keysPressed.current.has('Space') || isFiring.current) && !winSequenceStarted.current) {
            const now = Date.now();
            if (now - lastShotTime.current > 100) { 
                const fireAngle = playerRotation.current - Math.PI / 2; 
                playerPos.current.y = BASE_PLAYER_Y + (4 * gameScale);
                muzzleFlash.current = 3; 

                // Scale projectile speed and offset
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
        
        // Recoil recovery
        playerPos.current.y += (BASE_PLAYER_Y - playerPos.current.y) * 0.2;

        // 3. Stars Logic
        const parallaxX = (mousePos.current.x - width / 2) * 0.05;

        stars.current.forEach(star => {
            star.y += star.z * 0.5 * gameScale; // Much slower stars (was 1.2)
            star.x -= parallaxX * star.z * 0.05;

            // Screen Wrapping with Dynamic Dimensions
            if (star.y > height) {
                star.y = -5;
                star.x = Math.random() * width;
            }
            if (star.x < 0) star.x += width;
            if (star.x > width) star.x -= width;

            // Subtle twinkling only
            if (Math.random() < 0.005) {
                star.alpha = 0.1 + Math.random() * 0.3;
            }
        });

        // 4. Entity Logic
        entities.current.forEach(entity => {
            if (entity.trail) {
                entity.trail.push({x: entity.position.x, y: entity.position.y});
                if (entity.trail.length > 8) entity.trail.shift();
            }

            if (entity.hitFlash && entity.hitFlash > 0) entity.hitFlash--;

            if (entity.type === EntityType.PROJECTILE) {
                entity.position.x += entity.velocity.x;
                entity.position.y += entity.velocity.y;
            } else if (entity.type.includes('ENEMY')) {
                const t = timeRef.current;
                
                // Dynamic Boundary Checks
                const boundLeft = 50 * gameScale;
                const boundRight = width - (50 * gameScale);
                const boundTop = SAFE_TOP;
                const boundBottom = height - (200 * gameScale); 

                if (entity.type === EntityType.ENEMY_ILLUSTRATION) {
                    entity.position.x += entity.velocity.x;
                    entity.position.y += entity.velocity.y;
                    
                    if (entity.position.x <= boundLeft) entity.velocity.x = Math.abs(entity.velocity.x);
                    if (entity.position.x >= boundRight) entity.velocity.x = -Math.abs(entity.velocity.x);
                    if (entity.position.y <= boundTop) entity.velocity.y = Math.abs(entity.velocity.y);
                    if (entity.position.y >= boundBottom) entity.velocity.y = -Math.abs(entity.velocity.y);

                    if (Math.random() < 0.02) {
                        const speed = (2 + Math.random() * 2) * gameScale;
                        const angle = Math.floor(Math.random() * 8) * (Math.PI / 4); 
                        entity.velocity.x = Math.cos(angle) * speed;
                        entity.velocity.y = Math.sin(angle) * speed * 0.5;
                    }
                    entity.rotation = Math.sin(t * 0.1) * 0.1 + (entity.velocity.x * 0.05);

                } else if (entity.type === EntityType.ENEMY_MUSIC) {
                    entity.position.x += entity.velocity.x;
                    
                    if (entity.position.x <= boundLeft || entity.position.x >= boundRight) {
                        entity.velocity.x *= -1;
                    }
                    
                    const drift = Math.sin(t * 0.01) * 0.5 * gameScale;
                    const wave = Math.cos(t * 0.08) * 2.5 * gameScale;
                    entity.position.y += drift + wave;
                    
                    if (entity.position.y < boundTop) entity.position.y = boundTop;
                    if (entity.position.y > boundBottom) entity.position.y = boundBottom;

                    entity.rotation = Math.cos(t * 0.05) * 0.2;

                } else if (entity.type === EntityType.ENEMY_BAND) {
                    entity.position.x += entity.velocity.x;
                    entity.position.y += entity.velocity.y;
                    
                    if (entity.position.x <= boundLeft || entity.position.x >= boundRight) entity.velocity.x *= -1;
                    if (entity.position.y <= boundTop || entity.position.y >= boundBottom) entity.velocity.y *= -1;

                    if (Math.random() < 0.03) {
                        const dashSpeed = (4 + Math.random() * 4) * gameScale;
                        const angle = Math.random() * Math.PI * 2;
                        entity.velocity.x += Math.cos(angle) * dashSpeed;
                        entity.velocity.y += Math.sin(angle) * dashSpeed;
                    }

                    const maxSpeed = 3.5 * gameScale;
                    const speed = Math.sqrt(entity.velocity.x**2 + entity.velocity.y**2);
                    if (speed > maxSpeed) {
                        entity.velocity.x *= 0.95;
                        entity.velocity.y *= 0.95;
                    } else if (speed < (1 * gameScale)) {
                         entity.velocity.x *= 1.1;
                         entity.velocity.y *= 1.1;
                    }
                    
                    entity.rotation += (Math.random() - 0.5) * 0.1;
                }
            }
        });

        // 5. Particles Physics
        particles.current.forEach(p => {
            p.position.x += p.velocity.x;
            p.position.y += p.velocity.y;
            p.velocity.x *= 0.92; 
            p.velocity.y *= 0.92;
            p.size *= 0.96; 
            p.health--;
        });
        particles.current = particles.current.filter(p => p.health > 0);

        // 6. Floating Text Physics
        floatingTexts.current.forEach(txt => {
            txt.position.x += txt.velocity.x;
            txt.position.y += txt.velocity.y;
            txt.health--;
            txt.opacity = Math.max(0, txt.health / 30);
        });
        floatingTexts.current = floatingTexts.current.filter(t => t.health > 0);

        // Cleanup offscreen
        entities.current = entities.current.filter(e => 
            e.position.x > -100 && e.position.x < width + 100 &&
            e.position.y > -100 && e.position.y < height + 100 && 
            e.health > 0
        );

        // 7. Collision Detection
        if (!winSequenceStarted.current) {
            const projectiles = entities.current.filter(e => e.type === EntityType.PROJECTILE);
            const enemies = entities.current.filter(e => e.type.includes('ENEMY'));

            projectiles.forEach(proj => {
                enemies.forEach(enemy => {
                    const dx = proj.position.x - enemy.position.x;
                    const dy = proj.position.y - enemy.position.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);

                    if (dist < enemy.size + proj.size) {
                        proj.health = 0; 
                        enemy.health--;
                        enemy.hitFlash = 4;
                        updateCombo();
                        createExplosion(proj.position.x, proj.position.y, '#fff', 5, 5);
                        
                        const damage = 100 * (combo || 1);
                        spawnFloatingText(enemy.position.x, enemy.position.y - (20 * gameScale), `${damage}`, '#fff', gameScale);

                        if (enemy.health <= 0) {
                            createExplosion(enemy.position.x, enemy.position.y, enemy.color, 30, 12);
                            onItemCollected(enemy.type); 
                            onOpenContent(enemy.type);
                            setScore(s => s + 1000 * (combo || 1));
                            spawnFloatingText(enemy.position.x, enemy.position.y - (40 * gameScale), "NICE!", enemy.color, gameScale);
                        }
                    }
                });
            });
            
            const enemiesAlive = entities.current.filter(e => e.type.includes('ENEMY')).length;
            if (enemiesAlive === 0 && !winSequenceStarted.current && score > 0) {
                 if (collectedItems.length === 3) {
                     triggerWinSequence();
                 }
            }
        } else {
            if (Math.random() < 0.1) {
                 const x = Math.random() * width;
                 const y = Math.random() * (height / 2);
                 const colors = ['#f472b6', '#ec4899', '#be185d', '#fda4af'];
                 createExplosion(x, y, colors[Math.floor(Math.random() * colors.length)], 40, 18);
            }
        }
    };

    const draw = () => {
        if (!ctx) return;
        const { width, height } = dimensions;

        // 1. Background
        ctx.fillStyle = '#050308';
        ctx.fillRect(0, 0, width, height);

        // Shake Camera
        ctx.save();
        if (screenShake.current > 0) {
            const dx = (Math.random() - 0.5) * screenShake.current;
            const dy = (Math.random() - 0.5) * screenShake.current;
            ctx.translate(dx, dy);
        }

        // 2. Grid - Dynamic Vanishing Point
        ctx.lineWidth = 1; // Keep grid lines thin
        const time = timeRef.current;
        // Smoother, less distracting color (dark purple/blue instead of pink)
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.15)'; 
        ctx.beginPath();
        const vanishingPointY = -height * 0.2; 
        const gridWidth = width * 3;
        // Increase spacing for less "busy" look
        const gridSpacing = 200 * gameScale; 
        
        // Vertical lines
        const centerX = width / 2;
        for (let i = -gridWidth; i <= gridWidth; i += gridSpacing) {
             ctx.moveTo(centerX, vanishingPointY);
             ctx.lineTo(i + centerX, height);
        }
        ctx.stroke();

        // Horizontal lines scrolling down - SLOWER
        const speed = 0.5 * gameScale; // Reduced speed significantly
        const hSpacing = 120 * gameScale; // Wider spacing
        const gridOffset = (time * speed) % hSpacing;
        ctx.beginPath();
        for (let i = 0; i < height; i += hSpacing) {
            const y = i + gridOffset;
            if (y > height) continue;
            // Smoother fadeout
            const alpha = Math.max(0, (y / height) * 0.2); 
            ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        // 3. Stars
        stars.current.forEach(star => {
            // Darker, less distracting stars
            ctx.fillStyle = `rgba(200, 200, 255, ${star.alpha})`;
            const size = Math.max(0.8, star.z * 1.5 * gameScale); // Keep stars relatively visible but dim
            ctx.fillRect(star.x, star.y, size, size);
        });

        // 4. Trails
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        entities.current.forEach(e => {
            if (e.type === EntityType.PROJECTILE && e.trail && e.trail.length > 1) {
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

        // 5. Entities
        entities.current.forEach(e => {
            if (e.health <= 0) return; 
            
            ctx.save();
            ctx.translate(e.position.x, e.position.y);
            
            const isHit = e.hitFlash && e.hitFlash > 0;
            
            if (e.type.includes('ENEMY')) {
                 ctx.rotate(e.rotation || 0);
                 const offset = e.wobbleOffset || 0;
                 const freq = 20 + (offset % 15);
                 const amp = 3 * gameScale; // Scale hover amplitude
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
                ctx.lineWidth = 3 * gameScale; // Scale lines
                ctx.shadowBlur = isHit ? 20 : 15;
                ctx.shadowColor = color;
                
                // Draw shapes with relative sizes
                if (e.type === EntityType.ENEMY_ILLUSTRATION) {
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
                    const s = e.size * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(-s, s * 0.7);
                    ctx.lineTo(0, -s);
                    ctx.lineTo(s, s * 0.7);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(0, -s * 0.3, s * 0.3, 0, Math.PI*2);
                    if (!isHit) {
                        ctx.fillStyle = color;
                        ctx.fill();
                    } else {
                        ctx.stroke();
                    }
                }

                if (!isHit) {
                    ctx.rotate(-(e.rotation || 0)); 
                    ctx.fillStyle = '#fff';
                    // Dynamic font size
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

        // 6. Particles
        particles.current.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.health / 30;
            ctx.beginPath();
            ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // 7. Floating Texts
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

        // 8. Player Draw - Scaled
        const { x, y } = playerPos.current;
        const idleY = Math.sin(timeRef.current / 20) * (2 * gameScale);

        ctx.save();
        ctx.translate(x, y + idleY);
        ctx.rotate(playerRotation.current);
        
        // Scale player drawing context
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
        // End player scaling
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
  }, [gameState, onOpenContent, triggerWinSequence, onItemCollected, collectedItems, combo, onScoreUpdate, dimensions, gameScale]);

  // Handle Input Mapping
  const handleUpdateInput = (clientX: number, clientY: number) => {
    mousePos.current = {
        x: clientX,
        y: clientY
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isFiring.current = true;
    const t = e.touches[0];
    handleUpdateInput(t.clientX, t.clientY);
  };
  const handleTouchEnd = () => { isFiring.current = false; };
  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    handleUpdateInput(t.clientX, t.clientY);
  };
  const handleMouseDown = (e: React.MouseEvent) => {
      isFiring.current = true;
      handleUpdateInput(e.clientX, e.clientY);
  };
  const handleMouseUp = () => { isFiring.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
      handleUpdateInput(e.clientX, e.clientY);
  };
  const handleMouseLeave = () => { isFiring.current = false; };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        // Style width/height controls logical size
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