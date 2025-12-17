"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
	Moon,
	Sun,
	Sparkles,
	Flame,
	Biohazard,
	Gamepad2,
	Snowflake,
	Check
} from "lucide-react";

const themes = [
	{ id: 'light', name: 'Professional Light', icon: Sun, description: 'Clean white workspace' },
	{ id: 'dark', name: 'Professional Dark', icon: Moon, description: 'Deep slate focus' },
	{ id: 'nebula', name: 'Cosmic Nebula', icon: Sparkles, description: 'Deep space gradients & glow' },
	{ id: 'inferno', name: 'Magma Inferno', icon: Flame, description: 'Intense red/orange heat' },
	{ id: 'toxic', name: 'Toxic Matrix', icon: Biohazard, description: 'Radioactive green data' },
	{ id: 'synthwave', name: 'Neon Synthwave', icon: Gamepad2, description: 'Retro 80s pink/cyan' },
	{ id: 'aurora', name: 'Arctic Aurora', icon: Snowflake, description: 'Ethereal teal & purple' }
];

export function ThemeDialog({ open, onOpenChange }) {
	const { theme, setTheme } = useTheme();

	const handleThemeChange = (themeId) => {
		setTheme(themeId);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Choose Theme</DialogTitle>
				</DialogHeader>
				<div className="grid gap-3 py-4">
					{themes.map((t) => {
						const Icon = t.icon;
						const isActive = theme === t.id;

						return (
							<Button
								key={t.id}
								variant={isActive ? "secondary" : "outline"}
								className="w-full justify-start gap-3 h-auto py-3"
								onClick={() => handleThemeChange(t.id)}
							>
								<div className={`rounded-full p-2 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
									<Icon className="h-5 w-5" />
								</div>
								<div className="flex-1 text-left">
									<div className="font-medium">{t.name}</div>
									<div className="text-xs text-muted-foreground">{t.description}</div>
								</div>
								{isActive && (
									<Check className="h-5 w-5 text-primary" />
								)}
							</Button>
						);
					})}
				</div>
			</DialogContent>
		</Dialog>
	);
}
