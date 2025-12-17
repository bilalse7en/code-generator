import * as XLSX from 'xlsx';

// ==========================================
// EXCEL UTILS
// ==========================================

const extractActualUrl = url => url ? "string" == typeof url ? url : url.Target || url.target || url.url || url.href || url.Rel && url.Rel.Target || "" : "";

function normCell(cell) {
	if (!cell) return { text: "", url: "", isHyperlink: false };
	if ("object" == typeof cell && ("v" in cell || "w" in cell || "l" in cell || "t" in cell)) {
		let text = void 0 !== cell.w && null !== cell.w ? cell.w : cell.v;
		"object" == typeof text && (text = cell.w || JSON.stringify(text) || "");
		let url = cell.l || cell.hyperlink || null;
		url = extractActualUrl(url) || (text && (text.startsWith("http") || text.includes("://")) ? text : "");
		return { text: String(null == text ? "" : text).trim(), url: url, isHyperlink: !!cell.l };
	}
	let text = String(cell || "").trim();
	return { text: text, url: text && (text.startsWith("http") || text.includes("://")) ? text : "", isHyperlink: false };
}

function splitMulti(cell) {
	if (!cell) return [];
	if ("object" == typeof cell && cell.l) return [normCell(cell)];

	// Check if cell is an object (cell object from xlsx)
	let text = "object" == typeof cell ? (void 0 !== cell.w ? cell.w : cell.v) : cell;

	// Normalize text
	text = null == text ? "" : String(text);

	return text.trim() ? text.split(/[\n;]+/).map(item => {
		const textStr = item.trim();
		return { text: textStr, url: textStr && (textStr.startsWith("http") || textStr.includes("://")) ? textStr : "", isHyperlink: false };
	}).filter(item => item.text) : [];
}

const pdfHref = pdf => pdf && pdf.url && pdf.url.toString().trim() ? pdf.url : "#";

function linkDisplay(link) {
	if (!link) return "";
	if (link.isHyperlink) return link.text || "";
	try {
		const url = new URL(link.url || link.text);
		const hostname = url.hostname.toLowerCase();
		return hostname.includes("google.com") ? "Google" :
			hostname.includes("youtube.com") ? "YouTube" :
				hostname.includes("github.com") ? "GitHub" :
					url.hostname.replace("www.", "").split(".")[0] || link.text;
	} catch (e) {
		return link.text || "";
	}
}

// ==========================================
// RESOURCE GENERATOR LOGIC
// ==========================================

// Returns { html: string, count: number }
export async function processResourceFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = e => {
			try {
				const data = new Uint8Array(e.target.result);
				const workbook = XLSX.read(data, { type: "array" });
				const worksheet = workbook.Sheets[workbook.SheetNames[0]];
				let mergedCells = {};

				if (worksheet["!merges"]) {
					worksheet["!merges"].forEach(merge => {
						const startCell = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
						for (let row = merge.s.r; row <= merge.e.r; ++row) {
							for (let col = merge.s.c; col <= merge.e.c; ++col) {
								const cell = XLSX.utils.encode_cell({ r: row, c: col });
								mergedCells[cell] = startCell;
								if (!worksheet[cell]) {
									worksheet[cell] = { t: "s", v: worksheet[startCell] ? worksheet[startCell].v : "" };
								}
							}
						}
					});
				}

				const result = processSheet(worksheet, mergedCells);
				resolve(result);
			} catch (e) {
				console.error("Error processing resource file:", e);
				reject(e);
			}
		};
		reader.onerror = () => reject(new Error("Error reading file"));
		reader.readAsArrayBuffer(file);
	});
}

