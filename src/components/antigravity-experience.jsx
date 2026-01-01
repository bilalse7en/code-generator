"use client";

import {useEffect,useRef,useState,useMemo} from "react";
import {
	Zap,
	Wind,
	Orbit,
	Settings2,
	MousePointer2,
	Keyboard,
	Smartphone,
	Play,
	Pause,
	RefreshCw,
	Sun,
	Moon,
	Sparkles,
	Shield,
	X,
	Plus,
	Minus,
	Maximize2
} from "lucide-react";
import {cn} from "@/lib/utils";

export function AntigravityExperience({onComplete}) {
	const canvasRef=useRef(null);
	const containerRef=useRef(null);
	const requestRef=useRef(null);

	// Game State
	const [isEnabled,setIsEnabled]=useState(false);
	const [gravityOn,setGravityOn]=useState(true);
	const [paused,setPaused]=useState(false);
	const [driftIntensity,setDriftIntensity]=useState(1);
	const [gravityStrength,setGravityStrength]=useState(0.5);
	const [theme,setTheme]=useState("Nebula Glow");
	const [showInstructions,setShowInstructions]=useState(true);

	const [reducedMotion,setReducedMotion]=useState(false);

	// Interaction State
	const mouse=useRef({x: 0,y: 0,lastX: 0,lastY: 0,isDown: false,vx: 0,vy: 0});
	const objects=useRef([]);
	const stars=useRef([]);
	const dragTarget=useRef(null);
	const zoom=useRef(1);
	const tilt=useRef({x: 0,y: 0});
	const lastTap=useRef(0);

	// Themes Configuration
	const themes={
		"Nebula Glow": {
			bg: "linear-gradient(to bottom, #020617, #0f172a)",
			stars: "#38bdf8",
			glow: "rgba(56, 189, 248, 0.5)",
			objectColor: "rgba(147, 51, 234, 0.6)",
			accent: "#9333ea"
		},
		"Deep Space": {
			bg: "linear-gradient(to bottom, #000000, #0a0a0a)",
			stars: "#ffffff",
			glow: "rgba(255, 255, 255, 0.3)",
			objectColor: "rgba(71, 85, 105, 0.6)",
			accent: "#f8fafc"
		},
		"Aurora Drift": {
			bg: "linear-gradient(to bottom, #064e3b, #022c22)",
			stars: "#34d399",
			glow: "rgba(52, 211, 153, 0.5)",
			objectColor: "rgba(30, 64, 175, 0.6)",
			accent: "#10b981"
		}
	};

	// Internal Logic
	const currentTheme=themes[theme];

	useEffect(() => {
		const canvas=canvasRef.current;
		if(!canvas) return;
		const ctx=canvas.getContext("2d");

		const resize=() => {
			canvas.width=window.innerWidth;
			canvas.height=window.innerHeight;
			initStars();
			if(objects.current.length===0) initObjects();
		};

		const initStars=() => {
			const count=reducedMotion? 50:200;
			stars.current=Array.from({length: count},() => ({
				x: Math.random()*canvas.width,
				y: Math.random()*canvas.height,
				z: Math.random()*1000+100, // Distance for parallax
				size: Math.random()*2,
				baseSpeed: Math.random()*0.5+0.1
			}));
		};

		const initObjects=() => {
			const count=10;
			objects.current=Array.from({length: count},(_,i) => ({
				id: i,
				x: Math.random()*(canvas.width-100)+50,
				y: Math.random()*(canvas.height-100)+50,
				vx: (Math.random()-0.5)*4,
				vy: (Math.random()-0.5)*4,
				radius: Math.random()*20+30,
				mass: 1,
				locked: false,
				trail: []
			}));
		};

		window.addEventListener("resize",resize);
		resize();

		const animate=(time) => {
			if(!paused) {
				// Clear with transparent background to see global stars
				ctx.clearRect(0,0,canvas.width,canvas.height);

				// Physics & Draw Objects (Remove star drawing from here as it's global now)
				objects.current.forEach(obj => {
					if(!obj.locked&&dragTarget.current?.id!==obj.id) {
						// Apply Gravity
						if(gravityOn&&isEnabled) {
							obj.vy+=gravityStrength;
						}

						// Apply Drift / Intertia
						if(!gravityOn||!isEnabled) {
							obj.vx+=(Math.random()-0.5)*0.05*driftIntensity;
							obj.vy+=(Math.random()-0.5)*0.05*driftIntensity;
						}

						// Push/Pull Field (Interaction)
						if(mouse.current.isDown&&!dragTarget.current) {
							const dx=mouse.current.x-obj.x;
							const dy=mouse.current.y-obj.y;
							const dist=Math.sqrt(dx*dx+dy*dy);
							if(dist<300) {
								const force=(300-dist)/5000;
								// Subtle attraction/repulsion
								obj.vx+=dx*force;
								obj.vy+=dy*force;
							}
						}

						// Resistance / Friction
						obj.vx*=(reducedMotion? 0.95:0.99);
						obj.vy*=(reducedMotion? 0.95:0.99);

						// Move
						obj.x+=obj.vx;
						obj.y+=obj.vy;

						// Boundaries
						if(obj.x<obj.radius) {obj.x=obj.radius; obj.vx*=-0.8;}
						if(obj.x>canvas.width-obj.radius) {obj.x=canvas.width-obj.radius; obj.vx*=-0.8;}
						if(obj.y<obj.radius) {obj.y=obj.radius; obj.vy*=-0.8;}
						if(obj.y>canvas.height-obj.radius) {obj.y=canvas.height-obj.radius; obj.vy*=-0.8;}
					}

					// Trail Logic
					if(!reducedMotion) {
						if(Math.abs(obj.vx)+Math.abs(obj.vy)>2) {
							obj.trail.push({x: obj.x,y: obj.y,alpha: 1});
							if(obj.trail.length>20) obj.trail.shift();
						} else {
							if(obj.trail.length>0) obj.trail.shift();
						}
					} else {
						obj.trail=[];
					}

					// Draw Trail
					obj.trail.forEach((t,i) => {
						t.alpha*=0.9;
						ctx.beginPath();
						ctx.arc(t.x,t.y,obj.radius*(i/obj.trail.length),0,Math.PI*2);
						ctx.fillStyle=currentTheme.glow;
						ctx.globalAlpha=t.alpha*0.3;
						ctx.fill();
					});
					ctx.globalAlpha=1;

					// Velocity Glow
					const speed=Math.sqrt(obj.vx*obj.vx+obj.vy*obj.vy);
					const glowIntensity=Math.min(speed*5,50);

					// Draw Object
					ctx.save();
					ctx.translate(obj.x,obj.y);

					if(!reducedMotion) {
						ctx.shadowBlur=15+glowIntensity;
						ctx.shadowColor=currentTheme.accent;
					}

					const grad=ctx.createRadialGradient(-obj.radius/3,-obj.radius/3,5,0,0,obj.radius);
					grad.addColorStop(0,"rgba(255,255,255,0.4)");
					grad.addColorStop(1,currentTheme.objectColor);

					ctx.fillStyle=grad;
					if(obj.locked) {
						ctx.strokeStyle="#ffffff";
						ctx.lineWidth=4;
						ctx.beginPath();
						ctx.arc(0,0,obj.radius+2,0,Math.PI*2);
						ctx.stroke();
					}

					ctx.beginPath();
					ctx.arc(0,0,obj.radius*zoom.current,0,Math.PI*2);
					ctx.fill();

					// Reflective highlight
					ctx.beginPath();
					ctx.arc(-obj.radius/3,-obj.radius/3,obj.radius/4,0,Math.PI*2);
					ctx.fillStyle="rgba(255,255,255,0.2)";
					ctx.fill();

					ctx.restore();
				});
			}

			requestRef.current=requestAnimationFrame(animate);
		};

		requestRef.current=requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(requestRef.current);
			window.removeEventListener("resize",resize);
		};
	},[paused,isEnabled,gravityOn,driftIntensity,gravityStrength,theme,currentTheme,reducedMotion]);

	// Interaction Handlers
	const handleMouseDown=(e) => {
		const x=e.clientX;
		const y=e.clientY;
		mouse.current.isDown=true;
		mouse.current.x=x;
		mouse.current.y=y;
		mouse.current.lastX=x;
		mouse.current.lastY=y;

		// Check hit test
		const target=objects.current.find(obj => {
			const dist=Math.sqrt((obj.x-x)**2+(obj.y-y)**2);
			return dist<obj.radius;
		});

		if(target) {
			dragTarget.current=target;
		}
	};

	const handleMouseMove=(e) => {
		const x=e.clientX;
		const y=e.clientY;
		mouse.current.vx=x-mouse.current.lastX;
		mouse.current.vy=y-mouse.current.lastY;
		mouse.current.x=x;
		mouse.current.y=y;
		mouse.current.lastX=x;
		mouse.current.lastY=y;

		if(dragTarget.current) {
			dragTarget.current.x=x;
			dragTarget.current.y=y;
			dragTarget.current.vx=mouse.current.vx*0.5;
			dragTarget.current.vy=mouse.current.vy*0.5;
		}
	};

	const handleMouseUp=() => {
		mouse.current.isDown=false;
		if(dragTarget.current) {
			// Impart momentum
			dragTarget.current.vx=mouse.current.vx;
			dragTarget.current.vy=mouse.current.vy;
			dragTarget.current=null;
		}
	};

	const handleKeyDown=(e) => {
		if(e.code==="Space") {
			setIsEnabled(prev => !prev);
			e.preventDefault();
		}
		if(e.key.toLowerCase()==="g") {
			setGravityOn(prev => !prev);
		}
		if(e.key==="+") setDriftIntensity(prev => Math.min(prev+0.5,5));
		if(e.key==="-") setDriftIntensity(prev => Math.max(prev-0.5,0));

		// Nudge selected/last object? Or just apply global nudge
		if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) {
			objects.current.forEach(obj => {
				if(e.code==="ArrowUp") obj.vy-=1;
				if(e.code==="ArrowDown") obj.vy+=1;
				if(e.code==="ArrowLeft") obj.vx-=1;
				if(e.code==="ArrowRight") obj.vx+=1;
			});
		}
	};

	useEffect(() => {
		window.addEventListener("keydown",handleKeyDown);
		return () => window.removeEventListener("keydown",handleKeyDown);
	},[]);

	// Mobile Multi-touch & Gestures
	const handleTouchStart=(e) => {
		const touches=e.touches;
		if(touches.length===1) {
			const touch=touches[0];
			const now=Date.now();

			// Double tap lock
			if(now-lastTap.current<300) {
				const x=touch.clientX;
				const y=touch.clientY;
				const target=objects.current.find(obj => {
					const dist=Math.sqrt((obj.x-x)**2+(obj.y-y)**2);
					return dist<obj.radius;
				});
				if(target) target.locked=!target.locked;
			}
			lastTap.current=now;

			// Trigger enable on long press anywhere if not enabled
			if(!isEnabled) {
				const timer=setTimeout(() => {
					setIsEnabled(true);
				},800);
				containerRef.current._longPressTimer=timer;
			}

			handleMouseDown({clientX: touch.clientX,clientY: touch.clientY});
		} else if(touches.length===2) {
			// Start pinch zoom
			const dist=Math.sqrt(
				(touches[0].clientX-touches[1].clientX)**2+
				(touches[0].clientY-touches[1].clientY)**2
			);
			containerRef.current._initialPinchDist=dist;
			containerRef.current._initialZoom=zoom.current;
		}
	};

	const handleTouchMove=(e) => {
		const touches=e.touches;
		if(touches.length===1) {
			if(containerRef.current._longPressTimer) {
				clearTimeout(containerRef.current._longPressTimer);
			}
			const touch=touches[0];

			// Swipe to tilt (optional: tilt state)
			const dx=touch.clientX-mouse.current.lastX;
			tilt.current.x+=dx*0.01;

			handleMouseMove({clientX: touch.clientX,clientY: touch.clientY});
		} else if(touches.length===2) {
			// Handle pinch zoom
			const dist=Math.sqrt(
				(touches[0].clientX-touches[1].clientX)**2+
				(touches[0].clientY-touches[1].clientY)**2
			);
			const scale=dist/containerRef.current._initialPinchDist;
			zoom.current=Math.min(Math.max(containerRef.current._initialZoom*scale,0.5),3);
		}
		e.preventDefault();
	};

	const handleTouchEnd=() => {
		if(containerRef.current._longPressTimer) {
			clearTimeout(containerRef.current._longPressTimer);
		}
		handleMouseUp();
	};

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 z-[200] overflow-hidden font-sans selection:bg-sky-500/30"
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseUp}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			style={{touchAction: 'none'}}
		>
			<canvas ref={canvasRef} className="absolute inset-0 cursor-crosshair" />

			{/* SVG Filters for Liquid Glass Effect */}
			<svg className="hidden">
				<defs>
					<filter id="liquid-glass">
						<feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
						<feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -12" result="goo" />
						<feComposite in="SourceGraphic" in2="goo" operator="atop" />
					</filter>
				</defs>
			</svg>

			{/* Top Right Panel */}
			<div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-3 pointer-events-none">
				<div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 flex items-center gap-2 pointer-events-auto shadow-2xl">
					<button
						onClick={() => setIsEnabled(!isEnabled)}
						className={cn(
							"px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-500 font-bold text-sm tracking-wider uppercase",
							isEnabled
								? "bg-sky-500 text-white shadow-[0_0_30px_rgba(14,165,233,0.5)] scale-105"
								:"bg-white/10 text-white/50 hover:bg-white/10"
						)}
					>
						<Zap className={cn("w-4 h-4",isEnabled&&"animate-pulse")} />
						{isEnabled? "Antigravity Active":"Enable Antigravity"}
					</button>
				</div>

				<div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl p-1 flex items-center gap-1 pointer-events-auto">
					<button
						onClick={() => setPaused(!paused)}
						className="p-3 hover:bg-white/10 rounded-xl transition-colors text-white/70"
						title="Pause Simulation"
					>
						{paused? <Play className="w-4 h-4" />:<Pause className="w-4 h-4" />}
					</button>
					<div className="w-px h-6 bg-white/10 mx-1" />
					<button
						onClick={() => {
							objects.current=[];
							const resize=() => {
								const canvas=canvasRef.current;
								canvas.width=window.innerWidth;
								canvas.height=window.innerHeight;
								initObjects();
							};
							const initObjects=() => {
								const count=10;
								objects.current=Array.from({length: count},(_,i) => ({
									id: i,
									x: Math.random()*(canvasRef.current.width-100)+50,
									y: Math.random()*(canvasRef.current.height-100)+50,
									vx: (Math.random()-0.5)*4,
									vy: (Math.random()-0.5)*4,
									radius: Math.random()*20+30,
									mass: 1,
									locked: false,
									trail: []
								}));
							};
							resize();
						}}
						className="p-3 hover:bg-white/10 rounded-xl transition-colors text-white/70"
						title="Reset Scene"
					>
						<RefreshCw className="w-4 h-4" />
					</button>
				</div>
			</div>

			{/* Floating Instructions Modal (Initial) */}
			{showInstructions&&(
				<div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm">
					<div className="relative max-w-lg w-full bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-500">
						<button
							onClick={() => setShowInstructions(false)}
							className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-white/30 hover:text-white transition-all"
						>
							<X className="w-6 h-6" />
						</button>

						<div className="flex items-center gap-4 mb-8">
							<div className="bg-sky-500/20 p-4 rounded-3xl">
								<Orbit className="w-10 h-10 text-sky-400 animate-spin-slow" />
							</div>
							<div>
								<h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Antigravity Experience</h2>
								<p className="text-sky-400 font-bold text-xs tracking-[0.3em] uppercase">Interactive Physics Lab</p>
							</div>
						</div>

						<div className="space-y-6 mb-10">
							<div className="flex gap-4">
								<div className="bg-white/5 p-3 rounded-2xl h-fit"><MousePointer2 className="w-5 h-5 text-white/60" /></div>
								<div>
									<h4 className="text-white font-bold mb-1">Core Interactions</h4>
									<p className="text-slate-400 text-sm leading-relaxed">Drag objects to tilt their path. Release with speed to impart momentum. Tap near an object to repel it.</p>
								</div>
							</div>
							<div className="flex gap-4">
								<div className="bg-white/5 p-3 rounded-2xl h-fit"><Keyboard className="w-5 h-5 text-white/60" /></div>
								<div>
									<h4 className="text-white font-bold mb-1">Keyboard Shortcuts</h4>
									<p className="text-slate-400 text-sm leading-relaxed"><span className="text-white font-mono bg-white/5 px-1 rounded">Space</span> Toggle Antigravity | <span className="text-white font-mono bg-white/5 px-1 rounded">G</span> Global Gravity | <span className="text-white font-mono bg-white/5 px-1 rounded">+/-</span> Wind Strength</p>
								</div>
							</div>
							<div className="flex gap-4">
								<div className="bg-white/5 p-3 rounded-2xl h-fit"><Smartphone className="w-5 h-5 text-white/60" /></div>
								<div>
									<h4 className="text-white font-bold mb-1">Mobile Gestures</h4>
									<p className="text-slate-400 text-sm leading-relaxed">Long-press to enable. Double-tap objects to lock in place. Swipe to tilt the starfield.</p>
								</div>
							</div>
						</div>

						<button
							onClick={() => {setShowInstructions(false); setIsEnabled(true);}}
							className="w-full bg-white text-slate-950 font-black py-5 rounded-2xl hover:bg-sky-400 transition-all hover:scale-[1.02] active:scale-95 text-lg uppercase tracking-widest shadow-xl"
						>
							Start Mission
						</button>
					</div>
				</div>
			)}

			{/* Control Sidebar (Liquid Glass) */}
			<div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-4">
				<div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-8 w-64">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<label className="text-xs font-black text-white/40 uppercase tracking-widest">Gravity Mode</label>
							<button
								onClick={() => setGravityOn(!gravityOn)}
								className={cn(
									"w-12 h-6 rounded-full transition-all relative flex items-center px-1",
									gravityOn? "bg-red-500/20":"bg-sky-500/20"
								)}
							>
								<div className={cn(
									"w-4 h-4 rounded-full transition-all duration-300",
									gravityOn? "ml-6 bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]":"ml-0 bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
								)} />
							</button>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between text-[10px] font-bold text-white/60 uppercase">
								<span className="flex items-center gap-2"><Wind className="w-3 h-3" /> Drift Intensity</span>
								<span className="text-sky-400">{driftIntensity.toFixed(1)}</span>
							</div>
							<div className="flex items-center gap-3">
								<button onClick={() => setDriftIntensity(prev => Math.max(0,prev-0.5))} className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white"><Minus className="w-4 h-4" /></button>
								<div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
									<div className="h-full bg-sky-500 transition-all duration-300" style={{width: `${(driftIntensity/5)*100}%`}} />
								</div>
								<button onClick={() => setDriftIntensity(prev => Math.min(5,prev+0.5))} className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white"><Plus className="w-4 h-4" /></button>
							</div>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between text-[10px] font-bold text-white/60 uppercase">
								<span className="flex items-center gap-2"><Settings2 className="w-3 h-3" /> Gravity Scale</span>
								<span className="text-red-400">{gravityStrength.toFixed(1)}</span>
							</div>
							<div className="flex items-center gap-3">
								<button onClick={() => setGravityStrength(prev => Math.max(0,prev-0.1))} className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white"><Minus className="w-4 h-4" /></button>
								<div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
									<div className="h-full bg-red-500 transition-all duration-300" style={{width: `${(gravityStrength/2)*100}%`}} />
								</div>
								<button onClick={() => setGravityStrength(prev => Math.min(2,prev+0.1))} className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white"><Plus className="w-4 h-4" /></button>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<label className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Reduced Motion</label>
							<button
								onClick={() => setReducedMotion(!reducedMotion)}
								className={cn(
									"w-12 h-6 rounded-full transition-all relative flex items-center px-1 border border-white/10",
									reducedMotion? "bg-white/20":"bg-white/5"
								)}
							>
								<div className={cn(
									"w-4 h-4 rounded-full transition-all duration-300",
									reducedMotion? "ml-6 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]":"ml-0 bg-white/20"
								)} />
							</button>
						</div>
					</div>

					<div className="space-y-4">
						<label className="text-xs font-black text-white/40 uppercase tracking-widest">Theme Presets</label>
						<div className="grid grid-cols-1 gap-2">
							{Object.keys(themes).map(t => (
								<button
									key={t}
									onClick={() => setTheme(t)}
									className={cn(
										"px-4 py-3 rounded-xl text-left text-sm font-bold transition-all border",
										theme===t
											? "bg-white/10 border-white/20 text-white shadow-lg"
											:"bg-transparent border-transparent text-white/40 hover:text-white/70"
									)}
								>
									<div className="flex items-center justify-between">
										{t}
										{theme===t&&<Sparkles className="w-3 h-3 text-sky-400" />}
									</div>
								</button>
							))}
						</div>
					</div>

					<button
						onClick={() => onComplete?.()}
						className="mt-4 w-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold py-4 rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
					>
						<Maximize2 className="w-3 h-3" />
						Exit Experience
					</button>
				</div>
			</div>

			{/* Velocity Status (Bottom Right) */}
			<div className="absolute bottom-6 right-6 z-10 flex gap-4">
				<div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4 min-w-[200px]">
					<div className="bg-sky-500/20 p-2 rounded-xl">
						<Zap className="w-5 h-5 text-sky-400" />
					</div>
					<div>
						<p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Environment Status</p>
						<p className="text-white font-bold italic">{isEnabled? (gravityOn? "HEAVY GRAVITY":"FREE DRIFT"):"STATIC READY"}</p>
					</div>
				</div>
			</div>

			<style jsx>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
		</div>
	);
}
