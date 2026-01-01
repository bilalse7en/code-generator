"use client";

import {cn} from "@/lib/utils";
import {
	GraduationCap,
	BookOpen,
	FileSpreadsheet,
	PenTool,
	Code,
	ImageIcon,
	ChevronLeft,
	ChevronRight,
	Palette,
	LogOut
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Tooltip,TooltipContent,TooltipProvider,TooltipTrigger} from "@/components/ui/tooltip";
import {Separator} from "@/components/ui/separator";
import {hasAccess} from "@/lib/auth";

const navItems=[
	{id: "course",label: "Web Content Generator",icon: GraduationCap},
	{id: "glossary",label: "Glossary Generator",icon: BookOpen},
	{id: "resources",label: "Resource Generator",icon: FileSpreadsheet},
	{id: "blog",label: "Blog Generator",icon: PenTool},
	{id: "html-cleaner",label: "HTML Cleaner",icon: Code},
	{id: "image-converter",label: "Image Converter",icon: ImageIcon},
];

export function AppSidebar({
	activeTab,
	onTabChange,
	collapsed,
	onToggleCollapse,
	onThemeToggle,
	user,
	onLogout
}) {
	return (
		<TooltipProvider delayDuration={0}>
			<aside
				className={cn(
					"fixed left-0 top-0 z-40 h-screen border-r border-white/10 backdrop-blur-xl transition-all duration-300 sidebar-wrapper",
					collapsed? "w-16":"w-64"
				)}
				style={{backgroundColor: 'var(--sidebar)'}}
			>
				{/* Header */}
				<div className={cn(
					"flex items-center gap-3 border-b border-border p-4 logo",
					collapsed&&"justify-center"
				)}>
					<img
						src="https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif"
						alt="Logo"
						className="h-10 w-10 rounded-full"
					/>
					{!collapsed&&(
						<div className="flex flex-col overflow-hidden">
							<span className="font-semibold text-foreground simple-text whitespace-nowrap">Content Suite</span>
							{user&&<span className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">{user.name}</span>}
						</div>
					)}
				</div>

				{/* Navigation */}
				<nav className="flex-1 space-y-1 p-2 sidebar-nav overflow-y-auto">
					{navItems
						.filter(item => hasAccess(user?.role,item.id))
						.map((item) => {
							const Icon=item.icon;
							const isActive=activeTab===item.id;

							const button=(
								<Button
									key={item.id}
									variant={isActive? "secondary":"ghost"}
									className={cn(
										"w-full justify-start gap-3 transition-all nav-link",
										collapsed&&"justify-center px-2",
										isActive&&"bg-primary/10 text-primary border-l-2 border-primary active"
									)}
									onClick={() => onTabChange(item.id)}
								>
									<Icon className="h-5 w-5 shrink-0" />
									{!collapsed&&(
										<span className="truncate nav-text">{item.label}</span>
									)}
								</Button>
							);

							if(collapsed) {
								return (
									<Tooltip key={item.id}>
										<TooltipTrigger asChild>
											{button}
										</TooltipTrigger>
										<TooltipContent side="right" className="font-medium">
											{item.label}
										</TooltipContent>
									</Tooltip>
								);
							}

							return button;
						})}
				</nav>

				{/* Footer */}
				<div className="border-t border-border p-2 space-y-1">
					<Separator className="my-2" />

					{/* Theme Toggle */}
					{collapsed? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									className="w-full justify-center px-2"
									onClick={onThemeToggle}
								>
									<Palette className="h-5 w-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="right">Change Theme</TooltipContent>
						</Tooltip>
					):(
						<Button
							variant="ghost"
							className="w-full justify-start gap-3"
							onClick={onThemeToggle}
						>
							<Palette className="h-5 w-5" />
							<span>Change Theme</span>
						</Button>
					)}

					{/* Logout Button */}
					{collapsed? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									className="w-full justify-center px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
									onClick={onLogout}
								>
									<LogOut className="h-5 w-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="right">Logout</TooltipContent>
						</Tooltip>
					):(
						<Button
							variant="ghost"
							className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
							onClick={onLogout}
						>
							<LogOut className="h-5 w-5" />
							<span>Logout</span>
						</Button>
					)}

					{/* Collapse Toggle */}
					{collapsed? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									className="w-full justify-center px-2 mt-2"
									onClick={onToggleCollapse}
								>
									<ChevronRight className="h-5 w-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="right">Expand Sidebar</TooltipContent>
						</Tooltip>
					):(
						<Button
							variant="ghost"
							className="w-full justify-start gap-3 mt-2"
							onClick={onToggleCollapse}
						>
							<ChevronLeft className="h-5 w-5" />
							<span>Collapse Sidebar</span>
						</Button>
					)}
				</div>
			</aside>
		</TooltipProvider>
	);
}
