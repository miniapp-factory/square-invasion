'use client';

import { useEffect, useRef, useState } from 'react';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_X = GAME_WIDTH / 2;
const PLAYER_Y = GAME_HEIGHT - 50;
const ENEMY_SPAWN_INTERVAL = 2000; // ms
const ENEMY_SPEED = 1.5; // px per tick
const PROJECTILE_SPEED = 3; // px per tick

type Enemy = { id: number; x: number; y: number };
type Projectile = { id: number; x: number; y: number };

export default function Game() {
  const [state, setState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [playerX, setPlayerX] = useState(PLAYER_X);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const enemyIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Game loop
  useEffect(() => {
    if (state !== 'playing') return;
    const interval = setInterval(() => {
      // Move enemies
      setEnemies((prev) =>
        prev
          .map((e) => ({ ...e, y: e.y + ENEMY_SPEED }))
          .filter((e) => e.y < GAME_HEIGHT + 20)
      );
      // Move projectiles
      setProjectiles((prev) =>
        prev
          .map((p) => ({ ...p, y: p.y - PROJECTILE_SPEED }))
          .filter((p) => p.y > -20)
      );
      // Collision detection
      setEnemies((prevEnemies) => {
        const remaining = prevEnemies.filter((e) => {
          const hit = projectiles.some(
            (p) =>
              Math.abs(p.x - e.x) < 20 && Math.abs(p.y - e.y) < 20
          );
          return !hit;
        });
        return remaining;
      });
      setProjectiles((prev) => prev.filter((p) => p.y > -20));
      // Check for enemies reaching bottom
      if (enemies.some((e) => e.y > GAME_HEIGHT)) {
        setState('gameover');
      }
    }, 16);
    return () => clearInterval(interval);
  }, [state, enemies, projectiles]);

  // Enemy spawn
  useEffect(() => {
    if (state !== 'playing') return;
    const spawn = () => {
      const x = Math.random() * (GAME_WIDTH - 40) + 20;
      setEnemies((prev) => [
        ...prev,
        { id: enemyIdRef.current++, x, y: -20 },
      ]);
    };
    const interval = setInterval(spawn, ENEMY_SPAWN_INTERVAL);
    return () => clearInterval(interval);
  }, [state]);

  const handleShoot = () => {
    setProjectiles((prev) => [
      ...prev,
      { id: projectileIdRef.current++, x: playerX, y: PLAYER_Y - 20 },
    ]);
  };

  const handleMove = (dx: number) => {
    setPlayerX((prev) => Math.max(20, Math.min(GAME_WIDTH - 20, prev + dx)));
  };

  const renderStart = () => (
    <div className="flex flex-col items-center gap-4">
      <img src="/logo.png" alt="Invasion Logo" className="w-32 h-32" />
      <button
        className="px-6 py-2 bg-purple-500 rounded hover:bg-purple-600"
        onClick={() => setState('playing')}
      >
        Start Game
      </button>
    </div>
  );

  const renderGameOver = () => (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-4xl font-bold">Game Over</h1>
      <button
        className="px-6 py-2 bg-purple-500 rounded hover:bg-purple-600"
        onClick={() => {
          setEnemies([]);
          setProjectiles([]);
          setPlayerX(PLAYER_X);
          setState('playing');
        }}
      >
        Try Again
      </button>
    </div>
  );

  const renderGame = () => (
    <div
      ref={gameAreaRef}
      className="relative w-[400px] h-[600px] bg-gradient-to-b from-purple-700 via-blue-800 to-purple-900 overflow-hidden"
    >
      {/* Player */}
      <div
        className="absolute text-4xl"
        style={{ left: playerX - 15, top: PLAYER_Y }}
      >
        🚁
      </div>
      {/* Enemies */}
      {enemies.map((e) => (
        <div
          key={e.id}
          className="absolute text-3xl"
          style={{ left: e.x - 15, top: e.y }}
        >
          ✈️
        </div>
      ))}
      {/* Projectiles */}
      {projectiles.map((p) => (
        <div
          key={p.id}
          className="absolute text-2xl"
          style={{ left: p.x - 5, top: p.y }}
        >
          🟡
        </div>
      ))}
      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        <button
          className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-600"
          onClick={() => handleMove(-20)}
        >
          Left
        </button>
        <button
          className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-600"
          onClick={handleShoot}
        >
          Shoot
        </button>
        <button
          className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-600"
          onClick={() => handleMove(20)}
        >
          Right
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {state === 'start' && renderStart()}
      {state === 'playing' && renderGame()}
      {state === 'gameover' && renderGameOver()}
    </div>
  );
}
