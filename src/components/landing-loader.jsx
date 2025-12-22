"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Gift, Shield, Lock, Frown } from "lucide-react";

export function LandingLoader({ onComplete, onUnlock, onFail }) {
	const canvasRef = useRef(null);
	const requestRef = useRef(null);
	const particlesRef = useRef([]);
	const audioContextRef = useRef(null);

	const [isOpen, setIsOpen] = useState(false);
	const [isShaking, setIsShaking] = useState(false);
	const [exit, setExit] = useState(false);
	const [isSuccess, setIsSuccess] = useState(true);

	// --- SOUND ENGINE ---
	const playSuccessSound = () => {
		try {
			if (!audioContextRef.current) {
				audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
			}
			const ctx = audioContextRef.current;

			// Pleasant Chime (Sine Waves in Harmony)
			const playNote = (freq, delay) => {
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = 'sine';
				osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

				// Envelope
				gain.gain.setValueAtTime(0, ctx.currentTime + delay);
				gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.05); // Sober volume
				gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 2.0);

				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start(ctx.currentTime + delay);
				osc.stop(ctx.currentTime + delay + 2.0);
			};

			// C Major Arpeggio
			playNote(523.25, 0);   // C5
			playNote(659.25, 0.1); // E5
			playNote(783.99, 0.2); // G5
			playNote(1046.50, 0.3); // C6

		} catch (e) {
			console.error("Audio block", e);
		}
	};

	const playFailureSound = () => {
		try {
			if (!audioContextRef.current) {
				audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
			}
			const ctx = audioContextRef.current;

			const playNote = (freq, delay) => {
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = 'sawtooth'; // Harsher sound for failure
				osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

				gain.gain.setValueAtTime(0, ctx.currentTime + delay);
				gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + delay + 0.05);
				gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);

				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start(ctx.currentTime + delay);
				osc.stop(ctx.currentTime + delay + 0.5);
			};

			// Sad descending tritone (Failure sound)
			playNote(440, 0);      // A4
			playNote(415.30, 0.2); // G#4
			playNote(311.13, 0.5); // Eb4 (Tritone-ish dissonance)

		} catch (e) {
			console.error("Audio block", e);
		}
	};

	useEffect(() => {
		// Confetti Loop
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		const handleResize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		window.addEventListener('resize', handleResize);
		handleResize();

		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			if (particlesRef.current.length > 0) {
				for (let i = particlesRef.current.length - 1; i >= 0; i--) {
					const p = particlesRef.current[i];
					p.x += p.vx;
					p.y += p.vy;
					p.vy += 0.2; // Gravity
					p.wobble += 0.1;

					ctx.save();
					ctx.translate(p.x, p.y);
					ctx.rotate(p.wobble);
					ctx.fillStyle = p.color;
					ctx.fillRect(-5, -5, 10, 10);
					ctx.restore();

					if (p.y > canvas.height) particlesRef.current.splice(i, 1);
				}
			}

			requestRef.current = requestAnimationFrame(animate);
		};
		requestRef.current = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(requestRef.current);
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	const handleOpen = () => {
		if (isOpen || isShaking) return;

		// Start shaking animation
		setIsShaking(true);

		// Determine outcome: 50% Win, 50% Lose
		const won = Math.random() > 0.5;
		setIsSuccess(won);

		// After shaking, open the envelope
		setTimeout(() => {
			setIsShaking(false);
			setIsOpen(true);

			if (won) {
				playSuccessSound();
				// Spawn Confetti
				for (let i = 0; i < 150; i++) {
					particlesRef.current.push({
						x: window.innerWidth / 2,
						y: window.innerHeight / 2,
						vx: (Math.random() - 0.5) * 20,
						vy: (Math.random() - 0.5) * 25 - 5,
						color: ['#f43f5e', '#ec4899', '#fbbf24', '#34d399', '#60a5fa'][Math.floor(Math.random() * 5)],
						wobble: Math.random() * Math.PI * 2
					});
				}
			} else {
				playFailureSound();
			}

			// Delay completion
			setTimeout(() => {
				if (won) {
					onUnlock?.();
				} else {
					onFail?.();
				}
				setExit(true);
				setTimeout(() => {
					onComplete?.();
				}, 800);
			}, 3000);
		}, 1000); // Shake duration
	};

	return (
		<div className={`fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${exit ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
			<canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50" />

			{/* Perspective Container */}
			<div className="relative group perspective-1000">

				{/* Instruction (Floating above) */}
				{!isOpen && (
					<div className="absolute -top-24 left-1/2 -translate-x-1/2 w-max text-center animate-bounce z-40 cursor-pointer pointer-events-none">
						<div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 shadow-lg mb-2">
							<p className="text-white text-xs font-bold tracking-widest flex items-center gap-2">
								<Gift className="w-4 h-4 text-yellow-400" />
								SECRET GIFT
							</p>
						</div>
						<span className="text-white/40 text-[10px] tracking-[0.2em]">CLICK ENVELOPE</span>
					</div>
				)}

				{/* ENVELOPE Wrapper */}
				<div
					onClick={handleOpen}
					className={`relative w-[340px] h-[220px] cursor-pointer transition-transform duration-500 ease-out hover:scale-105 hover:-translate-y-2 
                        ${isShaking ? 'animate-shake' : ''} 
                        ${isOpen ? 'translate-y-[60px] scale-110 !cursor-default' : ''}`}
				>
					{/* 1. Back of Envelope */}
					<div className="absolute inset-0 bg-slate-200 rounded-sm shadow-2xl" />

					{/* 2. The Letter/Card (Starts inside, slides up) */}
					<div
						className={`absolute left-4 right-4 bg-white rounded shadow-md transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col items-center justify-center text-center p-4 border border-slate-100
                            ${isOpen ? '-translate-y-[240px] z-20 h-[280px]' : 'top-2 bottom-2 z-10 h-[204px]'}
                        `}
					>
						{/* Card Content (Only visible when popped) */}
						<div className={`transition-opacity duration-500 delay-300 flex flex-col items-center gap-3 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
							{isSuccess ? (
								<>
									<div className="bg-yellow-100 p-3 rounded-full">
										<Sparkles className="w-8 h-8 text-yellow-600 animate-pulse" />
									</div>
									<div>
										<h2 className="text-2xl font-black text-slate-800 leading-none">CONGRATS!</h2>
										<p className="text-xs text-slate-400 font-bold tracking-widest mt-1">REWARD UNLOCKED</p>
									</div>

									<div className="w-full h-px bg-slate-100" />

									<div className="space-y-1">
										<p className="text-lg font-bold text-green-600 flex items-center justify-center gap-2">
											<Shield className="w-5 h-5" />
											ADMIN ACCESS
										</p>
										<p className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
											TOKEN: 2H_SESSION
										</p>
									</div>
								</>
							) : (
								<>
									<div className="bg-red-100 p-3 rounded-full">
										<Frown className="w-8 h-8 text-red-600" />
									</div>
									<div>
										<h2 className="text-2xl font-black text-slate-800 leading-none">FAILED</h2>
										<p className="text-xs text-slate-400 font-bold tracking-widest mt-1">BETTER LUCK NEXT TIME</p>
									</div>

									<div className="w-full h-px bg-slate-100" />

									<div className="space-y-1">
										<p className="text-lg font-bold text-red-500 flex items-center justify-center gap-2">
											<Lock className="w-5 h-5" />
											LOGIN REQUIRED
										</p>
										<p className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
											TRY AGAIN LATER
										</p>
									</div>
								</>
							)}
						</div>
					</div>

					{/* 3. Front Flaps (The "Pocket") */}
					<div className="absolute inset-0 z-30 pointer-events-none drop-shadow-lg">
						{/* Left Flap */}
						<div className="absolute top-0 bottom-0 left-0 w-0 h-0 border-t-[110px] border-b-[110px] border-l-[170px] border-t-transparent border-b-transparent border-l-slate-300" />

						{/* Right Flap */}
						<div className="absolute top-0 bottom-0 right-0 w-0 h-0 border-t-[110px] border-b-[110px] border-r-[170px] border-t-transparent border-b-transparent border-r-slate-300" />

						{/* Bottom Flap */}
						<div className="absolute bottom-0 left-0 right-0 h-0 border-l-[170px] border-r-[170px] border-b-[120px] border-l-transparent border-r-transparent border-b-slate-400" />
					</div>

					{/* 4. Top Flap (The Lid) - Animated */}
					<div
						className={`absolute top-0 left-0 right-0 h-0 origin-top transition-all duration-700 ease-in-out
                            border-l-[170px] border-r-[170px] border-t-[120px] 
                            border-l-transparent border-r-transparent border-t-slate-500
                            ${isOpen ? '[transform:rotateX(180deg)] z-10' : '[transform:rotateX(0deg)] z-40'}
                            ${!isOpen && 'animate-breathing'} 
                        `}
						style={{ animation: !isOpen ? 'breathe 3s ease-in-out infinite' : 'none' }}
					>
					</div>

					<style jsx global>{`
                        @keyframes breathe {
                            0%, 100% { transform: rotateX(0deg); }
                            50% { transform: rotateX(15deg); }
                        }
                        @keyframes shake {
                            0%, 100% { transform: translateX(0); }
                            25% { transform: translateX(-5px); }
                            50% { transform: translateX(5px); }
                            75% { transform: translateX(-5px); }
                        }
                        .animate-shake {
                            animation: shake 0.5s ease-in-out;
                        }
                    `}</style>
				</div>
			</div>
		</div>
	);
}