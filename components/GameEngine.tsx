import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Entity, EntityType, Vector2 } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PROJECTILE_SPEED } from '../constants';

interface GameEngineProps {
  setGameState: (state: GameState) => void;
  gameState: GameState;
  onOpenContent: (type: EntityType) => void;
  onItemCollected: (type: EntityType) => void;
  collectedItems: EntityType[];
}

const GameEngine: React.FC<GameEngineProps> = ({ setGameState, gameState, onOpenContent, onItemCollected, collectedItems }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  
  // Game State Refs
  const BASE_PLAYER_Y = CANVAS_HEIGHT - 80;
  const playerPos = useRef<Vector2>({ x: CANVAS_WIDTH / 2, y: BASE_PLAYER_Y });
  const playerRotation = useRef<number>(0);
  
  // Input tracking
  const mousePos = useRef<Vector2>({ x: CANVAS_WIDTH / 2, y: 0 });
  const isFiring = useRef<boolean>(false);
  const muzzleFlash = useRef<number>(0);
  
  const keysPressed = useRef<Set<string>>(new Set());
  const entities = useRef<Entity[]>([]);
  const particles = useRef<Entity[]>([]);
  const lastShotTime = useRef<number>(0);
  const frameId = useRef<number>(0);
  const stars = useRef<{x: number, y: number, z: number, alpha: number}[]>([]);
  const screenShake = useRef<number>(0);
  const winSequenceStarted = useRef<boolean>(false);
  const timeRef = useRef<number>(0);

  // Initialize Stars with varying brightness
  useEffect(() => {
    stars.current = [];
    for(let i=0; i<150; i++) {
        stars.current.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            z: Math.random() * 2 + 0.2, // Depth
            alpha: Math.random()
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
            wobbleOffset: Math.random() * 100
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
            wobbleOffset: Math.random() * 100
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
            wobbleOffset: Math.random() * 100
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
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.code);
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

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on canvas itself
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

        if (gameState !== 'PLAYING' && gameState !== 'WIN') return;

        // 1. Player Aiming
        const dx = mousePos.current.x - playerPos.current.x;
        const dy = mousePos.current.y - playerPos.current.y;
        const angle = Math.atan2(dy, dx);
        playerRotation.current = angle + Math.PI / 2;

        // Soft position reset (Recoil recovery)
        playerPos.current.x += (CANVAS_WIDTH / 2 - playerPos.current.x) * 0.1;
        playerPos.current.y += (BASE_PLAYER_Y - playerPos.current.y) * 0.1;

        // 2. Shooting
        if ((keysPressed.current.has('Space') || isFiring.current) && !winSequenceStarted.current) {
            const now = Date.now();
            if (now - lastShotTime.current > 120) { // Faster fire rate
                const fireAngle = playerRotation.current - Math.PI / 2; 
                
                // Add Recoil
                const recoil = 6;
                playerPos.current.x -= Math.cos(fireAngle) * recoil;
                playerPos.current.y -= Math.sin(fireAngle) * recoil;
                muzzleFlash.current = 3; // 3 frames of flash

                entities.current.push({
                    id: Math.random().toString(),
                    type: EntityType.PROJECTILE,
                    position: { 
                        x: playerPos.current.x + Math.cos(fireAngle) * 25, 
                        y: playerPos.current.y + Math.sin(fireAngle) * 25 
                    },
                    velocity: { 
                        x: Math.cos(fireAngle) * PROJECTILE_SPEED, 
                        y: Math.sin(fireAngle) * PROJECTILE_SPEED 
                    },
                    size: 4,
                    health: 1,
                    color: '#ff00ff', // Hot pink
                    rotation: playerRotation.current,
                    trail: []
                });
                lastShotTime.current = now;
            }
        }

        // 3. Stars (Parallax Background)
        stars.current.forEach(star => {
            // Move stars down to simulate forward movement
            star.y += star.z * 1.5; 
            if (star.y > CANVAS_HEIGHT) {
                star.y = 0;
                star.x = Math.random() * CANVAS_WIDTH;
            }
            // Twinkle
            if (Math.random() < 0.05) star.alpha = Math.random();
        });

        // 4. Entity Logic (Improved AI)
        entities.current.forEach(entity => {
            // Update Trails
            if (entity.trail) {
                entity.trail.push({x: entity.position.x, y: entity.position.y});
                if (entity.trail.length > 8) entity.trail.shift();
            }

            // Hit Flash timer
            if (entity.hitFlash && entity.hitFlash > 0) {
                entity.hitFlash--;
            }

            if (entity.type === EntityType.PROJECTILE) {
                entity.position.x += entity.velocity.x;
                entity.position.y += entity.velocity.y;
            } else if (entity.type.includes('ENEMY')) {
                // Specific AI Behaviors
                const t = timeRef.current;
                
                // Base Movement
                entity.position.x += entity.velocity.x;
                entity.position.y += entity.velocity.y;

                // Bounce off walls
                if (entity.position.x <= 50 || entity.position.x >= CANVAS_WIDTH - 50) {
                    entity.velocity.x *= -1;
                }
                if (entity.position.y <= 50 || entity.position.y >= CANVAS_HEIGHT - 200) {
                    entity.velocity.y *= -1;
                }

                // AI Patterns
                if (entity.type === EntityType.ENEMY_MUSIC) {
                    // Sine Wave Movement
                    entity.position.x += Math.cos(t * 0.05) * 3;
                    entity.rotation = Math.cos(t * 0.05) * 0.2;
                } else if (entity.type === EntityType.ENEMY_ILLUSTRATION) {
                    // Jittery / Aggressive
                    if (Math.random() < 0.02) entity.velocity.x *= -1; // Random direction change
                    entity.rotation = Math.sin(t * 0.1) * 0.1;
                } else if (entity.type === EntityType.ENEMY_BAND) {
                    // Wide circles
                    entity.position.x += Math.sin(t * 0.03) * 2;
                    entity.position.y += Math.cos(t * 0.03) * 1;
                }
            }
        });

        // 5. Particles Physics
        particles.current.forEach(p => {
            p.position.x += p.velocity.x;
            p.position.y += p.velocity.y;
            p.velocity.x *= 0.92; // Friction
            p.velocity.y *= 0.92;
            p.size *= 0.96; // Shrink
            p.health--;
        });
        particles.current = particles.current.filter(p => p.health > 0);

        // Cleanup offscreen
        entities.current = entities.current.filter(e => 
            e.position.x > -100 && e.position.x < CANVAS_WIDTH + 100 &&
            e.position.y > -100 && e.position.y < CANVAS_HEIGHT + 100 && 
            e.health > 0
        );

        // 6. Collision Detection
        if (!winSequenceStarted.current) {
            const projectiles = entities.current.filter(e => e.type === EntityType.PROJECTILE);
            const enemies = entities.current.filter(e => e.type.includes('ENEMY'));

            projectiles.forEach(proj => {
                enemies.forEach(enemy => {
                    // Simple Box/Circle hybrid collision is efficiently mostly
                    const dx = proj.position.x - enemy.position.x;
                    const dy = proj.position.y - enemy.position.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);

                    if (dist < enemy.size + proj.size) {
                        proj.health = 0; // Destroy projectile
                        
                        // Hit Feedback
                        enemy.health--;
                        enemy.hitFlash = 4; // Flash for 4 frames
                        
                        // Small particle hit effect
                        createExplosion(proj.position.x, proj.position.y, '#fff', 5, 5);

                        if (enemy.health <= 0) {
                            // Big Explosion
                            createExplosion(enemy.position.x, enemy.position.y, enemy.color, 30, 12);
                            onItemCollected(enemy.type); 
                            onOpenContent(enemy.type);
                            setScore(s => s + 1000);
                        }
                    }
                });
            });
            
            // Win Condition Check
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
        
        // 1. Background Clean (Dark Purple Tint)
        ctx.fillStyle = '#050308';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Shake Camera
        ctx.save();
        if (screenShake.current > 0) {
            const dx = (Math.random() - 0.5) * screenShake.current;
            const dy = (Math.random() - 0.5) * screenShake.current;
            ctx.translate(dx, dy);
        }

        // 2. Synthwave Perspective Grid
        ctx.lineWidth = 1;
        const time = timeRef.current;
        
        // Vertical perspective lines (Fanning out)
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)'; // Pink faint
        ctx.beginPath();
        const vanishingPointY = -200;
        const gridWidth = CANVAS_WIDTH * 2;
        for (let i = -gridWidth; i <= gridWidth; i += 100) {
             ctx.moveTo(CANVAS_WIDTH/2, vanishingPointY);
             ctx.lineTo(i + CANVAS_WIDTH/2, CANVAS_HEIGHT);
        }
        ctx.stroke();

        // Horizontal moving lines (The "Floor" effect)
        // Creates illusion of moving forward
        const speed = 2;
        const gridOffset = (time * speed) % 80;
        ctx.beginPath();
        for (let i = 0; i < CANVAS_HEIGHT; i += 80) {
            // Perspective spacing calculation could be complex, keeping linear for retro feel
            // but fading out near top
            const y = i + gridOffset;
            if (y > CANVAS_HEIGHT) continue;
            
            const alpha = Math.max(0, (y / CANVAS_HEIGHT) * 0.3); // Fade out at top
            ctx.strokeStyle = `rgba(236, 72, 153, ${alpha})`;
            
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
        }
        ctx.stroke();


        // 3. Stars
        stars.current.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            const size = Math.max(0.5, star.z);
            ctx.fillRect(star.x, star.y, size, size);
        });

        // 4. Draw Trails (Projectiles)
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        entities.current.forEach(e => {
            if (e.type === EntityType.PROJECTILE && e.trail && e.trail.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = e.color;
                ctx.lineWidth = e.size;
                ctx.shadowBlur = 10;
                ctx.shadowColor = e.color;
                
                // Draw line through trail points
                ctx.moveTo(e.trail[0].x, e.trail[0].y);
                for(let i=1; i<e.trail.length; i++) {
                    ctx.lineTo(e.trail[i].x, e.trail[i].y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        });

        // 5. Draw Entities (Enemies & Projectiles)
        entities.current.forEach(e => {
            if (e.health <= 0) return; 
            
            ctx.save();
            ctx.translate(e.position.x, e.position.y);
            
            // Hit Flash Effect (White overlay)
            const isHit = e.hitFlash && e.hitFlash > 0;
            
            if (e.type.includes('ENEMY')) {
                 ctx.rotate(e.rotation || 0);
                 const hover = Math.sin(timeRef.current / 20 + (e.wobbleOffset || 0)) * 4;
                 ctx.translate(0, hover);
            } else if (e.type === EntityType.PROJECTILE) {
                ctx.rotate(e.rotation || 0);
            }

            // Draw based on type
            if (e.type === EntityType.PROJECTILE) {
                ctx.fillStyle = '#fff'; // Core is white
                ctx.shadowBlur = 15;
                ctx.shadowColor = e.color;
                ctx.beginPath();
                // Glowing Orb/Bullet
                ctx.arc(0, 0, e.size, 0, Math.PI*2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                // Enemies
                const color = isHit ? '#ffffff' : e.color;
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.shadowBlur = isHit ? 20 : 15;
                ctx.shadowColor = color;
                
                if (e.type === EntityType.ENEMY_ILLUSTRATION) {
                    // Symbol: Circle with Ink Drop
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
                    // Symbol: Audio Wave
                    ctx.beginPath();
                    // Audio bars visual
                    for(let i=-20; i<=20; i+=8) {
                        const h = 10 + Math.random() * 10; // Jittering bars
                        ctx.moveTo(i, -h);
                        ctx.lineTo(i, h);
                    }
                    ctx.stroke();
                } else if (e.type === EntityType.ENEMY_BAND) {
                    // Symbol: Connected Nodes
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

                // Enemy Labels
                if (!isHit) {
                    ctx.rotate(-(e.rotation || 0)); // Keep text straight
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px "Press Start 2P"';
                    ctx.textAlign = 'center';
                    // Simplify label display for new long names
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

        // 6. Draw Particles
        particles.current.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.health / 30;
            ctx.beginPath();
            ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // 7. Player Draw
        const { x, y } = playerPos.current;
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
            ctx.arc(0, -25, 15 + Math.random() * 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Ship
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ec4899'; 
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(15, 15);
        ctx.lineTo(0, 5);
        ctx.lineTo(-15, 15);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.restore();

        // 8. Score
        ctx.fillStyle = '#ec4899';
        ctx.font = '16px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ec4899';
        ctx.fillText(`LOVE: ${score}`, 20, 30);
        ctx.shadowBlur = 0;

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
        draw(); // Single draw for pause state
    }

    return () => cancelAnimationFrame(frameId.current);
  }, [gameState, onOpenContent, triggerWinSequence, onItemCollected, collectedItems]);

  // Input Handlers
  const handleUpdateInput = (x: number, y: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    mousePos.current = {
        x: (x - rect.left) * scaleX,
        y: (y - rect.top) * scaleY
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
        className="w-full h-full object-contain image-pixelated cursor-crosshair active:cursor-crosshair"
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