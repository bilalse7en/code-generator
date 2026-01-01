"use client";

import {useEffect,useRef,useMemo} from "react";
import {useTheme} from "next-themes";

export function BackgroundSpace() {
	const canvasRef=useRef(null);
	const {theme}=useTheme();
	const mouse=useRef({x: -1000,y: -1000,vx: 0,vy: 0,lastX: 0,lastY: 0});
	const time=useRef(0);

	useEffect(() => {
		const canvas=canvasRef.current;
		if(!canvas) return;
		const ctx=canvas.getContext("2d");
		let animationFrameId;

		let stars=[];
		const count=200; // Increased density for better wave visibility

		const initStars=() => {
			canvas.width=window.innerWidth;
			canvas.height=window.innerHeight;
			stars=Array.from({length: count},() => {
				const x=Math.random()*canvas.width;
				const y=Math.random()*canvas.height;
				return {
					x,
					y,
					baseX: x,
					baseY: y,
					size: Math.random()*2+0.5,
					speed: Math.random()*0.5+0.1, // Drifting speed
					opacity: Math.random()*0.5+0.5,
					twinkleSpeed: Math.random()*0.02+0.005,
					glow: Math.random()>0.8,
					vx: 0,
					vy: 0,
					angle: Math.random()*Math.PI*2
				};
			});
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
		};

		const handleMouseDown=(e) => {
			const x=e.clientX;
			const y=e.clientY;

			// Apply a sudden massive blast to all stars
			stars.forEach(star => {
				const dx=star.x-x;
				const dy=star.y-y;
				const dist=Math.sqrt(dx*dx+dy*dy);
				const blastRadius=Math.max(canvas.width,canvas.height)*0.5; // 50% from cursor/screen

				if(dist<blastRadius) {
					// Powerful exponential push
					const force=(blastRadius-dist)/blastRadius;
					const strength=25.0; // Intense blast strength

					star.vx+=(dx/dist)*force*force*strength;
					star.vy+=(dy/dist)*force*force*strength;

					// Make them bright during blast
					star.opacity=1;
				}
			});
		};

		const draw=() => {
			ctx.clearRect(0,0,canvas.width,canvas.height);
			time.current+=0.01;

			const colorMap={
				toxic: "#4ade80",
				synthwave: "#d946ef",
				nebula: "#818cf8",
				aurora: "#2dd4bf",
				inferno: "#fbbf24",
				dark: "#ffffff",
				light: "#000000"
			};

			const starColor=colorMap[theme]||"#ffffff";

			// Decelerate mouse velocity
			mouse.current.vx*=0.95;
			mouse.current.vy*=0.95;

			stars.forEach(star => {
				// 1. Natural Drift
				star.x-=star.speed;

				// 2. Wave Motion (Ambient)
				const waveOffset=Math.sin(time.current+star.angle)*0.2;
				star.y+=waveOffset;

				// 3. Cursor Proximity / Wind Effect
				const dx=star.x-mouse.current.x;
				const dy=star.y-mouse.current.y;
				const dist=Math.sqrt(dx*dx+dy*dy);
				const influenceRadius=40;

				if(dist<influenceRadius) {
					// Proximity force: Inverse square-ish repulsion
					const force=(influenceRadius-dist)/influenceRadius;
					const strength=4.0; // Stronger push

					// Repel from cursor
					star.vx+=(dx/dist)*force*strength;
					star.vy+=(dy/dist)*force*strength;

					// Wind Velocity Influence (Directional drag)
					star.vx+=mouse.current.vx*force*0.2;
					star.vy+=mouse.current.vy*force*0.2;

					// Subtle "Wave" ripple based on mouse movement
					star.opacity=Math.min(1,star.opacity+0.1);
				}

				// Apply physics
				star.x+=star.vx;
				star.y+=star.vy;

				// Friction / Damping (Increased friction during calm, but let them fly)
				star.vx*=0.94;
				star.vy*=0.94;

				// Boundary Handlers
				if(star.x<-50) {
					star.x=canvas.width+50;
					star.y=Math.random()*canvas.height;
				}
				if(star.x>canvas.width+50) star.x=-50;
				if(star.y<-50) star.y=canvas.height+50;
				if(star.y>canvas.height+50) star.y=-50;

				// Twinkle Logic
				star.opacity+=star.twinkleSpeed;
				if(star.opacity>1||star.opacity<0.2) star.twinkleSpeed*=-1;

				// Render
				ctx.beginPath();
				ctx.arc(star.x,star.y,star.size,0,Math.PI*2);

				ctx.save();
				ctx.globalAlpha=Math.max(0.1,star.opacity);
				ctx.fillStyle=starColor;

				if(star.glow) {
					ctx.shadowBlur=12;
					ctx.shadowColor=starColor;
				}

				ctx.fill();
				ctx.restore();
			});

			animationFrameId=requestAnimationFrame(draw);
		};

		window.addEventListener("resize",initStars);
		window.addEventListener("mousemove",handleMouseMove);
		window.addEventListener("mousedown",handleMouseDown);
		initStars();
		draw();

		return () => {
			window.removeEventListener("resize",initStars);
			window.removeEventListener("mousemove",handleMouseMove);
			window.removeEventListener("mousedown",handleMouseDown);
			cancelAnimationFrame(animationFrameId);
		};
	},[theme]);

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 z-[-1] pointer-events-none transition-opacity duration-1000"
			style={{background: 'transparent'}}
		/>
	);
}
