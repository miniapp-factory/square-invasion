'use client';

import { useEffect, useRef, useState } from 'react';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_X = GAME_WIDTH / 2;
const PLAYER_Y = GAME_HEIGHT - 100;
const ENEMY_SPAWN_INTERVAL = 2000; // ms
const ENEMY_SPEED = 1.5; // px per tick
const PROJECTILE_SPEED = 3; // px per tick
const BORDER_SQUARE_SIZE = 10;
const BORDER_SPAWN_INTERVAL = 500; // ms
const BORDER_SPEED = 1.5; // px per tick
const SHADES = ['#8e44ad', '#9b59b6', '#a569bd', '#af7ac5', '#b795c0'];

type Enemy = { id: number; x: number; y: number };
type Projectile = { id: number; x: number; y: number };

export default function Game() {
  const [state, setState] = useState<'start' | 'playing' | 'gameover' | 'won'>('start');
  const [playerX, setPlayerX] = useState(PLAYER_X);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [enemyProjectiles, setEnemyProjectiles] = useState<Projectile[]>([]);
  const [firedEnemies, setFiredEnemies] = useState<Set<number>>(new Set());
  const [rainSquares, setRainSquares] = useState<
      { id: number; x: number; y: number; color: string }[]
    >([]);
  const rainIdRef = useRef(0);
  const [pinkSquares, setPinkSquares] = useState<
      { id: number; x: number; y: number; size: number; speed: number }[]
    >([]);
  const pinkIdRef = useRef(0);
  const [hitCount, setHitCount] = useState(0);
  const enemyIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const [powerUp, setPowerUp] = useState<
    { id: number; x: number; y: number; size: number; speed: number; type: 'first' | 'second' | 'third' } | null
  >(null);
  const powerUpIdRef = useRef(0);
  const [powerUpActive, setPowerUpActive] = useState(false);
  const [powerUpLevel, setPowerUpLevel] = useState<number>(1);
  const [secondPowerUpSpawned, setSecondPowerUpSpawned] = useState<boolean>(false);
  const [thirdPowerUpSpawned, setThirdPowerUpSpawned] = useState<boolean>(false);
  const [powerUpSpawned, setPowerUpSpawned] = useState(false);
  const [ufoSpawned, setUfoSpawned] = useState(false);
  const [ufos, setUfos] = useState<{
    id: number;
    x: number;
    y: number;
    direction: number;
    health: number;
  }[]>([]);
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
      // Move UFOs
      setUfos((prev) =>
        prev.map((u) => {
          let newX = u.x + u.direction * 0.5;
          if (newX < 20 || newX > GAME_WIDTH - 20) {
            newX = u.x - u.direction * 0.5;
            return { ...u, x: newX, direction: -u.direction };
          }
          return { ...u, x: newX };
        })
      );
      // Move projectiles
      setProjectiles((prev) =>
        prev
          .map((p) => ({ ...p, y: p.y - PROJECTILE_SPEED }))
          .filter((p) => p.y > -20)
      );
      // Move enemy projectiles
      setEnemyProjectiles((prev) =>
        prev
          .map((p) => ({ ...p, y: p.y + PROJECTILE_SPEED }))
          .filter((p) => p.y < GAME_HEIGHT)
      );
      // Collision detection: player vs enemy projectiles
      if (enemyProjectiles.some((p) => Math.abs(p.x - playerX) < 10 && Math.abs(p.y - PLAYER_Y) < 10)) {
        setState('gameover');
      }
      // Collision detection: player vs enemies
      setEnemies((prevEnemies) => {
        const hits = prevEnemies.filter((e) =>
          projectiles.some(
            (p) =>
              Math.abs(p.x - e.x) < 20 && Math.abs(p.y - e.y) < 20
          )
        );
        if (hits.length > 0) {
          setHitCount((prev) => prev + hits.length);
        }
        return prevEnemies.filter((e) =>
          !projectiles.some(
            (p) =>
              Math.abs(p.x - e.x) < 20 && Math.abs(p.y - e.y) < 20
          )
        );
      });

      // Power‑up collision
      if (powerUp) {
        const hitPower = projectiles.some(
          (p) =>
            Math.abs(p.x - powerUp.x) < powerUp.size / 2 &&
            Math.abs(p.y - powerUp.y) < powerUp.size / 2
        );
        if (hitPower) {
          if (powerUp.type === 'first') {
            setPowerUpActive(true);
          } else if (powerUp.type === 'second') {
            setPowerUpLevel(5);
          } else if (powerUp.type === 'third') {
            setPowerUpLevel(7);
          }
          setPowerUp(null);
        }
      }
      setProjectiles((prev) => prev.filter((p) => p.y > -20));
      // Check for enemies reaching bottom
      if (enemies.some((e) => e.y > GAME_HEIGHT)) {
        setState('gameover');
      }
      // Check win condition
      if (ufoSpawned && ufos.length === 0) {
        setState('won');
      }
      // Enemy shooting after 20s
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > 20000 && elapsed < 120000) {
        enemies.forEach((e) => {
          if (!firedEnemies.has(e.id)) {
            // first bullet
            setEnemyProjectiles((prev) => [
              ...prev,
              { id: projectileIdRef.current++, x: e.x, y: e.y },
            ]);
            // second bullet after 500ms
            setTimeout(() => {
              setEnemyProjectiles((prev) => [
                ...prev,
                { id: projectileIdRef.current++, x: e.x, y: e.y },
              ]);
            }, 500);
            setFiredEnemies((prev) => new Set(prev).add(e.id));
          }
        });
      }
    }, 16);
    return () => clearInterval(interval);
  }, [state, enemies, projectiles, enemyProjectiles, firedEnemies]);

  // Set win after 120 seconds
  useEffect(() => {
    if (state !== 'playing') return;
    const timer = setTimeout(() => {
      setState('won');
    }, 120000);
    return () => clearTimeout(timer);
  }, [state]);

  // Move rain squares
  useEffect(() => {
    if (state !== 'playing') return;
    const interval = setInterval(() => {
      setRainSquares((prev) =>
        prev
          .map((s) => ({ ...s, y: s.y + 2 }))
          .filter((s) => s.y < GAME_HEIGHT + 10)
      );
    }, 16);
    return () => clearInterval(interval);
  }, [state]);

  // Move pink squares
  useEffect(() => {
    if (state !== 'playing') return;
    const interval = setInterval(() => {
      setPinkSquares((prev) =>
        prev
          .map((s) => ({ ...s, y: s.y + s.speed }))
          .filter((s) => s.y < GAME_HEIGHT + s.size)
      );
    }, 16);
    return () => clearInterval(interval);
  }, [state]);

  // Move power‑up
  useEffect(() => {
    if (state !== 'playing' || !powerUp) return;
    const interval = setInterval(() => {
      setPowerUp((prev) =>
        prev
          ? {
              ...prev,
              y: prev.y + prev.speed,
            }
          : null
      );
    }, 16);
    return () => clearInterval(interval);
  }, [state, powerUp]);

  // Enemy spawn
  useEffect(() => {
    if (state !== 'playing') return;
    const spawn = () => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= 120000) return;
      const x = Math.random() * (GAME_WIDTH - 40) + 20;
      setEnemies((prev) => [
        ...prev,
        { id: enemyIdRef.current++, x, y: -20 },
      ]);
    };
    const interval = setInterval(spawn, ENEMY_SPAWN_INTERVAL);
    return () => clearInterval(interval);
  }, [state]);

  // Power‑up spawn after 10 s
  useEffect(() => {
    if (state !== 'playing' || powerUpSpawned) return;
    const timer = setTimeout(() => {
      const x = Math.random() * GAME_WIDTH;
      const size = 30;
      const speed = 1;
      setPowerUp({
        id: powerUpIdRef.current++,
        x,
        y: -size,
        size,
        speed,
        type: 'first',
      });
      setPowerUpSpawned(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [state, powerUpSpawned]);

  // Spawn UFOs after 60s
  useEffect(() => {
    if (state !== 'playing' || ufoSpawned) return;
    const timer = setTimeout(() => {
      const positions = [
        { x: 50, y: 20 },
        { x: GAME_WIDTH / 2, y: 20 },
        { x: GAME_WIDTH - 50, y: 20 },
      ];
      setUfos(
        positions.map((pos, idx) => ({
          id: idx,
          x: pos.x,
          y: pos.y,
          direction: 1,
          health: 20,
        }))
      );
      setUfoSpawned(true);
    }, 60000);
    return () => clearTimeout(timer);
  }, [state, ufoSpawned]);

  // Spawn second power‑up 30 s after game starts, only if first power‑up was shot
  useEffect(() => {
    if (!powerUpActive || secondPowerUpSpawned) return;
    const timer = setTimeout(() => {
      const x = Math.random() * GAME_WIDTH;
      const size = 30;
      const speed = 1;
      setPowerUp({
        id: powerUpIdRef.current++,
        x,
        y: -size,
        size,
        speed,
        type: 'second',
      });
      setSecondPowerUpSpawned(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [powerUpActive, secondPowerUpSpawned, startTimeRef.current]);

  // Spawn third power‑up 65 s after game starts, only if first power‑up was shot
  useEffect(() => {
    if (!powerUpActive || thirdPowerUpSpawned) return;
    const timer = setTimeout(() => {
      const x = Math.random() * GAME_WIDTH;
      const size = 30;
      const speed = 1;
      setPowerUp({
        id: powerUpIdRef.current++,
        x,
        y: -size,
        size,
        speed,
        type: 'third',
      });
      setThirdPowerUpSpawned(true);
    }, 65000);
    return () => clearTimeout(timer);
  }, [powerUpActive, thirdPowerUpSpawned, startTimeRef.current]);

  // Spawn pink squares
  useEffect(() => {
    if (state !== 'playing') return;
    const spawn = () => {
      const x = Math.random() * GAME_WIDTH;
      const size = Math.random() * 10 + 5; // 5 to 15 px
      const speed = Math.random() * 1.5 + 0.5; // 0.5 to 2 px per tick
      setPinkSquares((prev) => [
        ...prev,
        { id: pinkIdRef.current++, x, y: -size, size, speed },
      ]);
    };
    const interval = setInterval(spawn, 500);
    return () => clearInterval(interval);
  }, [state]);


  const handleShoot = () => {
    const offsets =
      powerUpLevel === 7
        ? [-30, -20, -10, 0, 10, 20, 30]
        : powerUpLevel === 5
        ? [-20, -10, 0, 10, 20]
        : powerUpActive
        ? [-10, 0, 10]
        : [0];
    setProjectiles((prev) => [
      ...prev,
      ...offsets.map((dx) => ({
        id: projectileIdRef.current++,
        x: playerX + dx,
        y: PLAYER_Y - 20,
      })),
    ]);
  };

  const handleMove = (dx: number) => {
    setPlayerX((prev) => Math.max(20, Math.min(GAME_WIDTH - 20, prev + dx)));
  };

  const renderStart = () => (
    <div className="flex flex-col items-center gap-4">
      <style jsx>{`
        .neon-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          background: hotpink;
          border-radius: 50%;
          animation: orbit 2s linear infinite, fade 2s linear infinite;
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(60px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
        }
        @keyframes fade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      <div className="relative flex items-center justify-center w-48 h-48">
        <img src="/logo.png" alt="Invasion Logo" className="w-32 h-32" />
        <div className="neon-dot" style={{ animationDelay: '0s' }} />
        <div className="neon-dot" style={{ animationDelay: '0.5s' }} />
        <div className="neon-dot" style={{ animationDelay: '1s' }} />
      </div>
      <p className="text-2xl mb-4 text-center" style={{color: '#39FF14'}}>
        Survive a 2 minute Enemy attack.
      </p>
      <p className="text-green-400 mb-4 text-center">
        Defend your Territory from the Enemy. Dodge Enemy Fire and Do Not let them pass. Shoot the ammo drop parachute to up upgrade your guns multiple times.
      </p>
      <button
        className="px-6 py-2 bg-purple-500 rounded hover:bg-purple-600"
        onClick={() => { setState('playing'); startTimeRef.current = Date.now(); }}
      >
        Start Game
      </button>
    </div>
  );

  const renderGameOver = () => (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-4xl font-bold">Game Over</h1>
      <div className="text-2xl">Score: {hitCount}</div>
      <button
        className="px-6 py-2 bg-purple-500 rounded hover:bg-purple-600"
        onClick={() => {
          setEnemies([]);
          setProjectiles([]);
          setEnemyProjectiles([]);
          setPlayerX(PLAYER_X);
          setPowerUpActive(false);
          setPowerUpSpawned(false);
          setPowerUp(null);
          setFiredEnemies(new Set());
          setPowerUpLevel(1);
          setSecondPowerUpSpawned(false);
          setThirdPowerUpSpawned(false);
          setHitCount(0);
          startTimeRef.current = Date.now();
          setState('playing');
        }}
      >
        Try Again
      </button>
    </div>
  );
  const renderWin = () => (
    <div className="flex flex-col items-center gap-4">
      <p className="text-4xl font-bold">Congratulations! You Have Defeated the Enemy</p>
      <button
        className="px-6 py-2 bg-purple-500 rounded hover:bg-purple-600"
        onClick={() => {
          setEnemies([]);
          setProjectiles([]);
          setEnemyProjectiles([]);
          setPlayerX(PLAYER_X);
          setPowerUpActive(false);
          setPowerUpSpawned(false);
          setPowerUp(null);
          setFiredEnemies(new Set());
          setPowerUpLevel(1);
          setSecondPowerUpSpawned(false);
          setHitCount(0);
          startTimeRef.current = Date.now();
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
      <div className="absolute top-2 left-2 text-white font-semibold">Hits: {hitCount}</div>
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
      {/* UFOs */}
      {ufos.map((u) => (
        <div
          key={u.id}
          className="absolute text-4xl"
          style={{ left: u.x - 15, top: u.y }}
        >
          🛸
        </div>
      ))}
      {/* Pink squares */}
      {pinkSquares.map((s) => (
        <div
          key={s.id}
          className="absolute"
          style={{
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            backgroundColor: 'hotpink',
            opacity: 0.3,
          }}
        />
      ))}

      {/* Projectiles */}
      {projectiles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: p.x - 1,
            top: p.y - 5,
            width: 2,
            height: 10,
            backgroundColor: 'yellow',
          }}
        />
      ))}
      {enemyProjectiles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: p.x - 3,
            top: p.y - 3,
            width: 6,
            height: 6,
            backgroundColor: 'red',
          }}
        />
      ))}

      {/* Power‑up */}
      {powerUp && (
        <div
          key={powerUp.id}
          className="absolute"
          style={{
            left: powerUp.x - powerUp.size / 2,
            top: powerUp.y - powerUp.size / 2,
            width: powerUp.size,
            height: powerUp.size,
            fontSize: powerUp.size,
            textAlign: 'center',
          }}
        >
          🪂
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        <button
          className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-600"
          onClick={() => handleMove(-40)}
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
          onClick={() => handleMove(40)}
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
      {state === 'won' && renderWin()}
    </div>
  );
}
