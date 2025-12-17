"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { LandingLoader } from "@/components/landing-loader";
import { ThemeDialog } from "@/components/theme-dialog";
import { LoginScreen } from "@/components/login-screen";
import { ScrollArea } from "@/components/ui/scroll-area";
import { hasAccess, ROLES } from "@/lib/auth";
import {
	CourseGenerator,
	BlogGenerator,
	GlossaryGenerator,
	ResourceGenerator,
	HTMLCleaner,
	ImageConverter
} from "@/components/generators";

export default function Home() {
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("course");
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [themeDialogOpen, setThemeDialogOpen] = useState(false);
	const [user, setUser] = useState(null);

	useEffect(() => {
		// Check session storage for user
		const storedUser = sessionStorage.getItem('user');
		if (storedUser) {
			const parsedUser = JSON.parse(storedUser);
			setUser(parsedUser);
			// Restore active tab if accessible
			const savedTab = sessionStorage.getItem('activeTab');
			if (savedTab && hasAccess(parsedUser.role, savedTab)) {
				setActiveTab(savedTab);
			} else {
				// Default tabs based on role
				if (parsedUser.role === 'blog_creator') setActiveTab('blog');
				else if (parsedUser.role === 'content_creator') setActiveTab('course');
			}
		}
	}, []);

	const handleLoaderComplete = () => {
		setIsLoading(false);
		sessionStorage.setItem('hasVisited', 'true');
	};

	const handleLogin = (loggedInUser) => {
		setUser(loggedInUser);
		sessionStorage.setItem('user', JSON.stringify(loggedInUser));
		// Set default tab based on role
		if (loggedInUser.role === 'blog_creator') {
			setActiveTab('blog');
		} else if (loggedInUser.role === 'content_creator') {
			setActiveTab('course');
		} else {
			setActiveTab('course');
		}
	};

	const handleLogout = () => {
		setUser(null);
		sessionStorage.removeItem('user');
		setIsLoading(false); // Ensure loader doesn't show again on logout
	};

	const renderActiveGenerator = () => {
		if (!user) return null;

		// Security check
		if (!hasAccess(user.role, activeTab)) {
			return (
				<div className="flex h-[50vh] flex-col items-center justify-center text-center">
					<h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
					<p>You do not have permission to view this generator.</p>
				</div>
			);
		}

		switch (activeTab) {
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

	const getPageTitle = () => {
		switch (activeTab) {
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

	return (
		<>
			{/* Landing Loader */}
			{isLoading && <LandingLoader onComplete={handleLoaderComplete} />}

			{!user ? (
				<LoginScreen onLogin={handleLogin} />
			) : (
				<>
					{/* Main App Layout */}
					<div className={cn(
						"min-h-screen bg-background transition-opacity duration-500",
						isLoading ? "opacity-0" : "opacity-100"
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
								sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
							)}
						>
							<ScrollArea className="h-screen">
								{/* Hero Section */}
								<div className="border-b border-border bg-gradient-to-b from-muted/50 to-background py-12 lg:py-16 hero-section">
									<div className="container mx-auto px-4 text-center">
										<img
											src="https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif"
											alt="Content Suite Logo"
											className="mx-auto mb-6 h-24 w-24 rounded-full shadow-lg"
										/>
										<h1 id="mainTitle" className="mb-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent lg:text-4xl">
											{getPageTitle()}
										</h1>
										<p className="mx-auto max-w-2xl text-muted-foreground">
											Extract Overview, Syllabus, FAQs, Glossary, Resources and Blog Content from your documents
										</p>
									</div>
								</div>

								{/* Content Area */}
								<div className="container mx-auto px-4 py-8">
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
