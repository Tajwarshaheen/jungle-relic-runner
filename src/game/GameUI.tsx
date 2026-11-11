import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  HelpCircle,
  Trophy,
  Shield,
  Magnet,
  Zap,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  X,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameState, GameStats, GameEngine } from './GameEngine';
import { soundEngine } from './audio';

interface GameUIProps {
  engine: GameEngine | null;
  gameState: GameState;
  stats: GameStats;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({
  engine,
  gameState,
  stats,
  isMuted,
  onToggleMute,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(true);

  // Trigger celebration confetti when new high score is achieved on Game Over
  React.useEffect(() => {
    if (gameState === 'GAME_OVER' && stats.score > 0 && stats.score >= stats.highScore) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#eab308', '#facc15', '#34d399', '#38bdf8'],
        });
      } catch {
        // Safe fallback if confetti canvas not ready
      }
    }
  }, [gameState, stats.score, stats.highScore]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between">
      {/* =========================================================================
          1. IN-GAME HUD (Top bar during PLAYING & PAUSED)
          ========================================================================= */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <div className="w-full p-3 md:p-6 flex items-start justify-between">
          {/* Left stats: Score & Distance */}
          <div className="flex flex-col gap-1.5 pointer-events-auto">
            {/* Main Score */}
            <div className="bg-stone-900/85 backdrop-blur-md border border-amber-500/30 rounded-xl px-4 py-2 shadow-xl flex items-baseline gap-2.5">
              <span className="text-xs uppercase tracking-wider text-amber-400/90 font-bold">
                SCORE
              </span>
              <span className="font-cinzel text-2xl md:text-3xl font-black text-amber-300 tracking-wider">
                {stats.score.toLocaleString()}
              </span>
            </div>

            {/* Distance & Multiplier */}
            <div className="flex items-center gap-2">
              <div className="bg-stone-900/75 border border-stone-700/60 rounded-lg px-3 py-1 text-xs font-semibold text-stone-300 flex items-center gap-1.5 shadow-md">
                <span className="text-emerald-400">{stats.distance}m</span>
              </div>
              <div className="bg-stone-900/75 border border-stone-700/60 rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-400 flex items-center gap-1 shadow-md">
                <span>{stats.speed} m/s</span>
              </div>
            </div>
          </div>

          {/* Center: Stumbles / Lives & Active Power-up Badges */}
          <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
            {/* 2-Life System */}
            <div className="bg-stone-900/90 backdrop-blur-md border border-stone-700/80 rounded-xl px-3 py-1 flex items-center gap-2 shadow-xl">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-300">
                LIVES:
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2].map((strikeIdx) => {
                  const isAlive = stats.stumblesRemaining >= strikeIdx;
                  return (
                    <div
                      key={strikeIdx}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition-all ${
                        isAlive
                          ? 'bg-rose-950/80 border border-rose-500/90 shadow-sm scale-100'
                          : 'bg-stone-950/90 border border-stone-800 text-stone-600 scale-90 opacity-40'
                      }`}
                      title={isAlive ? `Life ${strikeIdx} active` : `Life ${strikeIdx} lost!`}
                    >
                      {isAlive ? '❤️' : '💀'}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Power-up badges */}
            <div className="flex items-center gap-2">
              {stats.activeShield && (
                <div className="bg-cyan-950/90 border border-cyan-400/60 rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 animate-bounce">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] font-bold text-cyan-300">SHIELD</span>
                </div>
              )}
              {stats.activeMagnet && (
                <div className="bg-rose-950/90 border border-rose-400/60 rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-lg shadow-rose-950/50">
                  <Magnet className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[11px] font-bold text-rose-300">{stats.magnetTimeLeft}s</span>
                </div>
              )}
              {stats.activeRush && (
                <div className="bg-amber-950/90 border border-amber-400/60 rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-lg shadow-amber-950/50">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-bold text-amber-300">{stats.rushTimeLeft}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Right stats: Coins & Pause & Sound */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Coins collected */}
            <div className="bg-stone-900/85 backdrop-blur-md border border-yellow-500/40 rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border border-yellow-300 flex items-center justify-center shadow-sm">
                <Sparkles className="w-3 h-3 text-stone-900" />
              </div>
              <span className="font-cinzel text-lg md:text-xl font-bold text-yellow-300">
                {stats.coins}
              </span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={onToggleMute}
              className="p-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition shadow-lg active:scale-95 cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>

            {/* Pause Button */}
            <button
              onClick={() => engine?.togglePause()}
              className="p-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition shadow-lg active:scale-95 cursor-pointer"
              title="Pause (P or Esc)"
            >
              <Pause className="w-5 h-5 text-amber-300" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          DYNAMIC SCREEN BOTH SIDES RED (Triggered when hit 1st time by obstacle)
          ========================================================================= */}
      {gameState === 'PLAYING' && stats.screenSidesRed && (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
          {/* Left Side Red Warning Bar & Inner Glow */}
          <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-28 md:w-40 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-r from-red-600/90 via-red-600/40 to-transparent shadow-[inset_30px_0_45px_rgba(239,68,68,0.85)] animate-pulse" />
            <div className="absolute top-0 bottom-0 left-0 w-2.5 sm:w-3 bg-gradient-to-b from-red-500 via-rose-500 to-red-600 shadow-[0_0_25px_#ef4444]" />
          </div>

          {/* Right Side Red Warning Bar & Inner Glow */}
          <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-28 md:w-40 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-l from-red-600/90 via-red-600/40 to-transparent shadow-[inset_-30px_0_45px_rgba(239,68,68,0.85)] animate-pulse" />
            <div className="absolute top-0 bottom-0 right-0 w-2.5 sm:w-3 bg-gradient-to-b from-red-500 via-rose-500 to-red-600 shadow-[0_0_25px_#ef4444]" />
          </div>

          {/* Subtle perimeter danger vignette */}
          <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(220,38,38,0.55)] animate-pulse" />

          {/* Critical Warning Alert Banner */}
          <div className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-gradient-to-r from-red-950/95 via-rose-950/95 to-red-950/95 border-2 border-red-500 text-red-100 px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-bounce">
              <span className="text-2xl animate-pulse">⚠️</span>
              <div className="flex flex-col text-left">
                <span className="font-cinzel font-black tracking-wider text-sm sm:text-base text-red-300">
                  CRITICAL: HIT TAKEN! LAST LIFE!
                </span>
                <span className="text-[11px] text-red-200/95 font-semibold">
                  Next obstacle collision = Game Over! Dodge now!
                </span>
              </div>
              <div className="bg-red-600 px-3 py-1 rounded-xl text-white font-mono font-black text-xs animate-pulse">
                1 HIT LEFT
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Immediate Fullscreen Impact Flash */}
      {gameState === 'PLAYING' && stats.impactFlash && (
        <div className="fixed inset-0 bg-red-600/35 pointer-events-none z-50 transition-opacity duration-150" />
      )}

      {/* =========================================================================
          DYNAMIC BEAST PURSUIT ALERT (During start chase or beast surge)
          ========================================================================= */}
      {gameState === 'PLAYING' && stats.isBeastOnHeels && !stats.screenSidesRed && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(225,29,72,0.4)] animate-pulse" />

          {/* Beast Banner */}
          <div className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-rose-950/95 border-2 border-rose-500 text-rose-100 px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-bounce">
              <span className="text-2xl animate-pulse">👹</span>
              <div className="flex flex-col text-left">
                <span className="font-cinzel font-black tracking-wider text-sm sm:text-base text-rose-300">
                  DEMON BEAST ON YOUR HEELS!
                </span>
                <span className="text-[11px] text-rose-200/90 font-semibold">
                  Escape the demon! Keep running cleanly!
                </span>
              </div>
              <div className="bg-rose-600/90 px-2.5 py-1 rounded-xl text-white font-mono font-black text-sm">
                {stats.beastTimeLeft}s
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DYNAMIC 90-DEGREE CORNER TURN ALERT BANNER
          ========================================================================= */}
      {gameState === 'PLAYING' && stats.turnPrompt && (
        <div className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-2 border-yellow-200 text-stone-950 font-black px-6 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
            {stats.turnPrompt === 'left' ? (
              <>
                <ArrowLeft className="w-8 h-8 stroke-[3] animate-pulse" />
                <span className="font-cinzel text-xl md:text-2xl tracking-wider">TURN LEFT!</span>
              </>
            ) : (
              <>
                <span className="font-cinzel text-xl md:text-2xl tracking-wider">TURN RIGHT!</span>
                <ArrowRight className="w-8 h-8 stroke-[3] animate-pulse" />
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          2. MOBILE ON-SCREEN ARROW CONTROLS (During PLAYING)
          ========================================================================= */}
      {gameState === 'PLAYING' && showMobileControls && (
        <div className="p-4 flex items-end justify-between pointer-events-none mb-2">
          {/* Left / Right turn buttons */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                engine?.triggerLeft();
              }}
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xl backdrop-blur-sm transition active:scale-90 ${
                stats.turnPrompt === 'left'
                  ? 'bg-yellow-400 text-stone-950 border-yellow-200 ring-4 ring-yellow-400 animate-pulse scale-105'
                  : 'bg-stone-900/75 active:bg-amber-600/80 border-amber-500/40 text-amber-300'
              }`}
              aria-label="Move Left or Turn 90 Left"
            >
              <ArrowLeft className="w-7 h-7 stroke-[2.5]" />
            </button>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                engine?.triggerRight();
              }}
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xl backdrop-blur-sm transition active:scale-90 ${
                stats.turnPrompt === 'right'
                  ? 'bg-yellow-400 text-stone-950 border-yellow-200 ring-4 ring-yellow-400 animate-pulse scale-105'
                  : 'bg-stone-900/75 active:bg-amber-600/80 border-amber-500/40 text-amber-300'
              }`}
              aria-label="Move Right or Turn 90 Right"
            >
              <ArrowRight className="w-7 h-7 stroke-[2.5]" />
            </button>
          </div>

          {/* Jump / Slide buttons */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                engine?.triggerSlide();
              }}
              className="w-14 h-14 rounded-2xl bg-stone-900/75 active:bg-amber-600/80 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-xl backdrop-blur-sm transition active:scale-90"
              aria-label="Slide"
            >
              <ArrowDown className="w-7 h-7 stroke-[2.5]" />
            </button>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                engine?.triggerJump();
              }}
              className="w-14 h-14 rounded-2xl bg-amber-600/80 active:bg-amber-500 border border-amber-400 flex items-center justify-center text-stone-950 font-black shadow-xl backdrop-blur-sm transition active:scale-90"
              aria-label="Jump"
            >
              <ArrowUp className="w-7 h-7 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. START MENU OVERLAY
          ========================================================================= */}
      {gameState === 'MENU' && (
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/40 to-transparent flex flex-col justify-between p-6 pointer-events-auto">
          {/* Top Bar with sound and instructions */}
          <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2 bg-stone-900/80 border border-amber-500/30 rounded-xl px-3 py-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs uppercase font-semibold text-stone-400">BEST RECORD</span>
              <span className="font-cinzel text-amber-300 font-bold ml-1">
                {stats.highScore.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold">Controls</span>
              </button>

              <button
                onClick={onToggleMute}
                className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 transition cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Central Title & Play Action */}
          <div className="max-w-xl mx-auto text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Ancient Temple Runner 3D
            </div>

            <h1 className="font-cinzel text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-600 tracking-wider text-gold-glow mb-2">
              JUNGLE RELIC
            </h1>
            <h2 className="font-cinzel text-2xl sm:text-4xl font-extrabold text-amber-400/90 tracking-widest mb-6">
              RUNNER
            </h2>

            <p className="text-stone-300 text-sm max-w-md mx-auto mb-8 drop-shadow-md">
              Dash through ancient Mayan stone causeways, leap across crumbling chasm bridges, slide under trapped lintels, and snatch sacred relics!
            </p>

            <button
              onClick={() => engine?.startGame()}
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-stone-950 font-black font-cinzel text-xl tracking-wider shadow-2xl shadow-amber-500/40 hover:shadow-amber-400/60 transition transform hover:-translate-y-1 active:translate-y-0.5 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-stone-950" />
              <span>RUN NOW</span>
            </button>

            <div className="mt-4 text-xs text-stone-400 flex items-center gap-3">
              <span>Press <kbd className="bg-stone-800 border border-stone-600 px-1.5 py-0.5 rounded text-stone-200">SPACE</kbd> or Click to Start</span>
            </div>
          </div>

          {/* Bottom control preview hints */}
          <div className="max-w-2xl mx-auto w-full grid grid-cols-4 gap-2 text-center text-[11px] text-stone-400">
            <div className="bg-stone-900/60 border border-stone-800 rounded-lg py-1.5">
              <span className="text-amber-400 font-bold block">A / ←</span> Left Lane
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-lg py-1.5">
              <span className="text-amber-400 font-bold block">D / →</span> Right Lane
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-lg py-1.5">
              <span className="text-amber-400 font-bold block">W / ↑ / SPACE</span> Jump
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-lg py-1.5">
              <span className="text-amber-400 font-bold block">S / ↓</span> Slide
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. PAUSE SCREEN
          ========================================================================= */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-6 pointer-events-auto">
          <div className="bg-stone-900 border border-amber-500/40 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <h2 className="font-cinzel text-3xl font-black text-amber-300 mb-2">
              GAME PAUSED
            </h2>
            <p className="text-stone-400 text-xs mb-6">Take a breath before returning to the temple!</p>

            <div className="space-y-3">
              <button
                onClick={() => engine?.togglePause()}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold font-cinzel text-lg flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-stone-950" />
                <span>RESUME</span>
              </button>

              <button
                onClick={() => engine?.restartGame()}
                className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-300 font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RESTART</span>
              </button>

              <button
                onClick={() => engine?.goToMenu()}
                className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 font-semibold text-sm transition cursor-pointer"
              >
                <span>MAIN MENU</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. GAME OVER MODAL
          ========================================================================= */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-6 pointer-events-auto">
          <div className="bg-stone-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
            <span className="text-xs uppercase tracking-widest font-extrabold text-rose-400">
              EXPEDITION HALTED
            </span>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-black text-amber-300 mb-4 mt-1">
              RUN OVER
            </h2>

            {/* High Score Celebration Banner */}
            {stats.score >= stats.highScore && stats.score > 0 && (
              <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/50 rounded-xl py-2 px-3 mb-5 flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-amber-300 animate-bounce" />
                <span className="text-amber-200 font-bold text-xs uppercase tracking-wider">
                  NEW PERSONAL BEST!
                </span>
              </div>
            )}

            {/* Score Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5">
                <span className="text-[11px] text-stone-400 uppercase font-bold block mb-1">FINAL SCORE</span>
                <span className="font-cinzel text-2xl sm:text-3xl font-black text-amber-300">
                  {stats.score.toLocaleString()}
                </span>
              </div>

              <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5">
                <span className="text-[11px] text-stone-400 uppercase font-bold block mb-1">ALL-TIME BEST</span>
                <span className="font-cinzel text-2xl sm:text-3xl font-black text-amber-400">
                  {stats.highScore.toLocaleString()}
                </span>
              </div>

              <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3">
                <span className="text-[11px] text-stone-400 uppercase font-bold block mb-1">DISTANCE</span>
                <span className="font-cinzel text-xl font-bold text-emerald-400">
                  {stats.distance} m
                </span>
              </div>

              <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3">
                <span className="text-[11px] text-stone-400 uppercase font-bold block mb-1">COINS SNATCHED</span>
                <span className="font-cinzel text-xl font-bold text-yellow-300">
                  {stats.coins}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => engine?.restartGame()}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-stone-950 font-cinzel font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 hover:shadow-amber-400/50 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                <span>RUN AGAIN</span>
              </button>

              <button
                onClick={() => engine?.goToMenu()}
                className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 font-semibold text-sm transition cursor-pointer"
              >
                <span>MAIN MENU</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. HOW TO PLAY MODAL
          ========================================================================= */}
      {showHelp && (
        <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-6 z-50 pointer-events-auto">
          <div className="bg-stone-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-left shadow-2xl relative">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-cinzel text-2xl font-black text-amber-300 mb-1 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-amber-400" />
              HOW TO PLAY
            </h3>
            <p className="text-stone-400 text-xs mb-5">
              Navigate the 3-lane temple pathway, evade fatal traps, and grab relics.
            </p>

            <div className="space-y-4 text-xs">
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3">
                <span className="font-bold text-amber-400 text-sm block mb-1">Movement Controls</span>
                <ul className="space-y-1 text-stone-300">
                  <li>• <strong className="text-white">A / ← / Swipe Left:</strong> Move to left lane / Turn 90° Left at corners</li>
                  <li>• <strong className="text-white">D / → / Swipe Right:</strong> Move to right lane / Turn 90° Right at corners</li>
                  <li>• <strong className="text-white">W / ↑ / SPACE / Swipe Up:</strong> Jump over logs, spike barricades & chasm gaps</li>
                  <li>• <strong className="text-white">S / ↓ / Swipe Down:</strong> Slide under hanging stone lintels & vines</li>
                </ul>
              </div>

              <div className="bg-stone-950/70 border border-amber-500/30 rounded-xl p-3">
                <span className="font-bold text-amber-300 text-sm block mb-1">90° Corner Turns</span>
                <p className="text-stone-300 leading-relaxed">
                  When approaching a dead-end temple wall with glowing arrows, swipe or press <strong className="text-amber-300">Left</strong> or <strong className="text-amber-300">Right</strong> to turn 90 degrees! Turn before reaching the wall or you'll crash.
                </p>
              </div>

              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3">
                <span className="font-bold text-amber-400 text-sm block mb-1">Obstacles & 2-Life System</span>
                <ul className="space-y-1 text-stone-300">
                  <li>• <strong className="text-white">1st Hit:</strong> Causes damage! Screen sides light up red and the demon beast snaps right behind you!</li>
                  <li>• <strong className="text-white">2nd Hit:</strong> Fatal crash! The beast captures you — Game Over!</li>
                  <li>• <strong className="text-white">Low Obstacles (Logs & Barricades):</strong> Jump over them cleanly.</li>
                  <li>• <strong className="text-white">High Obstacles (Carved Lintels):</strong> Slide underneath them.</li>
                  <li>• <strong className="text-white">Giant Idols & Pillars:</strong> Switch lanes to bypass them.</li>
                  <li>• <strong className="text-white">Chasm Gaps:</strong> Jump over the broken track or stay in a solid lane!</li>
                </ul>
              </div>

              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3">
                <span className="font-bold text-amber-400 text-sm block mb-1">Power-ups</span>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-stone-900 border border-cyan-500/30 rounded-lg p-2 text-center">
                    <Shield className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                    <span className="font-bold text-cyan-300 block">SHIELD</span>
                    <span className="text-[10px] text-stone-400">Absorbs 1 hit</span>
                  </div>
                  <div className="bg-stone-900 border border-rose-500/30 rounded-lg p-2 text-center">
                    <Magnet className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                    <span className="font-bold text-rose-300 block">MAGNET</span>
                    <span className="text-[10px] text-stone-400">Attracts coins</span>
                  </div>
                  <div className="bg-stone-900 border border-amber-500/30 rounded-lg p-2 text-center">
                    <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <span className="font-bold text-amber-300 block">RUSH</span>
                    <span className="text-[10px] text-stone-400">Invincible sprint</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold font-cinzel text-sm transition cursor-pointer"
            >
              GOT IT, LET'S RUN!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
