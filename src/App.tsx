import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameState, GameStats } from './game/GameEngine';
import { GameUI } from './game/GameUI';
import { soundEngine } from './game/audio';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('MENU');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    coins: 0,
    highScore: 0,
    speed: 18,
    activeShield: false,
    activeMagnet: false,
    activeRush: false,
    magnetTimeLeft: 0,
    rushTimeLeft: 0,
    turnPrompt: null,
    stumblesRemaining: 2,
    maxStumbles: 2,
    isBeastOnHeels: false,
    beastTimeLeft: 0,
    gameOverReason: null,
    screenSidesRed: false,
    impactFlash: false,
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize 3D Engine once
    const engine = new GameEngine(mountRef.current);
    engineRef.current = engine;

    engine.setCallbacks(
      (newStats) => setStats(newStats),
      (newState) => setGameState(newState)
    );

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-outfit select-none">
      {/* Isolated Three.js Canvas Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Game UI Overlay */}
      <GameUI
        engine={engineRef.current}
        gameState={gameState}
        stats={stats}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />
    </div>
  );
}