function processSheet(worksheet, mergedCells = {}) {
	const cells = {};
	for (const cell in worksheet) {
		if (!cell.startsWith("!")) cells[cell] = worksheet[cell];
	}

	// Find max row
	const keys = Object.keys(cells);
	if (keys.length === 0) return { html: "", count: 0 };

	const maxRow = Math.max(...keys.map(cell => XLSX.utils.decode_cell(cell).r));
	const rows = [];

	for (let row = 0; row <= maxRow; row++) {
		const rowData = [];
		for (let col = 0; col < 10; col++) {
			const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
			rowData[col] = cells[cellAddress] || null;
		}
		rows.push(rowData);
	}

	const headerRow = rows.find(row => row.some(cell => cell && "string" == typeof cell.v && cell.v.toLowerCase().includes("title")));
	const headerIndex = headerRow ? rows.indexOf(headerRow) : 0;

	const headers = rows[headerIndex].map(cell => cell ? String(cell.v || "").toLowerCase() : "");
	const moduleCol = headers.findIndex(header => header.includes("module"));
	const titleCol = headers.findIndex(header => header.includes("title"));
	const pdfCol = headers.findIndex(header => header.includes("pdf"));
	const linkCol = headers.findIndex(header => header.includes("link"));

	let titleIndex = -1 === titleCol ? 1 : titleCol;
	let pdfIndex = -1 === pdfCol ? 2 : pdfCol;
	let linkIndex = -1 === linkCol ? 3 : linkCol;

	const dataRows = rows.slice(headerIndex + 1);
	const resources = [];
	const resourceMap = {};
	let currentModule = "";
	let currentTitle = "";
	let glossaryLink = "";

	for (let i = 0; i < dataRows.length; i++) {
		const row = dataRows[i];
		const moduleCell = moduleCol >= 0 && row[moduleCol] ? normCell(row[moduleCol]).text : "";
		const pdfCell = pdfIndex >= 0 ? XLSX.utils.encode_cell({ r: i + headerIndex + 1, c: pdfIndex }) : "";
		const linkCell = linkIndex >= 0 ? XLSX.utils.encode_cell({ r: i + headerIndex + 1, c: linkIndex }) : "";

		const isPdfMerged = !pdfCell || !mergedCells[pdfCell] || mergedCells[pdfCell] === pdfCell;
		const isLinkMerged = !linkCell || !mergedCells[linkCell] || mergedCells[linkCell] === linkCell;

		const pdfs = isPdfMerged && pdfIndex >= 0 && row[pdfIndex] ? splitMulti(row[pdfIndex]) : [];
		const links = isLinkMerged && linkIndex >= 0 && row[linkIndex] ? splitMulti(row[linkIndex]) : [];

		let titleCell = titleIndex >= 0 && row[titleIndex] ? normCell(row[titleIndex]).text : "";

		if (!(moduleCell || titleCell || pdfs.length || links.length)) continue;

		if (!moduleCell && titleCell && /^Module\s*\d+:/.test(titleCell)) {
			const moduleMatch = titleCell.match(/^(Module\s*\d+):\s*(.*)/);
			if (moduleMatch) {
				currentModule = moduleMatch[1] + (moduleMatch[2] ? ": " + moduleMatch[2].trim() : "");
				continue;
			}
		}

		if ((moduleCell && moduleCell.toLowerCase().includes("glossary")) || (titleCell && titleCell.toLowerCase().includes("glossary"))) {
			glossaryLink = links[0]?.url || pdfs[0]?.url || "#";
			continue;
		}

		if (titleCell) {
			if (/^Module\s*\d+:/.test(titleCell)) {
				const moduleMatch = titleCell.match(/^(Module\s*\d+):/);
				if (moduleMatch) {
					currentModule = moduleMatch[1];
					titleCell = titleCell.replace(/^Module\s*\d+:\s*/, "").trim();
				}
			}
			currentTitle = titleCell;
			const resourceKey = (currentModule || "") + "||" + currentTitle;
			if (!resourceMap[resourceKey]) {
				const resource = { module: currentModule || null, title: currentTitle, pdfs: [], links: [] };
				resources.push(resource);
				resourceMap[resourceKey] = resource;
			}
		} else if (!currentTitle) continue;

		const resource = resourceMap[(currentModule || "") + "||" + currentTitle];
		if (resource) {
			pdfs.forEach(pdf => {
				if (pdf && pdf.text && !resource.pdfs.some(existing => existing.text === pdf.text && (existing.url || "") === (pdf.url || ""))) {
					resource.pdfs.push(pdf);
				}
			});
			links.forEach(link => {
				if (link && link.text && !resource.links.some(existing => existing.text === link.text && (existing.url || "") === (link.url || ""))) {
					resource.links.push(link);
				}
			});
		}
	}

	const filteredResources = resources.filter(resource => (resource.pdfs && resource.pdfs.length) || (resource.links && resource.links.length));
	const html = generateResourceHTML(glossaryLink || "#", filteredResources);

	return { html, count: filteredResources.length };
}

