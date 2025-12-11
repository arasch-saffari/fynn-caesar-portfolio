import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Entity, EntityType, Vector2 } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PROJECTILE_SPEED } from '../constants';

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
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  
  // Sync local score to parent
  useEffect(() => {
      onScoreUpdate(score);
  }, [score, onScoreUpdate]);
  
  // Game State Refs
  const BASE_PLAYER_Y = CANVAS_HEIGHT - 80;
  // Stationary Turret Position (Center Bottom)
  const playerPos = useRef<Vector2>({ x: CANVAS_WIDTH / 2, y: BASE_PLAYER_Y });
  const playerRotation = useRef<number>(0);
  
  // Input tracking
  const mousePos = useRef<Vector2>({ x: CANVAS_WIDTH / 2, y: 0 });
  const isFiring = useRef<boolean>(false);
  const muzzleFlash = useRef<number>(0);
  
  const keysPressed = useRef<Set<string>>(new Set());
  const entities = useRef<Entity[]>([]);
  const particles = useRef<Entity[]>([]);
  const floatingTexts = useRef<Entity[]>([]); // Floating Text Entities
  
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
    for(let i=0; i<200; i++) {
        // Create depth with more stars in the background (lower z)
        // Using power to bias towards 0
        const depth = Math.pow(Math.random(), 2); 
        
        stars.current.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            // Z ranges from roughly 0.2 to 2.5
            z: depth * 2.5 + 0.2, 
            alpha: 0.3 + Math.random() * 0.7
        });
    }
  }, []);

  // Initialize Level
  const initLevel = useCallback(() => {
    winSequenceStarted.current = false;
    const newEntities: Entity[] = [];
    
    if (!collectedItems.includes(EntityType.ENEMY_ILLUSTRATION)) {
        newEntities.push({
            id: 'illustration-invader',
            type: EntityType.ENEMY_ILLUSTRATION,
            position: { x: 200, y: 150 },
            velocity: { x: 1.5, y: 0.5 },
            size: 45,
            health: 8,
            maxHealth: 8,
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
            position: { x: CANVAS_WIDTH / 2, y: 120 },
            velocity: { x: 2, y: 0 },
            size: 45,
            health: 8,
            maxHealth: 8,
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
            position: { x: CANVAS_WIDTH - 200, y: 150 },
            velocity: { x: -1.5, y: 0.8 },
            size: 45,
            health: 8,
            maxHealth: 8,
            color: '#facc15',
            rotation: 0,
            trail: [],
            wobbleOffset: Math.floor(Math.random() * 100)
        });
    }
    
    entities.current = newEntities;

  }, [collectedItems]);

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

  const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
      floatingTexts.current.push({
          id: Math.random().toString(),
          type: EntityType.FLOATING_TEXT,
          position: { x, y },
          velocity: { x: (Math.random() - 0.5) * 1, y: -2 }, // Float up
          size: 16,
          health: 60, // frames to live
          color: color,
          text: text,
          opacity: 1
      });
  };

  const updateCombo = () => {
      const now = Date.now();
      if (now - lastHitTime.current < 1500) { // 1.5 seconds window
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

    const createExplosion = (x: number, y: number, color: string, count = 15, speed = 8) => {
        screenShake.current = Math.min(screenShake.current + 8, 25);
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * speed + 2;
            const life = 30 + Math.random() * 30;
            particles.current.push({
                id: Math.random().toString(),
                type: EntityType.PARTICLE,
                position: {x, y},
                velocity: { 
                    x: Math.cos(angle) * velocity, 
                    y: Math.sin(angle) * velocity 
                },
                size: Math.random() * 3 + 1,
                health: life,
                color: Math.random() > 0.6 ? '#ffffff' : color 
            });
        }
    };

    const update = () => {
        timeRef.current += 1;
        
        // Shake decay
        if (screenShake.current > 0) {
            screenShake.current *= 0.9;
            if (screenShake.current < 0.5) screenShake.current = 0;
        }

        if (muzzleFlash.current > 0) muzzleFlash.current--;

        // Reset Combo if time passed
        if (Date.now() - lastHitTime.current > 1500 && combo > 0) {
            setCombo(0);
        }

        if (gameState !== 'PLAYING' && gameState !== 'WIN') return;

        // 1. Turret Aiming (Rotate towards mouse/touch)
        const dx = mousePos.current.x - playerPos.current.x;
        const dy = mousePos.current.y - playerPos.current.y;
        let angle = Math.atan2(dy, dx);
        
        // Clamp Angle to avoid shooting backwards through the floor
        // Expected range: -PI to 0 (Upwards)
        // Allow slightly downwards for corner shots
        playerRotation.current = angle + Math.PI / 2;

        // 2. Shooting (Auto-fire on hold)
        if ((keysPressed.current.has('Space') || isFiring.current) && !winSequenceStarted.current) {
            const now = Date.now();
            if (now - lastShotTime.current > 100) { // Fast Fire Rate (100ms)
                const fireAngle = playerRotation.current - Math.PI / 2; 
                
                // Slight Recoil Animation
                playerPos.current.y = BASE_PLAYER_Y + 4;
                
                muzzleFlash.current = 3; 

                entities.current.push({
                    id: Math.random().toString(),
                    type: EntityType.PROJECTILE,
                    position: { 
                        x: playerPos.current.x + Math.cos(fireAngle) * 30, 
                        y: playerPos.current.y + Math.sin(fireAngle) * 30 
                    },
                    velocity: { 
                        x: Math.cos(fireAngle) * PROJECTILE_SPEED, 
                        y: Math.sin(fireAngle) * PROJECTILE_SPEED 
                    },
                    size: 4,
                    health: 1,
                    color: '#ff00ff', 
                    rotation: playerRotation.current,
                    trail: []
                });
                lastShotTime.current = now;
            }
        }
        
        // Return player to base position smoothly (Recoil recovery)
        playerPos.current.y += (BASE_PLAYER_Y - playerPos.current.y) * 0.2;


        // 3. Stars (Parallax Background)
        // Calculate horizontal parallax offset based on mouse position relative to center
        // When mouse is right, stars move left (simulate turning right)
        const parallaxX = (mousePos.current.x - CANVAS_WIDTH / 2) * 0.05;

        stars.current.forEach(star => {
            // Vertical movement (standard travel speed) - Faster for closer stars
            star.y += star.z * 1.2; 
            
            // Horizontal parallax movement - Closer stars move more
            star.x -= parallaxX * star.z * 0.05;

            // Screen Wrapping
            if (star.y > CANVAS_HEIGHT) {
                star.y = -5; // Reset just above screen
                star.x = Math.random() * CANVAS_WIDTH;
            }
            // Horizontal Wrapping
            if (star.x < 0) star.x += CANVAS_WIDTH;
            if (star.x > CANVAS_WIDTH) star.x -= CANVAS_WIDTH;

            // Twinkle effect
            if (Math.random() < 0.02) {
                star.alpha = 0.3 + Math.random() * 0.7;
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
                
                entity.position.x += entity.velocity.x;
                entity.position.y += entity.velocity.y;

                if (entity.position.x <= 50 || entity.position.x >= CANVAS_WIDTH - 50) entity.velocity.x *= -1;
                if (entity.position.y <= 50 || entity.position.y >= CANVAS_HEIGHT - 200) entity.velocity.y *= -1;

                if (entity.type === EntityType.ENEMY_MUSIC) {
                    entity.position.x += Math.cos(t * 0.05) * 3;
                    entity.rotation = Math.cos(t * 0.05) * 0.2;
                } else if (entity.type === EntityType.ENEMY_ILLUSTRATION) {
                    if (Math.random() < 0.02) entity.velocity.x *= -1; 
                    entity.rotation = Math.sin(t * 0.1) * 0.1;
                } else if (entity.type === EntityType.ENEMY_BAND) {
                    entity.position.x += Math.sin(t * 0.03) * 2;
                    entity.position.y += Math.cos(t * 0.03) * 1;
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
            e.position.x > -100 && e.position.x < CANVAS_WIDTH + 100 &&
            e.position.y > -100 && e.position.y < CANVAS_HEIGHT + 100 && 
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
                        
                        // Hit Effects
                        createExplosion(proj.position.x, proj.position.y, '#fff', 5, 5);
                        
                        // Floating Damage Number
                        const damage = 100 * (combo || 1);
                        spawnFloatingText(enemy.position.x, enemy.position.y - 20, `${damage}`, '#fff');

                        if (enemy.health <= 0) {
                            createExplosion(enemy.position.x, enemy.position.y, enemy.color, 30, 12);
                            onItemCollected(enemy.type); 
                            onOpenContent(enemy.type);
                            setScore(s => s + 1000 * (combo || 1));
                            spawnFloatingText(enemy.position.x, enemy.position.y - 40, "NICE!", enemy.color);
                        }
                    }
                });
            });
            
            // Win Condition
            const enemiesAlive = entities.current.filter(e => e.type.includes('ENEMY')).length;
            if (enemiesAlive === 0 && !winSequenceStarted.current && score > 0) {
                 if (collectedItems.length === 3) {
                     triggerWinSequence();
                 }
            }
        } else {
            // Victory Fireworks
            if (Math.random() < 0.1) {
                 const x = Math.random() * CANVAS_WIDTH;
                 const y = Math.random() * (CANVAS_HEIGHT / 2);
                 const colors = ['#f472b6', '#ec4899', '#be185d', '#fda4af'];
                 createExplosion(x, y, colors[Math.floor(Math.random() * colors.length)], 40, 18);
            }
        }
    };

    const draw = () => {
        if (!ctx) return;
        
        // --- RENDER START ---
        
        // 1. Background
        ctx.fillStyle = '#050308';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Shake Camera
        ctx.save();
        if (screenShake.current > 0) {
            const dx = (Math.random() - 0.5) * screenShake.current;
            const dy = (Math.random() - 0.5) * screenShake.current;
            ctx.translate(dx, dy);
        }

        // 2. Grid
        ctx.lineWidth = 1;
        const time = timeRef.current;
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)'; 
        ctx.beginPath();
        const vanishingPointY = -200;
        const gridWidth = CANVAS_WIDTH * 2;
        for (let i = -gridWidth; i <= gridWidth; i += 100) {
             ctx.moveTo(CANVAS_WIDTH/2, vanishingPointY);
             ctx.lineTo(i + CANVAS_WIDTH/2, CANVAS_HEIGHT);
        }
        ctx.stroke();

        const speed = 2;
        const gridOffset = (time * speed) % 80;
        ctx.beginPath();
        for (let i = 0; i < CANVAS_HEIGHT; i += 80) {
            const y = i + gridOffset;
            if (y > CANVAS_HEIGHT) continue;
            const alpha = Math.max(0, (y / CANVAS_HEIGHT) * 0.3); 
            ctx.strokeStyle = `rgba(236, 72, 153, ${alpha})`;
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
        }
        ctx.stroke();

        // 3. Stars
        stars.current.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            // Size depends on Z for perspective
            const size = Math.max(0.8, star.z * 1.2);
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
                 
                 // Dynamic wobble based on entity's random offset
                 const offset = e.wobbleOffset || 0;
                 // Vary frequency between ~20 and ~35 frames
                 const freq = 20 + (offset % 15);
                 // Vary amplitude between 3 and 7 pixels
                 const amp = 3 + (offset % 4);
                 
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
                ctx.lineWidth = 3;
                ctx.shadowBlur = isHit ? 20 : 15;
                ctx.shadowColor = color;
                
                if (e.type === EntityType.ENEMY_ILLUSTRATION) {
                    ctx.beginPath();
                    ctx.arc(0, 0, 22, 0, Math.PI * 2);
                    ctx.stroke();
                    if (!isHit) {
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(0, 0, 8, 0, Math.PI*2);
                        ctx.fill();
                    }
                } else if (e.type === EntityType.ENEMY_MUSIC) {
                    ctx.beginPath();
                    for(let i=-20; i<=20; i+=8) {
                        const h = 10 + Math.random() * 10;
                        ctx.moveTo(i, -h);
                        ctx.lineTo(i, h);
                    }
                    ctx.stroke();
                } else if (e.type === EntityType.ENEMY_BAND) {
                    ctx.beginPath();
                    ctx.moveTo(-15, 10);
                    ctx.lineTo(0, -15);
                    ctx.lineTo(15, 10);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(0, -5, 5, 0, Math.PI*2);
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
                    ctx.font = '10px "Press Start 2P"';
                    ctx.textAlign = 'center';
                    let label = "";
                    if (e.type === EntityType.ENEMY_ILLUSTRATION) label = "ILLUSTRATION";
                    else if (e.type === EntityType.ENEMY_MUSIC) label = "MUSIC";
                    else if (e.type === EntityType.ENEMY_BAND) label = "BAND";
                    ctx.fillText(label, 0, -40);
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
                ctx.font = '12px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 4;
                ctx.fillText(txt.text, txt.position.x, txt.position.y);
                ctx.restore();
            }
        });

        // 8. Player Draw (Turret Mode)
        const { x, y } = playerPos.current;
        // Bobbing effect
        const idleY = Math.sin(timeRef.current / 20) * 2;

        ctx.save();
        ctx.translate(x, y + idleY);
        ctx.rotate(playerRotation.current);
        
        // Muzzle Flash
        if (muzzleFlash.current > 0) {
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#ff00ff';
            ctx.beginPath();
            ctx.arc(0, -35, 20 + Math.random() * 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // DRAW SPACESHIP (Vector style)
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ec4899';
        ctx.fillStyle = '#fff';
        
        ctx.beginPath();
        ctx.moveTo(0, -20); // Tip
        ctx.lineTo(14, 14); // Right Bottom
        ctx.lineTo(0, 8);   // Center Bottom (indent)
        ctx.lineTo(-14, 14); // Left Bottom
        ctx.closePath();
        ctx.fill();

        // Engine Glow
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
  }, [gameState, onOpenContent, triggerWinSequence, onItemCollected, collectedItems, combo, onScoreUpdate]);

  // Precise Input Mapping for Responsiveness
  const handleUpdateInput = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Calculate Scale Factors (Canvas vs CSS Display Size)
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    mousePos.current = {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
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
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full object-cover cursor-crosshair active:cursor-crosshair"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* UI Layer for Score is handled in UIOverlay, but we can have floating text if needed */}
    </div>
  );
};

export default GameEngine;