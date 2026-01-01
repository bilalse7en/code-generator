"use client";

import {Button} from "@/components/ui/button";
import {Sheet,SheetContent,SheetTrigger} from "@/components/ui/sheet";
import {Menu,Moon,Sun} from "lucide-react";
import {useTheme} from "next-themes";
import {AppSidebar} from "./app-sidebar";

export function MobileHeader({activeTab,onTabChange,onThemeToggle}) {
	const {theme,setTheme}=useTheme();

	return (
		<header
			className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/10 backdrop-blur-xl px-4 lg:hidden"
			style={{backgroundColor: 'var(--sidebar)'}}
		>
			{/* Theme Toggle */}
			<Button
				variant="ghost"
				size="icon"
				className="btn-theme-toggle-mobile"
				onClick={() => setTheme(theme==='dark'? 'light':'dark')}
			>
				<Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
				<Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
				<span className="sr-only">Toggle theme</span>
			</Button>

			{/* Brand */}
			<div className="flex items-center gap-2">
				<img
					src="https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif"
					alt="Logo"
					className="h-8 w-8 rounded-full"
				/>
				<span className="font-semibold">Content Suite</span>
			</div>

			{/* Mobile Menu */}
			<Sheet>
				<SheetTrigger asChild>
					<Button variant="ghost" size="icon" className="mobile-menu-btn">
						<Menu className="h-5 w-5" />
						<span className="sr-only">Toggle menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="right" className="w-64 p-0">
					<AppSidebar
						activeTab={activeTab}
						onTabChange={onTabChange}
						collapsed={false}
						onToggleCollapse={() => {}}
						onThemeToggle={onThemeToggle}
					/>
				</SheetContent>
			</Sheet>
		</header>
	);
}
