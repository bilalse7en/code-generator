// Theme configuration for the application
export const themes = [
	{ id: 'light', name: 'Professional Light', icon: 'Sun' },
	{ id: 'dark', name: 'Professional Dark', icon: 'Moon' },
	{ id: 'nebula', name: 'Cosmic Nebula', icon: 'Sparkles' },
	{ id: 'inferno', name: 'Magma Inferno', icon: 'Flame' },
	{ id: 'toxic', name: 'Toxic Matrix', icon: 'Biohazard' },
	{ id: 'synthwave', name: 'Neon Synthwave', icon: 'Gamepad2' },
	{ id: 'aurora', name: 'Arctic Aurora', icon: 'Snowflake' }
];

export const getThemeClass = (theme) => {
	// Simple pass-through since we use simple class names
	return theme || 'dark';
};
