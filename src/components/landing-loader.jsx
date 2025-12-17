"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SkipForward, Play, AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";

export function LandingLoader({ onComplete }) {
	const canvasRef = useRef(null);
	const requestRef = useRef(null);

	// Game State Refs
	const rocketRef = useRef({ x: 0, y: 0, vx: 0, width: 40, height: 60 });
	const asteroidsRef = useRef([]);
	const starsRef = useRef([]);
	const scoreRef = useRef(0);
	const gameSpeedRef = useRef(5);
	const frameCountRef = useRef(0);
	const gameStateRef = useRef('playing');
	const keysRef = useRef({ left: false, right: false });

	// React State
	const [gameState, setGameState] = useState('playing');
	const [score, setScore] = useState(0);
	const [exit, setExit] = useState(false);
	const [showInstructions, setShowInstructions] = useState(true);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		const handleResize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			rocketRef.current.x = canvas.width / 2;
			rocketRef.current.y = canvas.height - 100;
		};
		window.addEventListener('resize', handleResize);
		handleResize();

		// Keyboard Listeners
		const handleKeyDown = (e) => {
			if (e.key === 'ArrowLeft') {
				keysRef.current.left = true;
				setShowInstructions(false);
			}
			if (e.key === 'ArrowRight') {
				keysRef.current.right = true;
				setShowInstructions(false);
			}
		};
		const handleKeyUp = (e) => {
			if (e.key === 'ArrowLeft') keysRef.current.left = false;
			if (e.key === 'ArrowRight') keysRef.current.right = false;
		};
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		// Init Stars
		starsRef.current = Array.from({ length: 100 }, () => ({
			x: Math.random() * canvas.width,
			y: Math.random() * canvas.height,
			size: Math.random() * 2 + 0.5,
			speed: Math.random() * 3 + 1
		}));

		const startGame = () => {
			rocketRef.current.x = canvas.width / 2;
			rocketRef.current.vx = 0;
			asteroidsRef.current = [];
			scoreRef.current = 0;
			gameSpeedRef.current = 5;
			frameCountRef.current = 0;
			gameStateRef.current = 'playing';
			setGameState('playing');
			setShowInstructions(true);
		};
		startGame();

		// --- GAME LOOP ---
		const animate = () => {
			if (exit) return;

			// Clear
			ctx.fillStyle = '#020617';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Update Stars
			ctx.fillStyle = '#ffffff';
			starsRef.current.forEach(star => {
				star.y += star.speed * (gameStateRef.current === 'playing' ? 1 : 0.2);
				if (star.y > canvas.height) {
					star.y = 0;
					star.x = Math.random() * canvas.width;
				}
				ctx.globalAlpha = Math.random() * 0.5 + 0.3;
				ctx.beginPath();
				ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
				ctx.fill();
			});
			ctx.globalAlpha = 1;

			if (gameStateRef.current === 'playing') {
				frameCountRef.current++;
				scoreRef.current++;
				setScore(Math.floor(scoreRef.current / 10));

				// Difficulty
				if (frameCountRef.current % 600 === 0) gameSpeedRef.current += 1;

				// Controls (Rocket Movement)
				const speed = 7;
				const r = rocketRef.current;

				// Acceleration / Friction for smoothness
				if (keysRef.current.left) r.vx = -speed;
				else if (keysRef.current.right) r.vx = speed;
				else r.vx *= 0.8; // Friction

				r.x += r.vx;

				// Clamp
				if (r.x < 20) r.x = 20;
				if (r.x > canvas.width - 20) r.x = canvas.width - 20;

				// Spawn Asteroids
				if (frameCountRef.current % Math.max(20, 60 - gameSpeedRef.current * 2) === 0) {
					const size = Math.random() * 40 + 20;
					asteroidsRef.current.push({
						x: Math.random() * (canvas.width - size),
						y: -100,
						size: size,
						speed: gameSpeedRef.current + Math.random() * 2,
						rotation: Math.random() * Math.PI,
						rotSpeed: (Math.random() - 0.5) * 0.1,
						shape: Array.from({ length: 6 }, () => Math.random() * 0.4 + 0.8)
					});
				}
			}

			// Render Rocket
			const r = rocketRef.current;
			ctx.save();
			ctx.translate(r.x, r.y);
			// Tilt effect
			ctx.rotate(r.vx * 0.05);

			// Flame
			if (gameStateRef.current === 'playing') {
				ctx.fillStyle = '#f59e0b';
				ctx.beginPath();
				ctx.moveTo(-8, 20);
				ctx.lineTo(0, 40 + Math.random() * 20);
				ctx.lineTo(8, 20);
				ctx.fill();
			}

			// Body
			ctx.fillStyle = '#e2e8f0';
			ctx.beginPath();
			ctx.moveTo(0, -30);
			ctx.quadraticCurveTo(15, 0, 15, 20);
			ctx.lineTo(-15, 20);
			ctx.quadraticCurveTo(-15, 0, 0, -30);
			ctx.fill();

			// Fins
			ctx.fillStyle = '#ef4444';
			ctx.beginPath();
			ctx.moveTo(-15, 10);
			ctx.lineTo(-25, 25);
			ctx.lineTo(-15, 20);
			ctx.fill();
			ctx.beginPath();
			ctx.moveTo(15, 10);
			ctx.lineTo(25, 25);
			ctx.lineTo(15, 20);
			ctx.fill();

			// Window
			ctx.fillStyle = '#0ea5e9';
			ctx.beginPath();
			ctx.arc(0, -5, 6, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();

			// Asteroids
			for (let i = asteroidsRef.current.length - 1; i >= 0; i--) {
				const a = asteroidsRef.current[i];
				if (gameStateRef.current === 'playing') {
					a.y += a.speed;
					a.rotation += a.rotSpeed;
				}

				// Draw Asteroid
				ctx.save();
				ctx.translate(a.x, a.y);
				ctx.rotate(a.rotation);
				ctx.fillStyle = '#64748b';
				ctx.beginPath();
				for (let j = 0; j < 6; j++) {
					const angle = (j / 6) * Math.PI * 2;
					const radius = a.size * a.shape[j];
					const px = Math.cos(angle) * radius;
					const py = Math.sin(angle) * radius;
					if (j === 0) ctx.moveTo(px, py);
					else ctx.lineTo(px, py);
				}
				ctx.closePath();
				ctx.fill();
				// Detail
				ctx.fillStyle = '#475569';
				ctx.beginPath();
				ctx.arc(a.size * 0.3, -a.size * 0.2, a.size * 0.2, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();

				// Collision
				if (gameStateRef.current === 'playing') {
					const dx = a.x - r.x;
					const dy = a.y - r.y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					if (dist < a.size * 0.8 + 15) {
						gameStateRef.current = 'gameover';
						setGameState('gameover');
					}
				}

				if (a.y > canvas.height + 50) asteroidsRef.current.splice(i, 1);
			}

			requestRef.current = requestAnimationFrame(animate);
		};

		requestRef.current = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(requestRef.current);
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [exit]);

	// Mobile Touch Support (Fallback)
	const onTouchMove = (e) => {
		if (gameStateRef.current !== 'playing') return;
		if (e.touches[0]) rocketRef.current.x = e.touches[0].clientX;
	};

	const handleReset = () => {
		rocketRef.current.x = window.innerWidth / 2;
		asteroidsRef.current = [];
		scoreRef.current = 0;
		gameSpeedRef.current = 5;
		frameCountRef.current = 0;
		gameStateRef.current = 'playing';
		setGameState('playing');
		setShowInstructions(true);
		setScore(0);
	};

	const handleExit = () => {
		setExit(true);
		setTimeout(() => onComplete?.(), 1000);
	};

	return (
		<div
			className={`fixed inset-0 z-[100] transition-transform duration-1000 ease-in-out overflow-hidden ${exit ? 'translate-y-full' : 'translate-y-0 animate-in slide-in-from-bottom duration-1000'}`}
			onTouchMove={onTouchMove}
		>
			<canvas
				ref={canvasRef}
				className="absolute inset-0 block"
			/>

			{/* HUD */}
			<div className="absolute top-8 left-8 z-10 pointer-events-none">
				<p className="text-sm text-slate-400 font-mono">DISTANCE</p>
				<h2 className="text-4xl font-bold text-white">{score}m</h2>
			</div>

			{/* Use Arrow Keys Suggestion */}
			{showInstructions && gameState === 'playing' && (
				<div className="absolute top-3/4 left-0 right-0 flex justify-center items-center gap-8 pointer-events-none animate-pulse opacity-60">
					<div className="flex flex-col items-center gap-2">
						<div className="flex gap-2">
							<div className="p-3 border border-white/30 rounded bg-white/5 text-white"><ArrowLeft className="w-6 h-6" /></div>
							<div className="p-3 border border-white/30 rounded bg-white/5 text-white"><ArrowRight className="w-6 h-6" /></div>
						</div>
						<p className="text-xs text-white/50 font-mono tracking-widest">MOVE</p>
					</div>
				</div>
			)}

			{/* Transparent Skip Button */}
			<div className={`absolute top-8 right-8 z-50 transition-opacity ${gameState === 'gameover' ? 'opacity-0' : 'opacity-100'}`}>
				<Button
					variant="ghost"
					onClick={handleExit}
					className="text-white hover:bg-white/10 transition-all rounded-full px-4 h-10 border border-white/20 bg-transparent backdrop-blur-sm"
				>
					<span className="mr-2">Skip</span>
					<SkipForward className="h-4 w-4" />
				</Button>
			</div>

			{/* Game Over Screen */}
			{gameState === 'gameover' && (
				<div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
					<div className="bg-[#0f172a] border border-slate-700 p-8 rounded-2xl text-center space-y-6 max-w-sm w-full shadow-2xl">
						<div className="flex justify-center">
							<div className="bg-red-500/10 p-4 rounded-full">
								<AlertTriangle className="w-12 h-12 text-red-500" />
							</div>
						</div>

						<div className="space-y-2">
							<h2 className="text-3xl font-black text-white">CRASHED!</h2>
							<p className="text-slate-400">You traveled <span className="text-white font-bold">{score}m</span>.</p>
						</div>

						<div className="grid grid-cols-2 gap-4 pt-4">
							<Button
								variant="outline"
								onClick={handleReset}
								className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white"
							>
								<Play className="w-4 h-4 mr-2" />
								RETRY
							</Button>
							<Button
								onClick={handleExit}
								className="w-full bg-blue-600 hover:bg-blue-500 text-white"
							>
								CONTINUE
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
