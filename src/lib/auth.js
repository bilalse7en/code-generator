export const USERS = {
	admin: {
		username: 'admin',
		password: 'Bilal@7',
		role: 'admin',
		name: 'Administrator'
	},
	blog: {
		username: 'blog',
		password: 'Blog@123',
		role: 'blog_creator',
		name: 'Blog Editor'
	},
	content: {
		username: 'content',
		password: 'content@123',
		role: 'content_creator',
		name: 'Content Creator'
	}
};

export const ROLES = {
	admin: ['*'],
	blog_creator: ['blog', 'html-cleaner', 'image-converter'],
	content_creator: ['course', 'glossary', 'resources', 'html-cleaner', 'image-converter']
};

export const NAV_ITEMS = [
	{ id: "course", label: "Web Content Generator", icon: "GraduationCap" },
	{ id: "glossary", label: "Glossary Generator", icon: "BookOpen" },
	{ id: "resources", label: "Resource Generator", icon: "FileSpreadsheet" },
	{ id: "blog", label: "Blog Generator", icon: "PenTool" },
	{ id: "html-cleaner", label: "HTML Cleaner", icon: "Code" },
	{ id: "image-converter", label: "Image Converter", icon: "ImageIcon" },
];

export function authenticate(username, password) {
	const user = USERS[username];
	if (user && user.password === password) {
		const { password, ...safeUser } = user;
		return safeUser;
	}
	return null;
}

export function hasAccess(role, featureId) {
	if (!role) return false;
	const allowed = ROLES[role];
	if (!allowed) return false;
	if (allowed.includes('*')) return true;
	return allowed.includes(featureId);
}
