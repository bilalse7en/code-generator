"use client";

import {useEffect,useRef,useState} from "react";
import {Shield,Rocket,Target,Zap,Trophy,Flame,AlertTriangle} from "lucide-react";

export function LandingLoader({onComplete,onUnlock,onFail}) {
	const canvasRef=useRef(null);
	const requestRef=useRef(null);
	const [distance,setDistance]=useState(0);
	const [gameState,setGameState]=useState('playing'); // playing, paused, failed, completed
	const [popup,setPopup]=useState(null);
	const [exit,setExit]=useState(false);

	const [highScore,setHighScore]=useState(0);
	const [bankedRole,setBankedRole]=useState(null);
	const [isShaking,setIsShaking]=useState(false);

	// Game state refs
	const game=useRef({
		player: {x: 100,y: 0,w: 50,h: 40,color: '#fbbf24'},
		speed: 4,
		baseSpeed: 4,
		stars: [],
		obstacles: [],
		particles: [],
		frame: 0,
		distance: 0,
		milestones: new Set(),
		keys: {},
		lastBanked: null
	});

	useEffect(() => {
		const savedHS=localStorage.getItem('runner_high_score');
		if(savedHS) setHighScore(parseInt(savedHS));
	},[]);

	useEffect(() => {
		const canvas=canvasRef.current;
		if(!canvas) return;
		const ctx=canvas.getContext('2d');

		const handleResize=() => {
			canvas.width=window.innerWidth;
			canvas.height=window.innerHeight;
			game.current.player.y=canvas.height/2;

			// Initialize stars
			game.current.stars=Array.from({length: 150},() => ({
				x: Math.random()*canvas.width,
				y: Math.random()*canvas.height,
				size: Math.random()*2,
				speed: Math.random()*0.5+0.1
			}));
		};

		window.addEventListener('resize',handleResize);
		handleResize();

		const handleKeyDown=(e) => game.current.keys[e.code]=true;
		const handleKeyUp=(e) => game.current.keys[e.code]=false;
		window.addEventListener('keydown',handleKeyDown);
		window.addEventListener('keyup',handleKeyUp);

		const animate=() => {
			if(gameState==='playing') {
				ctx.fillStyle='#020617'; // Deep space
				ctx.fillRect(0,0,canvas.width,canvas.height);

				// Increase difficulty every 100km
				const difficultyMultiplier=1+Math.floor(game.current.distance/100)*0.2;
				game.current.speed=game.current.baseSpeed*difficultyMultiplier;

				// 1. Draw & Update Stars
				ctx.fillStyle='#fff';
				game.current.stars.forEach(star => {
					star.x-=star.speed*game.current.speed;
					if(star.x<0) {
						star.x=canvas.width;
						star.y=Math.random()*canvas.height;
					}
					ctx.beginPath();
					ctx.arc(star.x,star.y,star.size,0,Math.PI*2);
					ctx.fill();
				});

				// 2. Update Player Logic (Full 4-way support)
				const moveSpeed=7;
				if(game.current.keys['ArrowUp']||game.current.keys['KeyW']) game.current.player.y-=moveSpeed;
				if(game.current.keys['ArrowDown']||game.current.keys['KeyS']) game.current.player.y+=moveSpeed;
				if(game.current.keys['ArrowLeft']||game.current.keys['KeyA']) game.current.player.x-=moveSpeed;
				if(game.current.keys['ArrowRight']||game.current.keys['KeyD']) game.current.player.x+=moveSpeed;

				// Clamp player position
				if(game.current.player.y<20) game.current.player.y=20;
				if(game.current.player.y>canvas.height-70) game.current.player.y=canvas.height-70;
				if(game.current.player.x<20) game.current.player.x=20;
				if(game.current.player.x>canvas.width-70) game.current.player.x=canvas.width-70;

				// 3. Draw Player 
				const {x,y}=game.current.player;

				// Rocket Body
				ctx.fillStyle='#fbbf24';
				ctx.beginPath();
				ctx.moveTo(x+50,y+20); // Tip
				ctx.lineTo(x,y); // Top back
				ctx.lineTo(x+10,y+20); // Mid back
				ctx.lineTo(x,y+40); // Bottom back
				ctx.fill();

				// Rocket Window
				ctx.fillStyle='#0ea5e9';
				ctx.beginPath();
				ctx.arc(x+25,y+20,6,0,Math.PI*2);
				ctx.fill();

				// Engine Flame Effect
				ctx.fillStyle=Math.random()>0.5? '#f97316':'#ef4444';
				ctx.fillRect(x-15,y+10,15,20);

				// 4. Update & Draw Obstacles (Space Balls / Asteroids)
				// Spawn frequency increases with difficulty
				const spawnRate=Math.max(20,60-Math.floor(game.current.distance/100)*10);
				if(game.current.frame%spawnRate===0) {
					const colors=['#0ea5e9','#22c55e','#ef4444','#a855f7','#f97316'];
					game.current.obstacles.push({
						x: canvas.width,
						y: Math.random()*(canvas.height-100)+50,
						size: Math.random()*20+15,
						speed: (Math.random()*3+4)*difficultyMultiplier,
						rotation: 0,
						rotateSpeed: (Math.random()-0.5)*0.1,
						color: colors[Math.floor(Math.random()*colors.length)]
					});
				}

				game.current.obstacles.forEach((obs,index) => {
					obs.x-=obs.speed;
					obs.rotation+=obs.rotateSpeed;

					// Draw Glowing Bubble
					ctx.save();
					ctx.translate(obs.x,obs.y);

					// Bubble Body with Glass Effect
					const bubbleGrad=ctx.createRadialGradient(-obs.size/2,-obs.size/2,2,0,0,obs.size);
					const bubbleColor=obs.color||'#0ea5e9';
					bubbleGrad.addColorStop(0,'rgba(255,255,255,0.8)');
					bubbleGrad.addColorStop(0.2,bubbleColor);
					bubbleGrad.addColorStop(1,'rgba(0,0,0,0.1)');

					ctx.fillStyle=bubbleGrad;
					ctx.globalAlpha=0.6;
					ctx.beginPath();
					ctx.arc(0,0,obs.size,0,Math.PI*2);
					ctx.fill();

					// Specular Highlight
					ctx.fillStyle='rgba(255,255,255,0.4)';
					ctx.beginPath();
					ctx.arc(-obs.size/3,-obs.size/3,obs.size/4,0,Math.PI*2);
					ctx.fill();

					// Outer Ring
					ctx.strokeStyle=bubbleColor;
					ctx.lineWidth=2;
					ctx.globalAlpha=0.8;
					ctx.beginPath();
					ctx.arc(0,0,obs.size,0,Math.PI*2);
					ctx.stroke();

					ctx.restore();

					// Collision Detection (Circle vs Circle)
					const dx=(game.current.player.x+25)-obs.x;
					const dy=(game.current.player.y+20)-obs.y;
					const distance2=Math.sqrt(dx*dx+dy*dy);

					if(distance2<obs.size+15) {
						setGameState('failed');
						setIsShaking(true);
						setTimeout(() => setIsShaking(false),500);

						// Update High Score
						const finalDist=Math.floor(game.current.distance);
						if(finalDist>highScore) {
							setHighScore(finalDist);
							localStorage.setItem('runner_high_score',finalDist.toString());
						}

						triggerFailure();
					}

					if(obs.x<-100) game.current.obstacles.splice(index,1);
				});

				// 5. Distance & Milestones
				game.current.distance+=0.5;
				const currentMeters=Math.floor(game.current.distance);
				setDistance(currentMeters);

				if(currentMeters>=200&&!game.current.milestones.has(200)) {
					game.current.milestones.add(200);
					game.current.lastBanked='content_creator';
					setBankedRole('CONTENT ACCESS');
					triggerPause("ORBIT REACHED!","Content Access granted for 2 hours","content_creator");
				} else if(currentMeters>=300&&!game.current.milestones.has(300)) {
					game.current.milestones.add(300);
					game.current.lastBanked='blog_creator';
					setBankedRole('BLOG & CONTENT');
					triggerPause("GALAXY DISCOVERED!","Blog & Content access for 2 hours","blog_creator");
				} else if(currentMeters>=500&&!game.current.milestones.has(500)) {
					game.current.milestones.add(500);
					game.current.lastBanked='admin';
					setBankedRole('ADMIN ACCESS');
					triggerPause("UNIVERSE MASTER!","Full Admin Access granted for 2 hours","admin",true);
				}

				game.current.frame++;
			}
			requestRef.current=requestAnimationFrame(animate);
		};

		const triggerPause=(title,content,role,isFinal=false) => {
			setPopup({type: 'success',title,content,accessRole: role,isFinal});
		};

		const triggerFailure=() => {
			let role=null;
			let msg="You popped a bubble. Access denied.";
			const currentDist=Math.floor(game.current.distance);

			if(currentDist>=500) {
				role='admin';
				msg=`Elite maneuver! Even in failure, you've secured Full Admin Access.`;
			} else if(currentDist>=300) {
				role='blog_creator';
				msg=`Great run! You've secured Blog & Content access for this sector.`;
			} else if(currentDist>=200) {
				role='content_creator';
				msg=`Solid effort! You've unlocked Content Access for this mission.`;
			}

			setPopup({
				type: 'failure',
				title: "MISSION FAILED!",
				content: msg,
				accessRole: role
			});
		};

		requestRef.current=requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(requestRef.current);
			window.removeEventListener('resize',handleResize);
			window.removeEventListener('keydown',handleKeyDown);
			window.removeEventListener('keyup',handleKeyUp);
		};
	},[gameState]);

	const handleClaim=() => {
		if(popup.accessRole) {
			onUnlock?.(popup.accessRole);
		}
		setExit(true);
		setTimeout(() => onComplete?.(),800);
	};

	const handleContinuePlaying=() => {
		if(popup.accessRole) {
			onUnlock?.(popup.accessRole);
		}
		setGameState('playing');
		setPopup(null);
	};

	const handleContinue=() => {
		if(popup.type==='failure') {
			if(popup.accessRole) {
				onUnlock?.(popup.accessRole);
			} else {
				onFail?.();
			}
			setExit(true);
			setTimeout(() => onComplete?.(),800);
			return;
		}

		if(popup.accessRole) {
			onUnlock?.(popup.accessRole);
		}

		setGameState('playing');
		setPopup(null);
	};

	return (
		<div className={`fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center overflow-hidden transition-all duration-1000 ${exit? 'opacity-0 pointer-events-none':'opacity-100'} ${isShaking? 'animate-shake':''}`}>
			<canvas ref={canvasRef} className="absolute inset-0 z-0" />

			<style jsx global>{`
				@keyframes shake {
					0%, 100% { transform: translate(0, 0); }
					10%, 30%, 50%, 70%, 90% { transform: translate(-10px, -10px); }
					20%, 40%, 60%, 80% { transform: translate(10px, 10px); }
				}
				.animate-shake {
					animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
				}
			`}</style>

			{/* HUD */}
			<div className="absolute top-8 left-8 z-10 flex flex-col gap-3">
				<div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl">
					<div className="bg-sky-500/20 p-2 rounded-lg">
						<Rocket className="w-6 h-6 text-sky-400" />
					</div>
					<div>
						<p className="text-[10px] font-black tracking-[0.2em] text-sky-400 uppercase">Current Flight</p>
						<p className="text-2xl font-black text-white font-mono">{distance} <span className="text-xs text-slate-500">KM</span></p>
					</div>
				</div>

				<div className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5">
					<Trophy className="w-4 h-4 text-yellow-500" />
					<div>
						<p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">High Score</p>
						<p className="text-sm font-black text-white font-mono">{highScore} KM</p>
					</div>
				</div>

				{bankedRole&&(
					<div className="bg-green-500/10 border border-green-500/30 p-3 rounded-xl flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.1)]">
						<Shield className="w-5 h-5 text-green-500" />
						<div>
							<p className="text-[8px] font-black text-green-500 uppercase tracking-[0.2em]">BANKED SUCCESS</p>
							<p className="text-xs font-black text-white">{bankedRole}</p>
						</div>
					</div>
				)}
			</div>

			{/* Milestones */}
			<div className="absolute top-8 right-8 z-10 space-y-2">
				{[200,300,500].map(m => (
					<div key={m} className={`flex items-center gap-3 transition-all duration-500 px-4 py-2 rounded-full border ${distance>=m? 'bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]':'bg-slate-900/40 border-white/5 text-slate-600'}`}>
						<Trophy className={`w-3 h-3 ${distance>=m? 'animate-bounce':''}`} />
						<span className="text-[9px] font-black tracking-widest">{m}KM MILESTONE</span>
					</div>
				))}
			</div>

			{/* Controls Hint */}
			<div className="absolute bottom-10 left-10 z-10 opacity-40 hover:opacity-100 transition-opacity">
				<div className="grid grid-cols-3 gap-1">
					<div /> <kbd className="bg-slate-800 p-2 rounded text-xs text-white text-center">W</kbd> <div />
					<kbd className="bg-slate-800 p-2 rounded text-xs text-white text-center">A</kbd>
					<kbd className="bg-slate-800 p-2 rounded text-xs text-white text-center">S</kbd>
					<kbd className="bg-slate-800 p-2 rounded text-xs text-white text-center">D</kbd>
				</div>
			</div>

			{/* Non-intrusive Transparent Notifications */}
			{popup&&(
				<div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-md animate-in slide-in-from-bottom-10 duration-500">
					<div className={`relative overflow-hidden rounded-3xl backdrop-blur-xl border border-white/10 p-6 shadow-2xl transition-all ${popup.type==='failure'? 'bg-red-500/5':'bg-yellow-500/5'}`}>
						{/* Animated Background Glow - Very Subtle */}
						<div className={`absolute -inset-20 blur-3xl opacity-10 animate-pulse ${popup.type==='failure'? 'bg-red-600':'bg-yellow-400'}`}></div>

						<div className="relative flex items-center gap-5">
							<div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${popup.type==='failure'? 'bg-red-500/80 outline outline-1 outline-white/20':'bg-yellow-500/80 outline outline-1 outline-white/20'}`}>
								{popup.type==='failure'? <AlertTriangle className="w-8 h-8 text-white" />:<Shield className="w-8 h-8 text-slate-900" />}
							</div>

							<div className="flex-1 min-w-0">
								<h3 className={`text-xl font-black tracking-tight leading-none mb-1 uppercase italic ${popup.type==='failure'? 'text-red-500':'text-white'}`}>
									{popup.type==='failure'? 'GAME OVER':popup.title}
								</h3>
								<p className="text-slate-300 text-sm font-medium line-clamp-2">
									{popup.content}
								</p>
							</div>

							<div className="flex flex-col gap-2">
								{popup.type==='failure'? (
									<div className="flex flex-col gap-2">
										<button
											onClick={handleContinue}
											className="whitespace-nowrap bg-white text-slate-950 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider hover:bg-red-50 transition-colors shadow-lg"
										>
											{popup.accessRole? "CLAIM REWARD":"BACK TO LOGIN"}
										</button>
										<button
											onClick={() => window.location.reload()}
											className="whitespace-nowrap bg-white/10 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all"
										>
											RETRY MISSION
										</button>
									</div>
								):(
									<div className="flex flex-col gap-2">
										<button
											onClick={handleClaim}
											className="whitespace-nowrap bg-white text-slate-950 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider hover:bg-yellow-400 transition-colors shadow-lg"
										>
											CLAIM & ENTER
										</button>
										{!popup.isFinal&&(
											<button
												onClick={handleContinuePlaying}
												className="whitespace-nowrap bg-white/10 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all"
											>
												CONTINUE
											</button>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}