function generateResourceHTML(glossaryLink, resources) {
	let html = `<style>.bg-black.rounded-md.shadow-md:hover {border-left: 4px solid #000;transform: translate(2px);transition: .1s;}.bg-yellow-400.rounded-md.shadow-md:hover {border-left: 4px solid #ffc107;transform: translate(2px);transition: .1s;}</style><div class="bg-black rounded-md shadow-md"><div class="rounded-sm bg-yellow-400 my-4 p-3 w-full"><h2 class="text-2xl leading-none m-0 flex items-center space-x-2"><i class="fa fa-book"></i><a href="${glossaryLink}" target="_blank" class="text-blue-600 hover:underline">Glossary</a></h2></div></div>\n`;

	const groupedResources = {};
	const generateResourceList = resource => {
		if (!resource.links.length && !resource.pdfs.length) return "";
		let list = '  <ul class="ml-8 list-none space-y-1">\n';
		for (const link of resource.links) {
			if (!link.text) continue;
			list += `    <li><i class="fa fa-link text-blue-600 me-2"></i><a href="${link.url && link.url.trim() ? link.url : "#"}" target="_blank" class="text-blue-600 hover:underline">${linkDisplay(link)}</a></li>\n`;
		}
		for (const pdf of resource.pdfs) {
			if (!pdf.text) continue;
			list += `    <li><i class="fa fa-file-pdf text-red-600 me-2"></i><a href="${pdfHref(pdf)}" target="_blank" class="ml-1 text-red-600 hover:underline">${pdf.text}</a></li>\n`;
		}
		return list + '  </ul><hr class="bg-yellow-400 border-0 mx-3 my-2 opacity-75 pt-1 shadow">\n';
	};

	let hasModules = false;
	for (const resource of resources) {
		if (resource.module) {
			hasModules = true;
			if (!groupedResources[resource.module]) groupedResources[resource.module] = [];
			groupedResources[resource.module].push(resource);
		}
	}

	if (hasModules) {
		for (const [module, moduleResources] of Object.entries(groupedResources)) {
			html += `<div class="bg-yellow-400 rounded-md shadow-md"><div class="rounded-sm bg-gray-100 my-4 p-3 w-full"><h4 class="mb-2 text-2xl font-semibold flex items-center space-x-2"><i class="fa fa-book-open-reader text-green-600"></i><span>${module}</span></h4><hr class="bg-green-600 border border-green-600 mb-3 mt-0 opacity-75 pt-1">`;
			for (const resource of moduleResources) {
				html += `  <h5 class="flex font-semibold items-center mx-3 space-x-2 text-xl"><i class="fa fa-check-circle text-yellow-400"></i><span>${resource.title}</span></h5><hr class="bg-yellow-400 border-0 mx-3 my-2 opacity-75 pt-1 shadow">${generateResourceList(resource)}`;
			}
			html += "</div></div>\n";
		}
	} else {
		for (const resource of resources) {
			html += `<div class="bg-yellow-400 rounded-md shadow-md"><div class="rounded-sm bg-gray-100 my-4 p-3 w-full"><h5 class="flex font-semibold items-center mx-3 space-x-2 text-xl"><i class="fa fa-check-circle text-yellow-400"></i><span>${resource.title}</span></h5><hr class="bg-yellow-400 border-0 mx-3 my-2 opacity-75 pt-1 shadow">${generateResourceList(resource)}</div></div>\n`;
		}
	}

	return html;
}
