"use client";

import {useState,useEffect} from "react";
import {cn} from "@/lib/utils";
import {AppSidebar} from "@/components/app-sidebar";
import {MobileHeader} from "@/components/mobile-header";
import {LandingLoader} from "@/components/landing-loader";
import {SimpleLoader} from "@/components/simple-loader";
import {AntigravityExperience} from "@/components/antigravity-experience";
import {ThemeDialog} from "@/components/theme-dialog";
import {LoginScreen} from "@/components/login-screen";
import {ScrollArea} from "@/components/ui/scroll-area";
import {hasAccess,ROLES} from "@/lib/auth";
import {
	CourseGenerator,
	BlogGenerator,
	GlossaryGenerator,
	ResourceGenerator,
	HTMLCleaner,
	ImageConverter
} from "@/components/generators";

export default function Home() {
	const [isLoading,setIsLoading]=useState(true);
	const [loaderVariant,setLoaderVariant]=useState("game"); // "game" | "simple" | "antigravity"
	const [isChecking,setIsChecking]=useState(true); // Prevent flash
	const [activeTab,setActiveTab]=useState("course");
	const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
	const [themeDialogOpen,setThemeDialogOpen]=useState(false);
	const [user,setUser]=useState(null);

	useEffect(() => {
		// 1. Check Reward Status (Priority)
		const rewardTime=localStorage.getItem('reward_claim_time');
		const TWO_HOURS=2*60*60*1000;

		let activeUser=null;
		let shouldShowLoader=true;
		let isRewardActive=false;

		if(rewardTime) {
			const elapsed=Date.now()-parseInt(rewardTime);
			if(elapsed<TWO_HOURS) {
				// Valid Reward Session - Auto Login
				activeUser={
					username: 'admin',
					role: 'admin',
					name: 'Reward Admin (2H)',
					loginTime: Date.now()
				};
				isRewardActive=true;
			}
		}

		// 2. Check session storage for user (if not already handled by reward)
		if(!activeUser) {
			const storedUser=sessionStorage.getItem('user');
			if(storedUser) {
				activeUser=JSON.parse(storedUser);
			}
		}

		// Apply User if found
		if(activeUser) {
			setUser(activeUser);
			sessionStorage.setItem('user',JSON.stringify(activeUser));

			// Restore active tab logic
			if(!isRewardActive) { // Only restore tab for normal logins, rewards usually default or safe to default
				const savedTab=sessionStorage.getItem('activeTab');
				if(savedTab&&hasAccess(activeUser.role,savedTab)) {
					setActiveTab(savedTab);
				} else {
					if(activeUser.role==='blog_creator') setActiveTab('blog');
					else if(activeUser.role==='content_creator') setActiveTab('course');
				}
			}

			// If we have a user, we never show the game loader.
			shouldShowLoader=false;
		}

		// 3. Check if user already attempted and failed this session
		// Only relevant if we don't have an active user yet.
		if(!activeUser) {
			const attemptStatus=sessionStorage.getItem('reward_attempted');
			// If they failed, or explicitly succeeded (though success usually implies activeUser via reward check, 
			// unless reward expired but session remains? If reward expired, activeUser is null. 
			// If 'success' flag is there but reward expired... we probably treat as new or expired.)

			if(attemptStatus==='failed') {
				shouldShowLoader=false; // Skip game, show login
			}
			// If attemptStatus is 'success' but no activeUser (reward expired), shouldShowLoader stays true (retry? or blocked?)
			// Assuming if reward expired, they can try again? Or should we block? 
			// User said "expired reward - Do NOT show loader again" in previous logic.
			// Let's stick to previous logic: if reward expired, skipLoader was true => isLoading false.

			if(rewardTime&&!isRewardActive) {
				shouldShowLoader=false;
			}
		}

		setIsLoading(shouldShowLoader);
		setIsChecking(false);
	},[]);

	const handleRewardUnlock=(role='admin') => {
		const roleNames={
			'admin': 'Reward Admin (2H)',
			'content_creator': 'Content Reward (2H)',
			'blog_creator': 'Blog Reward (2H)'
		};

		const rewardUser={
			username: 'reward_user',
			role: role,
			name: roleNames[role]||'Reward User (2H)',
			loginTime: Date.now()
		};
		setUser(rewardUser);
		sessionStorage.setItem('user',JSON.stringify(rewardUser));
		localStorage.setItem('reward_claim_time',Date.now().toString());
		sessionStorage.setItem('reward_attempted','success');
	};

	const handleLoaderComplete=() => {
		setIsLoading(false);
		sessionStorage.setItem('hasVisited','true');
	};

	const handleLoaderFail=() => {
		setUser(null);
		sessionStorage.removeItem('user');
		sessionStorage.setItem('reward_attempted','failed');
	};

	const handleLogin=(loggedInUser) => {
		setUser(loggedInUser);
		sessionStorage.setItem('user',JSON.stringify(loggedInUser));
		// Set default tab based on role
		if(loggedInUser.role==='blog_creator') {
			setActiveTab('blog');
		} else if(loggedInUser.role==='content_creator') {
			setActiveTab('course');
		} else {
			setActiveTab('course');
		}
	};

	const handleLogout=() => {
		setUser(null);
		sessionStorage.removeItem('user');
		setIsLoading(false); // Ensure loader doesn't show again on logout
	};

	const renderActiveGenerator=() => {
		if(!user) return null;

		// Security check
		if(!hasAccess(user.role,activeTab)) {
			return (
				<div className="flex h-[50vh] flex-col items-center justify-center text-center">
					<h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
					<p>You do not have permission to view this generator.</p>
				</div>
			);
		}

		switch(activeTab) {
		case "course":
			return <CourseGenerator />;
		case "glossary":
			return <GlossaryGenerator />;
		case "resources":
			return <ResourceGenerator />;
		case "blog":
			return <BlogGenerator />;
		case "html-cleaner":
			return <HTMLCleaner />;
		case "image-converter":
			return <ImageConverter />;
		default:
			return <CourseGenerator />;
		}
	};

	const getPageTitle=() => {
		switch(activeTab) {
		case "course":
			return "Web Content Generator";
		case "glossary":
			return "Glossary Generator";
		case "resources":
			return "Resource Generator";
		case "blog":
			return "Blog Generator";
		case "html-cleaner":
			return "HTML Cleaner";
		case "image-converter":
			return "Image Converter";
		default:
			return "Course Content Generator";
		}
	};

	if(isChecking) {
		return <div className="min-h-screen bg-background" />;
	}

	return (
		<>
			{/* Landing Loader or Simple Loader */}
			{isLoading&&(
				loaderVariant==="game"? (
					<LandingLoader onComplete={handleLoaderComplete} onUnlock={handleRewardUnlock} onFail={handleLoaderFail} />
				):loaderVariant==="antigravity"? (
					<AntigravityExperience onComplete={handleLoaderComplete} />
				):(
					<SimpleLoader />
				)
			)}

			{!user? (
				<LoginScreen onLogin={handleLogin} />
			):(
				<>
					{/* Main App Layout */}
					<div className={cn(
						"min-h-screen bg-transparent transition-opacity duration-500",
						isLoading&&!user? "opacity-0":"opacity-100"
					)}>
						{/* Desktop Sidebar */}
						<div className="hidden lg:block">
							<AppSidebar
								activeTab={activeTab}
								onTabChange={setActiveTab}
								collapsed={sidebarCollapsed}
								onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
								onThemeToggle={() => setThemeDialogOpen(true)}
								user={user}
								onLogout={handleLogout}
							/>
						</div>

						{/* Mobile Header */}
						<MobileHeader
							activeTab={activeTab}
							onTabChange={setActiveTab}
							onThemeToggle={() => setThemeDialogOpen(true)}
						/>

						{/* Main Content */}
						<main
							className={cn(
								"min-h-screen transition-all duration-300 lg:pt-0",
								sidebarCollapsed? "lg:ml-16":"lg:ml-64"
							)}
						>
							<ScrollArea className="h-screen">
								{/* Hero Section */}
								<div className="border-b border-border bg-gradient-to-b from-muted/50 to-transparent py-12 lg:py-16 hero-section animate-in-card">
									<div className="container mx-auto px-4 text-center">
										<img
											src="https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif"
											alt="Content Suite Logo"
											className="mx-auto mb-6 h-24 w-24 rounded-full shadow-lg ring-4 ring-primary/20"
										/>
										<h1 id="mainTitle" className="mb-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent lg:text-4xl drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
											{getPageTitle()}
										</h1>
										<p className="mx-auto max-w-2xl text-muted-foreground font-medium">
											Extract Overview, Syllabus, FAQs, Glossary, Resources and Blog Content from your documents
										</p>
									</div>
								</div>

								{/* Content Area */}
								<div className="container mx-auto px-4 py-8 animate-in-card [animation-delay:200ms]">
									{renderActiveGenerator()}
								</div>
							</ScrollArea>
						</main>
					</div>

					{/* Theme Dialog */}
					<ThemeDialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen} />
				</>
			)}
		</>
	);
}
