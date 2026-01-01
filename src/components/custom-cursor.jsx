"use client";

import {useEffect,useRef,useState} from "react";
import {useTheme} from "next-themes";

export function CustomCursor() {
	const cursorRef=useRef(null);
	const {theme}=useTheme();
	const [isPointer,setIsPointer]=useState(false);
	const [isClicking,setIsClicking]=useState(false);

	useEffect(() => {
		const cursor=cursorRef.current;
		if(!cursor) return;

		const moveCursor=(e) => {
			cursor.style.transform=`translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

			const target=e.target;
			setIsPointer(
				window.getComputedStyle(target).cursor==="pointer"||
				target.tagName==="BUTTON"||
				target.tagName==="A"||
				target.closest("button")||
				target.closest("a")
			);
		};

		const handleMouseDown=() => {
			setIsClicking(true);
			// Trigger screen shake on the body
			document.body.classList.add("echo-shake");
			setTimeout(() => {
				setIsClicking(false);
				document.body.classList.remove("echo-shake");
			},300);
		};

		window.addEventListener("mousemove",moveCursor);
		window.addEventListener("mousedown",handleMouseDown);
		return () => {
			window.removeEventListener("mousemove",moveCursor);
			window.removeEventListener("mousedown",handleMouseDown);
			document.body.classList.remove("echo-shake");
		};
	},[]);

	// High-Contrast Electric Colors (Theme-Locked)
	const glowColors={
		light: "#0062ff",     // Sharp blue on white
		dark: "#a855f7",      // Vibrant purple on dark
		nebula: "#38bdf8",    // Bright cyan on deep blue
		inferno: "#fbbf24",   // High-voltage yellow on dark red
		toxic: "#4ade80",     // Radioactive green on dark green
		synthwave: "#f472b6", // Neon pink on magenta-dark
		aurora: "#2dd4bf"     // Teal aurora on dark teal
	};

	const currentColor=glowColors[theme]||glowColors.dark;

	return (
		<div
			ref={cursorRef}
			className={`custom-cursor-container ${isClicking? "echo-slam-active":""}`}
			style={{"--cursor-color": currentColor}}
		>
			<div className={`custom-cursor ${isPointer? "pointer-active":""}`}>

				{/* The Core Pointer Shield */}
				<div className="cursor-pointer-shape">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M5.5 3.21V20.8L9.9 16.4L11.5 20.3L14.6 19.1L13.1 15.2H18.5L5.5 3.21Z"
							fill="#000"
							stroke="white"
							strokeWidth="1.5"
						/>
					</svg>
				</div>

				{/* Discharge System: Real Jagged Lightning */}
				<div className="lightning-system">
					{[...Array(6)].map((_,i) => (
						<div key={i} className={`bolt bolt-${i+1}`} />
					))}
				</div>

				{/* Enhanced Echo Slam with Smoke & Fog */}
				{isClicking&&(
					<div className="echo-slam-container">
						<div className="echo-ring"></div>
						<div className="smoke-waves">
							<div className="smoke-wisp wisp-1"></div>
							<div className="smoke-wisp wisp-2"></div>
							<div className="smoke-wisp wisp-3"></div>
							<div className="smoke-wisp wisp-4"></div>
							<div className="smoke-wisp wisp-5"></div>
							<div className="smoke-wisp wisp-6"></div>
						</div>
						<div className="fog-ring"></div>
						<div className="smoke-ring"></div>
					</div>
				)}

				{/* Atmospheric Plasma Glow */}
				<div className="plasma-aura"></div>
			</div>

			<style jsx global>{`
				* {
					cursor: none !important;
				}

				/* Screen Shake Animation */
				body.echo-shake {
					animation: slam-shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
				}

				@keyframes slam-shake {
					10%, 90% { transform: translate3d(-1px, 0, 0); }
					20%, 80% { transform: translate3d(2px, 0, 0); }
					30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
					40%, 60% { transform: translate3d(3px, 0, 0); }
				}

				@media (max-width: 1024px) {
					* { cursor: auto !important; }
					.custom-cursor-container { display: none; }
				}

				.custom-cursor-container {
					position: fixed;
					top: 0;
					left: 0;
					width: 0;
					height: 0;
					pointer-events: none;
					z-index: 999999;
					will-change: transform;
				}

				.custom-cursor {
					position: relative;
					width: 24px;
					height: 24px;
					left: -12px;
					top: -12px;
					transition: transform 0.1s;
				}

				/* Lightning Bolt Styling */
				.lightning-system {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					width: 100px;
					height: 100px;
				}

				.bolt {
					position: absolute;
					background: #fff;
					box-shadow: 0 0 5px #fff, 0 0 15px var(--cursor-color);
					opacity: 0;
					pointer-events: none;
					border-radius: 2px;
				}

				/* Jagged Clip-Paths */
				.bolt-1 { width: 3px; height: 40px; left: 50%; bottom: 60%; clip-path: polygon(50% 0%, 100% 20%, 0% 40%, 100% 60%, 0% 80%, 50% 100%); animation: lightning-flicker 1.5s infinite; }
				.bolt-2 { width: 2px; height: 30px; left: 60%; top: 40%; transform: rotate(45deg); clip-path: polygon(0% 0%, 100% 30%, 20% 50%, 80% 80%, 0% 100%); animation: lightning-flicker 1.8s infinite 0.2s; }
				.bolt-3 { width: 3px; height: 50px; right: 50%; top: 50%; transform: rotate(-60deg); clip-path: polygon(50% 0%, 0% 25%, 100% 50%, 0% 75%, 50% 100%); animation: lightning-flicker 2s infinite 0.5s; }
				.bolt-4 { width: 2px; height: 25px; left: 45%; top: 60%; transform: rotate(180deg); animation: lightning-flicker 1.2s infinite 0.7s; }

				@keyframes lightning-flicker {
					0%, 94%, 100% { opacity: 0; transform: scaleY(0) rotate(inherit); }
					95% { opacity: 1; transform: scaleY(1.2) rotate(inherit) skewX(20deg); filter: brightness(3); }
					97% { opacity: 0.5; transform: scaleY(0.8) rotate(inherit); }
					98% { opacity: 1; transform: scaleY(1.5) rotate(inherit) skewX(-20deg); }
				}

				/* Echo Slam Visuals - Compact Area */
				.echo-slam-container {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					width: 150px;
					height: 150px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.echo-ring {
					position: absolute;
					width: 0;
					height: 0;
					border: 2px solid var(--cursor-color);
					border-radius: 50%;
					opacity: 0;
					box-shadow: 0 0 10px var(--cursor-color);
					animation: slam-pulse 0.4s cubic-bezier(0, 0.5, 0.5, 1) forwards;
				}

				/* Smoke Waves - Light & 80% Transparent */
				.smoke-waves {
					position: absolute;
					width: 100%;
					height: 100%;
					animation: smoke-rotate 1s linear forwards;
				}

				@keyframes smoke-rotate {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(15deg); }
				}

				.smoke-wisp {
					position: absolute;
					top: 50%;
					left: 50%;
					width: 25px;
					height: 25px;
					background: var(--cursor-color);
					filter: blur(12px);
					border-radius: 50%;
					opacity: 0;
					transform: translate(-50%, -50%) scale(0);
				}

				.wisp-1 { animation: smoke-expand-roll 0.5s ease-out forwards; }
				.wisp-2 { animation: smoke-expand-roll 0.5s ease-out 0.05s forwards; transform: translate(-50%, -50%) rotate(60deg); }
				.wisp-3 { animation: smoke-expand-roll 0.5s ease-out 0.1s forwards; transform: translate(-50%, -50%) rotate(120deg); }
				.wisp-4 { animation: smoke-expand-roll 0.5s ease-out 0.15s forwards; transform: translate(-50%, -50%) rotate(180deg); }
				.wisp-5 { animation: smoke-expand-roll 0.5s ease-out 0.2s forwards; transform: translate(-50%, -50%) rotate(240deg); }
				.wisp-6 { animation: smoke-expand-roll 0.5s ease-out 0.25s forwards; transform: translate(-50%, -50%) rotate(300deg); }

				@keyframes smoke-expand-roll {
					0% { 
						transform: translate(-50%, -50%) scale(0) rotate(0deg); 
						opacity: 0.2; /* 80% transparent */
						filter: blur(4px);
					}
					100% { 
						transform: translate(-50%, -50%) scale(4) rotate(30deg); 
						opacity: 0; 
						filter: blur(25px);
					}
				}

				/* Fog Ring - Light & Subtle */
				.fog-ring {
					position: absolute;
					width: 0;
					height: 0;
					background: radial-gradient(circle, var(--cursor-color) 0%, transparent 80%);
					filter: blur(15px);
					border-radius: 50%;
					opacity: 0;
					animation: fog-expand 0.5s ease-out forwards;
				}

				@keyframes fog-expand {
					0% { width: 0; height: 0; opacity: 0.15; }
					100% { width: 180px; height: 180px; opacity: 0; }
				}

				/* Smoke Ring - Snappy blast */
				.smoke-ring {
					position: absolute;
					width: 0;
					height: 0;
					border: 5px solid var(--cursor-color);
					filter: blur(15px);
					border-radius: 50%;
					opacity: 0;
					animation: smoke-ring-expand 0.4s ease-out forwards;
				}

				@keyframes smoke-ring-expand {
					0% { width: 0; height: 0; opacity: 0.15; border-width: 15px; }
					100% { width: 220px; height: 220px; opacity: 0; border-width: 2px; }
				}

				@keyframes slam-pulse {
					0% { width: 0; height: 0; opacity: 0.4; border-width: 4px; }
					100% { width: 160px; height: 160px; opacity: 0; border-width: 1px; }
				}

				.plasma-aura {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					width: 20px;
					height: 20px;
					background: var(--cursor-color);
					filter: blur(20px);
					opacity: 0.15;
					border-radius: 50%;
				}

				.pointer-active {
					transform: scale(1.2);
				}

				.pointer-active .bolt {
					animation-duration: 0.5s;
					box-shadow: 0 0 10px #fff, 0 0 30px var(--cursor-color);
				}
			`}</style>
		</div>
	);
}