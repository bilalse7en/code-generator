/**
 * HTML Cleaner utility functions
 * Cleans and sanitizes HTML content
 */

/**
 * Clean HTML based on provided options
 * @param {string} html - The HTML to clean
 * @param {Object} options - Cleaning options
 * @returns {string} - Cleaned HTML
 */
export function cleanHTML(html, options = {}) {
	const defaultOptions = {
		removeNBSP: true,
		removeClasses: true,
		removeIds: true,
		removeStyleAttrs: true,
		removeDataAttrs: true,
		removeEmptyTags: true,
		removeInlineStyles: true,
		removeFontTags: false,
		minifyHTML: false,
		beautifyHTML: false,
		preserveEssentialAttrs: true,
		removeComments: true,
		normalizeWhitespace: true,
		removeScriptStyleTags: true,
		removeBrTags: true,
		convertLineBreaks: true
	};

	const opts = { ...defaultOptions, ...options };
	let cleaned = html;

	// Remove script and style tags
	if (opts.removeScriptStyleTags) {
		cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
		cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
	}

	// Remove HTML comments
	if (opts.removeComments) {
		cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
	}

	// Remove &nbsp; entities
	if (opts.removeNBSP) {
		cleaned = cleaned.replace(/&nbsp;/gi, ' ');
		cleaned = cleaned.replace(/\u00A0/g, ' ');
	}

	// Parse HTML for attribute manipulation
	const parser = new DOMParser();
	const doc = parser.parseFromString(cleaned, 'text/html');

	// Essential attributes to preserve
	const essentialAttrs = ['href', 'src', 'alt', 'title', 'type', 'name', 'value', 'placeholder', 'for', 'target', 'rel'];

	const allElements = doc.body.querySelectorAll('*');

	allElements.forEach(element => {
		// Remove class attribute
		if (opts.removeClasses) {
			element.removeAttribute('class');
		}

		// Remove id attribute
		if (opts.removeIds) {
			element.removeAttribute('id');
		}

		// Remove style attribute
		if (opts.removeStyleAttrs) {
			element.removeAttribute('style');
		}

		// Remove data-* attributes
		if (opts.removeDataAttrs) {
			const dataAttrs = Array.from(element.attributes)
				.filter(attr => attr.name.startsWith('data-'))
				.map(attr => attr.name);
			dataAttrs.forEach(attr => element.removeAttribute(attr));
		}

		// Remove non-essential attributes
		if (!opts.preserveEssentialAttrs) {
			const attrsToRemove = Array.from(element.attributes)
				.filter(attr => !essentialAttrs.includes(attr.name))
				.map(attr => attr.name);
			attrsToRemove.forEach(attr => element.removeAttribute(attr));
		}
	});

	// Remove font and span tags (preserving content)
	if (opts.removeFontTags) {
		const fontElements = doc.body.querySelectorAll('font, span');
		fontElements.forEach(el => {
			const parent = el.parentNode;
			while (el.firstChild) {
				parent.insertBefore(el.firstChild, el);
			}
			parent.removeChild(el);
		});
	}

	// Remove <br> tags
	if (opts.removeBrTags) {
		const brElements = doc.body.querySelectorAll('br');
		brElements.forEach(br => br.remove());
	}

	// Remove empty tags
	if (opts.removeEmptyTags) {
		const emptyTagsSelector = 'p, div, span, li, td, th, strong, em, b, i, u';
		let hasEmptyTags = true;
		while (hasEmptyTags) {
			const emptyElements = doc.body.querySelectorAll(emptyTagsSelector);
			let removed = 0;
			emptyElements.forEach(el => {
				if (!el.textContent.trim() && !el.querySelector('img, video, audio, iframe, input, button')) {
					el.remove();
					removed++;
				}
			});
			hasEmptyTags = removed > 0;
		}
	}

	// Get cleaned HTML
	cleaned = doc.body.innerHTML;

	// Normalize whitespace
	if (opts.normalizeWhitespace) {
		cleaned = cleaned.replace(/\s+/g, ' ');
		cleaned = cleaned.replace(/>\s+</g, '><');
		cleaned = cleaned.replace(/\s+>/g, '>');
		cleaned = cleaned.replace(/<\s+/g, '<');
	}

	// Beautify HTML
	if (opts.beautifyHTML && !opts.minifyHTML) {
		cleaned = beautifyHTMLOutput(cleaned);
	}

	// Minify HTML
	if (opts.minifyHTML) {
		cleaned = cleaned.replace(/\s+/g, ' ').trim();
		cleaned = cleaned.replace(/>\s+</g, '><');
	}

	return cleaned.trim();
}

/**
 * Beautify HTML output with proper indentation
 * @param {string} html - HTML to beautify
 * @returns {string} - Beautified HTML
 */
function beautifyHTMLOutput(html) {
	let formatted = '';
	let indent = 0;
	const indentString = '  ';

	// Split by tags
	const tokens = html.split(/(<[^>]+>)/);

	tokens.forEach(token => {
		if (!token.trim()) return;

		// Check if closing tag
		if (token.match(/^<\/\w/)) {
			indent = Math.max(0, indent - 1);
		}

		// Add indentation
		if (token.match(/^<\w[^>]*[^\/]>$/)) {
			formatted += indentString.repeat(indent) + token + '\n';
			// Check if not self-closing and not inline
			if (!token.match(/<(br|hr|img|input|meta|link)/i)) {
				indent++;
			}
		} else if (token.match(/^<\/\w/)) {
			formatted += indentString.repeat(indent) + token + '\n';
		} else if (token.match(/^<\w[^>]*\/>$/)) {
			// Self-closing tag
			formatted += indentString.repeat(indent) + token + '\n';
		} else {
			// Text content
			const trimmed = token.trim();
			if (trimmed) {
				formatted += indentString.repeat(indent) + trimmed + '\n';
			}
		}
	});

	return formatted.trim();
}

/**
 * Get HTML statistics
 * @param {string} html - HTML content
 * @returns {Object} - Statistics object
 */
export function getHTMLStats(html) {
	const charCount = html.length;
	const wordCount = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w).length;
	const nbspCount = (html.match(/&nbsp;/gi) || []).length + (html.match(/\u00A0/g) || []).length;
	const tagCount = (html.match(/<[^>]+>/g) || []).length;

	// Calculate "clean score" - percentage of actual content vs markup
	const textContent = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
	const cleanScore = html.length > 0 ? Math.round((textContent.length / html.length) * 100) : 0;

	return {
		charCount,
		wordCount,
		nbspCount,
		tagCount,
		cleanScore
	};
}

/**
 * Calculate reduction rate after cleaning
 * @param {string} original - Original HTML
 * @param {string} cleaned - Cleaned HTML
 * @returns {number} - Reduction percentage
 */
export function getReductionRate(original, cleaned) {
	if (!original || original.length === 0) return 0;
	const reduction = ((original.length - cleaned.length) / original.length) * 100;
	return Math.max(0, Math.round(reduction));
}
