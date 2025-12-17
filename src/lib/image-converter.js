/**
 * Image Converter utility functions
 * Converts images between different formats using HTML5 Canvas
 */

/**
 * Convert an image file to a different format
 * @param {File} file - The image file to convert
 * @param {string} toFormat - Target format (png, jpg, webp, etc.)
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} - Converted image data
 */
export async function convertImage(file, toFormat, options = {}) {
	const defaultOptions = {
		quality: 100,
		width: null,
		height: null,
		maintainAspectRatio: true
	};

	const opts = { ...defaultOptions, ...options };

	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			const img = new Image();

			img.onload = () => {
				try {
					// Calculate dimensions
					let newWidth = opts.width || img.width;
					let newHeight = opts.height || img.height;

					if (opts.maintainAspectRatio && opts.width && !opts.height) {
						newHeight = Math.round(img.height * (opts.width / img.width));
					} else if (opts.maintainAspectRatio && opts.height && !opts.width) {
						newWidth = Math.round(img.width * (opts.height / img.height));
					}

					// Create canvas
					const canvas = document.createElement('canvas');
					canvas.width = newWidth;
					canvas.height = newHeight;

					const ctx = canvas.getContext('2d');

					// Fill background for JPEG (which doesn't support transparency)
					if (toFormat === 'jpg' || toFormat === 'jpeg') {
						ctx.fillStyle = '#FFFFFF';
						ctx.fillRect(0, 0, newWidth, newHeight);
					}

					// Draw image
					ctx.drawImage(img, 0, 0, newWidth, newHeight);

					// Get MIME type
					const mimeType = getMimeType(toFormat);
					const quality = opts.quality / 100;

					// Convert to blob
					canvas.toBlob((blob) => {
						if (!blob) {
							reject(new Error('Failed to convert image'));
							return;
						}

						const convertedUrl = URL.createObjectURL(blob);

						resolve({
							blob,
							url: convertedUrl,
							originalSize: file.size,
							convertedSize: blob.size,
							width: newWidth,
							height: newHeight,
							format: toFormat,
							fileName: getConvertedFileName(file.name, toFormat)
						});
					}, mimeType, quality);

				} catch (error) {
					reject(error);
				}
			};

			img.onerror = () => reject(new Error('Failed to load image'));
			img.src = e.target.result;
		};

		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsDataURL(file);
	});
}

/**
 * Get MIME type for format
 * @param {string} format - Image format
 * @returns {string} - MIME type
 */
function getMimeType(format) {
	const mimeTypes = {
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		webp: 'image/webp',
		gif: 'image/gif',
		avif: 'image/avif',
		tiff: 'image/tiff',
		bmp: 'image/bmp'
	};
	return mimeTypes[format.toLowerCase()] || 'image/png';
}

/**
 * Get converted file name
 * @param {string} originalName - Original file name
 * @param {string} toFormat - Target format
 * @returns {string} - New file name
 */
function getConvertedFileName(originalName, toFormat) {
	const baseName = originalName.replace(/\.[^/.]+$/, '');
	return `${baseName}.${toFormat}`;
}

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
export function formatFileSize(bytes) {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate size reduction percentage
 * @param {number} originalSize - Original size in bytes
 * @param {number} convertedSize - Converted size in bytes
 * @returns {number} - Reduction percentage
 */
export function calculateReduction(originalSize, convertedSize) {
	if (originalSize === 0) return 0;
	const reduction = ((originalSize - convertedSize) / originalSize) * 100;
	return Math.round(reduction);
}

/**
 * Validate image file
 * @param {File} file - File to validate
 * @param {string} expectedFormat - Expected format
 * @param {number} maxSize - Maximum size in bytes (default 5MB)
 * @returns {Object} - Validation result
 */
export function validateImageFile(file, expectedFormat, maxSize = 5 * 1024 * 1024) {
	const errors = [];

	// Check file type
	const extension = file.name.split('.').pop().toLowerCase();
	if (expectedFormat && extension !== expectedFormat.toLowerCase()) {
		errors.push(`Expected ${expectedFormat.toUpperCase()} file, got ${extension.toUpperCase()}`);
	}

	// Check file size
	if (file.size > maxSize) {
		errors.push(`File size exceeds maximum of ${formatFileSize(maxSize)}`);
	}

	// Check if it's an image
	if (!file.type.startsWith('image/')) {
		errors.push('File is not an image');
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Download converted image
 * @param {Blob} blob - Image blob
 * @param {string} fileName - File name
 */
export function downloadImage(blob, fileName) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Download multiple images as a zip
 * This requires the jszip library to be installed
 * @param {Array} images - Array of {blob, fileName} objects
 */
export async function downloadImagesAsZip(images) {
	// Dynamic import of jszip if needed
	try {
		const JSZip = (await import('jszip')).default;
		const zip = new JSZip();

		images.forEach(({ blob, fileName }) => {
			zip.file(fileName, blob);
		});

		const content = await zip.generateAsync({ type: 'blob' });
		downloadImage(content, 'converted-images.zip');
	} catch (error) {
		// If jszip not available, download individually
		images.forEach(({ blob, fileName }) => {
			downloadImage(blob, fileName);
		});
	}
}

/**
 * Get supported formats for conversion
 * @returns {Array} - Array of format objects
 */
export function getSupportedFormats() {
	return [
		{ value: 'png', label: 'PNG (Portable Network Graphics)' },
		{ value: 'jpg', label: 'JPG/JPEG (Joint Photographic Experts Group)' },
		{ value: 'webp', label: 'WEBP (Web Picture Format)' },
		{ value: 'gif', label: 'GIF (Graphics Interchange Format)' },
		{ value: 'avif', label: 'AVIF (AV1 Image File Format)' },
		{ value: 'bmp', label: 'BMP (Bitmap Image File)' }
	];
}
