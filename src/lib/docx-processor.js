import mammoth from "mammoth";

// ==========================================
// SHARED UTILS
// ==========================================

function cleanFAQText(text) {
	if (!text) return "";
	let cleaned = text;
	cleaned = cleaned.replace(/^\d+\.\s*/, '');
	cleaned = cleaned.replace(/^Q:\s*/i, '');
	cleaned = cleaned.replace(/\s+/g, ' ').trim();
	return cleaned;
}

function splitLessonSegments(text) {
	if (!text) return [];
	const lessonRegex = /(lesson\s*\d+:[\s\S]*?)(?=(lesson\s*\d+:)|$)/gi;
	const segments = [];
	let match;
	while ((match = lessonRegex.exec(text)) !== null) {
		segments.push(match[1].trim());
	}
	return segments.length > 0 ? segments : [];
}

function getLessonNumber(title) {
	if (!title) return null;
	const match = title.match(/lesson\s*(\d+)/i);
	return match ? parseInt(match[1], 10) : null;
}

function getModuleNumber(title) {
	if (!title) return null;
	const match = title.match(/module\s*(\d+)/i);
	return match ? parseInt(match[1], 10) : null;
}

function sortNumberedEntries(entries, numberExtractor) {
	if (!Array.isArray(entries) || entries.length === 0) return entries || [];
	return entries
		.map((entry, index) => ({
			...entry,
			_originalIndex: index,
			_number: numberExtractor(entry)
		}))
		.sort((a, b) => {
			const hasNumA = typeof a._number === 'number';
			const hasNumB = typeof b._number === 'number';
			if (hasNumA && hasNumB) return a._number - b._number;
			if (hasNumA) return -1;
			if (hasNumB) return 1;
			return a._originalIndex - b._originalIndex;
		})
		.map(({ _originalIndex, _number, ...rest }) => rest);
}

// ==========================================
// COURSE GENERATOR LOGIC
// ==========================================

const courseData = {
	overview: "", courseObjectives: "", syllabus: "", courseTitle: "", faqData: [],
	overviewSections: [], courseObjectivesList: [], syllabusModules: [], courseObjectivesIntro: "",
	fileProcessed: false
};

// Reset function to clear state between runs
export function resetCourseData() {
	courseData.overview = "";
	courseData.courseObjectives = "";
	courseData.syllabus = "";
	courseData.courseTitle = "";
	courseData.faqData = [];
	courseData.overviewSections = [];
	courseData.courseObjectivesList = [];
	courseData.syllabusModules = [];
	courseData.courseObjectivesIntro = "";
	courseData.fileProcessed = false;
}

export async function processCourseFile(file, courseName) {
	return new Promise((resolve, reject) => {
		resetCourseData();
		courseData.courseTitle = courseName || "Course Name";

		const reader = new FileReader();
		reader.onload = async (event) => {
			try {
				const result = await mammoth.convertToHtml({ arrayBuffer: event.target.result });
				extractCourseContent(result.value);
				resolve({ ...courseData });
			} catch (error) {
				console.error("Conversion error:", error);
				reject(error);
			}
		};
		reader.onerror = () => reject(new Error("Error reading file"));
		reader.readAsArrayBuffer(file);
	});
}

function extractCourseContent(html) {
	const tempDiv = document.createElement("div");
	tempDiv.innerHTML = html;

	const elementsArray = Array.from(tempDiv.children);

	extractOverview(elementsArray);
	extractCourseObjectives(elementsArray);
	extractSyllabus(elementsArray);
	extractFAQContent(elementsArray);

	courseData.fileProcessed = true;
}

// ... (Functions extractOverview, extractCourseObjectives, extractSyllabus, extractAllSyllabusContent, extractLessonsDirectly, extractFAQContent are identical to previous version but omitted here for brevity if allowed, but I must provide full file. I will re-paste them to be safe.)

function extractOverview(elementsArray) {
	let overviewStart = -1;
	elementsArray.forEach((element, i) => {
		const text = element.textContent.trim().toLowerCase();
		if (text.includes("overview") && overviewStart === -1) overviewStart = i;
	});

	if (overviewStart !== -1) {
		const objectivesStart = elementsArray.findIndex((el, i) =>
			i > overviewStart &&
			(el.textContent.trim().toLowerCase().includes("course objectives") ||
				el.textContent.trim().toLowerCase().includes("1.2"))
		);

		const syllabusStart = objectivesStart === -1 ? elementsArray.findIndex((el, i) =>
			i > overviewStart &&
			(el.textContent.trim().toLowerCase().includes("syllabus") ||
				el.textContent.trim().toLowerCase().includes("course syllabus"))
		) : -1;

		const overviewEnd = objectivesStart !== -1 ? objectivesStart :
			(syllabusStart !== -1 ? syllabusStart : elementsArray.length);
		const overviewElements = elementsArray.slice(overviewStart + 1, overviewEnd);
		courseData.overview = overviewElements.map(el => el.outerHTML).join("");
		courseData.overviewSections = [{ heading: "Overview", content: courseData.overview }];
	}
}

function extractCourseObjectives(elementsArray) {
	let objectivesStart = -1;
	let objectivesEnd = -1;

	for (let i = 0; i < elementsArray.length; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim().toLowerCase();

		if (text.includes("course objectives") ||
			text.includes("learning objectives") ||
			(text.includes("objectives") && element.tagName.match(/^H[1-6]$/i)) ||
			text.match(/^\d+\.\d*\s*.*objectives/i)) {
			objectivesStart = i;
			break;
		}
	}

	if (objectivesStart === -1) return;

	for (let i = objectivesStart + 1; i < elementsArray.length; i++) {
		const el = elementsArray[i];
		const text = el.textContent.trim().toLowerCase();
		const tagName = el.tagName;

		if (text.includes("syllabus") ||
			text.includes("course content") ||
			text.includes("faq") ||
			text.includes("frequently asked") ||
			text.match(/^1\.3/) ||
			(tagName.match(/^H[1-3]$/i) && !text.includes("objectives"))) {
			objectivesEnd = i;
			break;
		}
	}

	objectivesEnd = objectivesEnd !== -1 ? objectivesEnd : elementsArray.length;
	const objectivesElements = elementsArray.slice(objectivesStart, objectivesEnd);

	for (const element of objectivesElements) {
		const text = element.textContent.trim();
		const lowerText = text.toLowerCase();
		const tagName = element.tagName;

		if (!text) continue;
		if (lowerText.includes("objectives") && element.tagName.match(/^H[1-6]$/i)) continue;

		if (tagName === 'P' && !courseData.courseObjectivesIntro && text.length > 20) {
			courseData.courseObjectivesIntro = element.innerHTML.trim();
			continue;
		}

		if (tagName === 'UL' || tagName === 'OL') {
			const items = element.querySelectorAll('li');
			items.forEach(item => {
				const itemText = item.innerHTML.trim();
				if (itemText) courseData.courseObjectivesList.push(itemText);
			});
		}

		if (tagName === 'LI') {
			const itemText = element.innerHTML.trim();
			if (itemText) courseData.courseObjectivesList.push(itemText);
		}
	}
}

function extractSyllabus(elementsArray) {
	courseData.syllabusModules = extractAllSyllabusContent(elementsArray);
}

function extractAllSyllabusContent(elementsArray) {
	const modules = [];
	let currentModule = null;
	let currentLesson = null;
	let foundSyllabusContent = false;

	let objectivesEndIndex = -1;
	for (let i = 0; i < elementsArray.length; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim().toLowerCase();
		if ((text.includes("course objectives") || text.includes("1.2")) &&
			(element.tagName.match(/^H[1-6]$/i) || text.match(/^\d+\.\d*\s*.*course\s*objectives/i))) {
			for (let j = i + 1; j < elementsArray.length; j++) {
				const nextText = elementsArray[j].textContent.trim().toLowerCase();
				if (nextText.includes("syllabus") || nextText.includes("1.3") ||
					nextText.includes("course content")) {
					objectivesEndIndex = j;
					break;
				}
			}
			break;
		}
	}

	let syllabusStartIndex = -1;
	for (let i = (objectivesEndIndex !== -1 ? objectivesEndIndex : 0); i < elementsArray.length; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim().toLowerCase();

		if ((text.includes("course content") ||
			text.includes("syllabus") ||
			text.includes("lessons") ||
			text.includes("modules")) &&
			!text.includes("course objectives")) {
			syllabusStartIndex = i;
			foundSyllabusContent = true;
			break;
		}
	}

	if (syllabusStartIndex === -1) {
		syllabusStartIndex = objectivesEndIndex !== -1 ? objectivesEndIndex : 0;
	}

	for (let i = syllabusStartIndex; i < elementsArray.length; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim();
		const tagName = element.tagName;

		if (!text) continue;
		const lowerText = text.toLowerCase();

		if (lowerText.includes("course objectives") || lowerText.match(/^\d+\.\d*\s*.*course\s*objectives/i)) continue;
		if (lowerText.includes("course content") || lowerText.includes("syllabus") ||
			lowerText.includes("lessons") || lowerText.includes("modules")) continue;

		if (lowerText.includes("final examination") ||
			lowerText.includes("faq") ||
			lowerText.includes("frequently asked questions") ||
			(tagName.match(/^H[1-3]$/i) && i > syllabusStartIndex + 2)) {
			break;
		}

		if (text.match(/^Module\s*\d+:/i) || text.match(/^MODULE\s*\d+/i)) {
			if (currentModule) {
				if (currentLesson) {
					currentModule.lessons.push(currentLesson);
					currentLesson = null;
				}
				modules.push(currentModule);
			}

			currentModule = {
				title: text,
				description: "",
				lessons: []
			};

			for (let j = i + 1; j < Math.min(i + 3, elementsArray.length); j++) {
				const nextElement = elementsArray[j];
				const nextText = nextElement.textContent.trim();
				const nextTag = nextElement.tagName;

				if (nextTag === 'P' && nextText &&
					!nextText.match(/^Module\s*\d+:/i) &&
					!nextText.match(/^Lesson\s*\d+:/i) &&
					!nextText.match(/^MODULE\s*\d+/i) &&
					!nextText.match(/^LESSON\s*\d+/i) &&
					!nextText.toLowerCase().includes("final examination")) {
					currentModule.description = nextText;
					break;
				}
				if (nextText.toLowerCase().includes("final examination")) break;
			}
		}
		else if (text.match(/lesson\s*\d+:/i)) {
			if (!currentModule) {
				currentModule = {
					title: `${courseData.courseTitle || 'Course'} Content`,
					description: "",
					lessons: []
				};
			}
			if (currentLesson) currentModule.lessons.push(currentLesson);

			const lessonSegments = splitLessonSegments(text);
			currentLesson = {
				title: lessonSegments[0] || text,
				items: []
			};

			const nestedList = element.querySelector('ul');
			if (nestedList) {
				const listItems = nestedList.querySelectorAll('li');
				listItems.forEach(item => {
					const itemText = item.innerHTML.trim();
					if (itemText && !itemText.match(/^Lesson\s*\d+:/i)) {
						currentLesson.items.push(itemText);
					}
				});
			}

			if (lessonSegments.length > 1 && currentModule) {
				lessonSegments.slice(1).forEach(segment => {
					if (segment.trim()) {
						currentModule.lessons.push({
							title: segment.trim(),
							items: []
						});
					}
				});
			}
		}
		else if (tagName === 'UL' && currentLesson) {
			const listItems = element.querySelectorAll('li');
			listItems.forEach(item => {
				const itemText = item.innerHTML.trim();
				if (itemText && !itemText.match(/^Lesson\s*\d+:/i)) {
					currentLesson.items.push(itemText);
				}
			});
		}
		else if (tagName === 'LI' && !text.match(/^Lesson\s*\d+:/i)) {
			if (currentLesson) {
				currentLesson.items.push(element.innerHTML.trim());
			} else if (currentModule && text.length > 10) {
				currentLesson = {
					title: `Lesson ${currentModule.lessons.length + 1}: ${text.substring(0, 50)}...`,
					items: [element.innerHTML.trim()]
				};
			}
		}
		else if (tagName === 'P' && text && currentModule && !currentModule.description) {
			if (text.length > 20 && !text.match(/^Module\s*\d+:/i) && !text.match(/^Lesson\s*\d+:/i)) {
				currentModule.description = text;
			}
		}
	}

	if (currentLesson) {
		if (currentModule) {
			currentModule.lessons.push(currentLesson);
		} else {
			currentModule = {
				title: `${courseData.courseTitle || 'Course'} Content`,
				description: "",
				lessons: [currentLesson]
			};
		}
	}

	if (currentModule) modules.push(currentModule);

	if (modules.length === 0 && foundSyllabusContent) {
		modules.push(...extractLessonsDirectly(elementsArray, syllabusStartIndex));
	}

	modules.forEach(module => {
		if (module.lessons && module.lessons.length > 0) {
			module.lessons = sortNumberedEntries(module.lessons, lesson => getLessonNumber(lesson.title));
		}
	});

	return sortNumberedEntries(modules, module => getModuleNumber(module.title));
}

function extractLessonsDirectly(elementsArray, startIndex) {
	const modules = [];
	const defaultModule = {
		title: `${courseData.courseTitle || 'Course'} Content`,
		description: "",
		lessons: []
	};

	let currentLesson = null;
	let inSyllabusSection = false;

	for (let i = startIndex; i < elementsArray.length; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim();
		const tagName = element.tagName;
		const lowerText = text.toLowerCase();

		if (!text) continue;

		if (lowerText.includes("course objectives") || lowerText.match(/^\d+\.\d*\s*.*course\s*objectives/i)) continue;

		if (!inSyllabusSection && (lowerText.includes("course content") || lowerText.includes("syllabus") || lowerText.includes("lessons"))) {
			inSyllabusSection = true;
			continue;
		}

		if (inSyllabusSection &&
			(lowerText.includes("final examination") ||
				lowerText.includes("faq") ||
				(tagName.match(/^H[1-3]$/i) && i > startIndex + 3 && !lowerText.includes("lesson")))) {
			break;
		}

		if (!inSyllabusSection) continue;

		if (text.match(/^Lesson\s*\d+:/i) || text.match(/^LESSON\s*\d+/i) ||
			(tagName === 'P' && text.match(/\d+\./)) ||
			(tagName.match(/^H[3-4]$/i) && text.length < 100)) {

			if (currentLesson) defaultModule.lessons.push(currentLesson);

			currentLesson = { title: text, items: [] };

			const nestedList = element.querySelector('ul');
			if (nestedList) {
				const listItems = nestedList.querySelectorAll('li');
				listItems.forEach(item => currentLesson.items.push(item.innerHTML.trim()));
			}
		}
		else if (tagName === 'UL' && currentLesson) {
			const listItems = element.querySelectorAll('li');
			listItems.forEach(item => {
				const itemText = item.innerHTML.trim();
				if (itemText && !itemText.match(/^Lesson\s*\d+:/i)) currentLesson.items.push(itemText);
			});
		}
		else if (tagName === 'LI' && currentLesson && !text.match(/^Lesson\s*\d+:/i)) {
			currentLesson.items.push(element.innerHTML.trim());
		}
	}

	if (currentLesson) defaultModule.lessons.push(currentLesson);

	if (defaultModule.lessons.length > 0) {
		defaultModule.lessons = sortNumberedEntries(defaultModule.lessons, lesson => getLessonNumber(lesson.title));
		modules.push(defaultModule);
	}

	return modules;
}

function extractFAQContent(elementsArray) {
	courseData.faqData = [];
	let faqStart = -1;
	elementsArray.forEach((element, i) => {
		const text = element.textContent.trim().toLowerCase();
		if ((text.includes("faq") || text.includes("frequently asked questions")) &&
			element.tagName.match(/^H[1-6]$/i) && faqStart === -1) {
			faqStart = i;
		}
	});

	if (faqStart === -1) return;

	let faqEnd = elementsArray.length;
	for (let i = faqStart + 1; i < elementsArray.length; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim();
		if (text.includes("For Online Course Page:") ||
			(element.tagName.match(/^H[1-6]$/i) && !text.toLowerCase().includes("faq") && i > faqStart + 3)) {
			faqEnd = i;
			break;
		}
	}

	let currentQuestion = "";
	let currentAnswer = "";
	let collectingAnswer = false;

	for (let i = faqStart + 1; i < faqEnd; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim();
		const innerHTML = element.innerHTML.trim();

		if (!text) continue;

		const isQuestion = (
			/^\d+\.\s+/.test(text) ||
			(innerHTML.includes('<strong>') && text.includes('?')) ||
			(innerHTML.includes('<b>') && text.includes('?')) ||
			(text.endsWith('?') && text.length < 200)
		);

		if (isQuestion) {
			if (currentQuestion && currentAnswer) {
				courseData.faqData.push({
					question: cleanFAQText(currentQuestion),
					answer: cleanFAQText(currentAnswer)
				});
			}
			currentQuestion = text;
			const questionMatch = text.match(/^\d+\.\s+(.*?)(?:\?)(.*)$/);
			if (questionMatch && questionMatch[2] && questionMatch[2].trim()) {
				currentAnswer = questionMatch[2].trim();
				collectingAnswer = true;
			} else {
				currentAnswer = "";
				collectingAnswer = true;
			}
		} else if (collectingAnswer && text) {
			if (currentAnswer) {
				currentAnswer += " " + element.outerHTML;
			} else {
				currentAnswer = element.outerHTML;
			}

			const nextIsQuestion = i + 1 < faqEnd && (
				/^\d+\.\s+/.test(elementsArray[i + 1].textContent.trim()) ||
				(elementsArray[i + 1].innerHTML.includes('<strong>') &&
					elementsArray[i + 1].textContent.trim().includes('?'))
			);

			if (nextIsQuestion) {
				if (currentQuestion && currentAnswer) {
					courseData.faqData.push({
						question: cleanFAQText(currentQuestion),
						answer: cleanFAQText(currentAnswer)
					});
				}
				currentQuestion = "";
				currentAnswer = "";
				collectingAnswer = false;
			}
		}
	}

	if (currentQuestion && currentAnswer) {
		courseData.faqData.push({
			question: cleanFAQText(currentQuestion),
			answer: cleanFAQText(currentAnswer)
		});
	}
}

export function generateOverviewCode(data) {
	const videoHtml = `<!-- <div class="col-md-5 col-sm-12 elementor-col-40 elementor-column ml-md-3 p-0 pb-0 pt-0 verified-field-container" style="float:right"><div class="demo-video"><iframe title="${data.courseTitle || 'Course Video'}" src="https://player.vimeo.com/video/680313019?h=6c9335ab94" width="560" height="200" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen data-ready="true"></iframe><img src="" class="w-100 ps-3" alt="${data.courseTitle || 'Course Name'}"></div></div> -->`;

	let contentHtml = "";
	if (data.overviewSections.length > 0) {
		data.overviewSections.forEach(section => {
			const tempDiv = document.createElement("div");
			tempDiv.innerHTML = section.content;
			tempDiv.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(heading => {
				const newHeading = document.createElement("h2");
				newHeading.className = "fs-4 text-warning";
				newHeading.innerHTML = heading.innerHTML;
				heading.parentNode.replaceChild(newHeading, heading);
			});
			tempDiv.querySelectorAll("ul, ol").forEach(list => { list.className = ""; });
			tempDiv.querySelectorAll("a").forEach(link => { link.setAttribute("target", "_blank"); });
			contentHtml += tempDiv.innerHTML;
		});
	} else {
		contentHtml = "<p>No overview content found.</p>";
	}
	return videoHtml + contentHtml;
}

export function generateCourseObjectivesCode(data) {
	let listItemsHtml = "";
	if (data.courseObjectivesList.length > 0) {
		listItemsHtml = data.courseObjectivesList.map(item => `<li>${item}</li>`).join('\n');
	} else {
		listItemsHtml = "<li>No course objectives found in the document.</li>";
	}
	const introText = data.courseObjectivesIntro || "After completing this course, the learner will be able to:";
	return `<h2 class="h3">Course Objectives</h2><p class="m-0"><strong>${introText}</strong></p><ul>${listItemsHtml}</ul>`;
}

export function generateSyllabusCode(data) {
	let syllabusHtml = "";

	if (data.syllabusModules.length === 0) {
		return "<p>No syllabus content found.</p>";
	}

	data.syllabusModules.forEach((module, index) => {
		const collapseId = `collapse${index + 1}`;
		const headingId = `heading${index + 1}`;

		// Module Header
		syllabusHtml += `<div class="card mb-2">\n`;
		syllabusHtml += `  <div class="card-header" id="${headingId}">\n`;
		syllabusHtml += `    <h5 class="mb-0">\n`;
		syllabusHtml += `      <button class="btn btn-link w-100 text-start text-decoration-none text-dark fw-bold collapsed" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">\n`;
		syllabusHtml += `        ${module.title}\n`;
		syllabusHtml += `      </button>\n`;
		syllabusHtml += `    </h5>\n`;
		syllabusHtml += `  </div>\n\n`;

		// Module Content (Collapse)
		syllabusHtml += `  <div id="${collapseId}" class="collapse" aria-labelledby="${headingId}" data-parent="#accordionSyllabus">\n`;
		syllabusHtml += `    <div class="card-body">\n`;

		if (module.description) {
			syllabusHtml += `      <p>${module.description}</p>\n`;
		}

		if (module.lessons.length > 0) {
			syllabusHtml += `      <ul>\n`;
			module.lessons.forEach(lesson => {
				syllabusHtml += `        <li>${lesson.title}\n`;
				if (lesson.items.length > 0) {
					syllabusHtml += `          <ul>\n`;
					lesson.items.forEach(item => {
						syllabusHtml += `            <li>${item}</li>\n`;
					});
					syllabusHtml += `          </ul>\n`;
				}
				syllabusHtml += `        </li>\n`;
			});
			syllabusHtml += `      </ul>\n`;
		}

		syllabusHtml += `    </div>\n`;
		syllabusHtml += `  </div>\n`;
		syllabusHtml += `</div>\n`;
	});

	return `<div id="accordionSyllabus" class="accordion">\n${syllabusHtml}</div>`;
}

export function generateFAQCode(courseData) {
	if (courseData.faqData.length === 0) {
		return "<!-- No FAQs found in the FAQ section -->";
	}

	const midPoint = Math.ceil(courseData.faqData.length / 2);
	const col1 = courseData.faqData.slice(0, midPoint);
	const col2 = courseData.faqData.slice(midPoint);

	let faqHtml = `<h2 class="h3 mb-4">Frequently Asked Questions</h2>\n<div class="row">\n`;

	faqHtml += `  <div class="col-md-6">\n`;
	col1.forEach((faq, index) => {
		faqHtml += `    <div class="mb-3">\n`;
		faqHtml += `      <h5 class="h6 fw-bold">${faq.question}</h5>\n`;
		faqHtml += `      <p>${faq.answer}</p>\n`;
		faqHtml += `    </div>\n`;
	});
	faqHtml += `  </div>\n`;

	faqHtml += `  <div class="col-md-6">\n`;
	col2.forEach((faq, index) => {
		faqHtml += `    <div class="mb-3">\n`;
		faqHtml += `      <h5 class="h6 fw-bold">${faq.question}</h5>\n`;
		faqHtml += `      <p>${faq.answer}</p>\n`;
		faqHtml += `    </div>\n`;
	});
	faqHtml += `  </div>\n`;

	faqHtml += `</div>`;
	return faqHtml;
}

// ==========================================
// BLOG GENERATOR LOGIC
// ==========================================

export async function processBlogFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = async (event) => {
			try {
				const result = await mammoth.convertToHtml({ arrayBuffer: event.target.result });
				const processed = extractBlogContent(result.value);
				const faqData = extractBlogFAQContent(result.value);
				resolve({ blogData: processed, faqData: faqData });
			} catch (error) {
				console.error("Conversion error:", error);
				reject(error);
			}
		};
		reader.onerror = () => reject(new Error("Error reading file"));
		reader.readAsArrayBuffer(file);
	});
}

function cleanHTML(element) {
	element.querySelectorAll('*[style]').forEach(el => el.removeAttribute('style'));
	element.querySelectorAll('*[class]').forEach(el => el.removeAttribute('class'));

	Array.from(element.querySelectorAll('span')).forEach(span => {
		const parent = span.parentNode;
		while (span.firstChild) parent.insertBefore(span.firstChild, span);
		parent.removeChild(span);
	});

	Array.from(element.querySelectorAll('div')).forEach(div => {
		const parent = div.parentNode;
		if (!parent) return;
		while (div.firstChild) parent.insertBefore(div.firstChild, div);
		if (div.parentNode) parent.removeChild(div);
	});

	element.innerHTML = element.innerHTML.replace(/(<br\s*\/?>\s*){2,}/gi, '<br/>');

	Array.from(element.querySelectorAll('*')).forEach(el => {
		if (el.tagName === 'IMG') return;
		if (!el.textContent.trim() && el.children.length === 0) el.remove();
	});
}

function improveListStructure(element) {
	Array.from(element.querySelectorAll('ul,ol')).forEach(list => {
		Array.from(list.querySelectorAll('li')).forEach(li => {
			li.innerHTML = li.innerHTML.replace(/&gt;/g, '');
			if (!li.textContent.trim() && li.children.length === 0) li.remove();
		});
		if (!list.children.length) list.remove();
	});
}

function extractBlogContent(html) {
	// Logic aligned with js/blog-generator.js
	const tempDiv = document.createElement("div");
	tempDiv.innerHTML = html;

	// Enhanced Clean HTML steps
	const metaMarkers = ['Meta Description', 'Meta Title', 'meta description', 'meta title', 'Slug', 'Category', 'category', 'slug', 'relevant courses'];
	const lineRemoveMarkers = ['link:', 'alt-text', 'alt text:', 'title text:'];

	const allElements = Array.from(tempDiv.querySelectorAll('*'));
	let removeFromIndex = -1;

	for (let i = 0; i < allElements.length; i++) {
		const el = allElements[i];
		const text = (el.textContent || "").trim();
		if (!text) continue;
		const lowerText = text.toLowerCase();

		if (metaMarkers.some(m => lowerText.startsWith(m))) {
			removeFromIndex = i;
			break;
		}

		if (lineRemoveMarkers.some(m => lowerText.startsWith(m))) {
			el.remove();
		}
	}

	if (removeFromIndex !== -1) {
		for (let j = removeFromIndex; j < allElements.length; j++) {
			const nodeToRemove = allElements[j];
			if (nodeToRemove && nodeToRemove.parentNode) {
				try {
					nodeToRemove.parentNode.removeChild(nodeToRemove);
				} catch (e) { }
			}
		}
	}

	cleanHTML(tempDiv);
	improveListStructure(tempDiv);

	// Now Extract Content
	const blogData = { title: "", content: [], imageCount: 0 };

	// Extract Title - Priority H1
	const h1 = tempDiv.querySelector('h1');
	const isFaq = (text) => text.toLowerCase().includes('faq') || text.toLowerCase().includes('frequently asked questions');

	if (h1 && h1.textContent.trim() && !isFaq(h1.textContent)) {
		blogData.title = h1.textContent.trim();
		h1.remove();
	} else {
		// Fallback for Title
		let foundTitle = false;
		for (const p of Array.from(tempDiv.querySelectorAll('p'))) {
			const text = (p.textContent || "").trim();
			if (text && text.length > 10 && text.length < 200 && !isFaq(text)) {
				blogData.title = text;
				p.remove();
				foundTitle = true;
				break;
			}
		}
		if (!foundTitle) {
			for (const el of Array.from(tempDiv.querySelectorAll('*'))) {
				const text = (el.textContent || "").trim();
				// H1-H6 are often short, so we lowered the limit to 5
				if (text && text.length > 5 && !isFaq(text)) {
					const potentialTitle = text.split('.')[0];
					if (potentialTitle.length > 5) {
						blogData.title = potentialTitle;
						// Don't remove generic elements blindly, just grabbing text
						break;
					}
				}
			}
		}
	}

	const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_ELEMENT, null, false);
	let node;
	while (node = walker.nextNode()) {
		if (!node || !node.textContent) continue;
		const text = (node.textContent || "").trim();
		if (!text) continue;
		const lowerText = text.toLowerCase();

		if (metaMarkers.some(m => lowerText.startsWith(m))) break;

		const tag = node.tagName.toLowerCase();

		// Stop extraction if we hit the FAQ section (to be handled separately)
		if (tag.match(/^h[1-6]$/) && (lowerText.includes('faq') || lowerText.includes('frequently asked questions'))) {
			break;
		}

		if (tag.match(/^h[1-6]$/)) {
			const level = parseInt(tag.charAt(1));
			blogData.content.push({
				type: 'heading',
				level: level,
				className: `fs-${level}`,
				content: node.innerHTML.trim()
			});
		} else if (tag === 'p') {
			const html = node.innerHTML.trim();
			if (html && html.replace(/<[^>]*>/g, '').trim().length > 0) {
				blogData.content.push({
					type: 'paragraph',
					content: html
				});
			}
		} else if (tag === 'ul' || tag === 'ol') {
			const items = Array.from(node.querySelectorAll('li'))
				.map(li => li.innerHTML.trim())
				.filter(i => i.length > 0);
			if (items.length) {
				blogData.content.push({
					type: 'list',
					ordered: tag === 'ol',
					items: items
				});
			}
		} else if (tag === 'img') {
			blogData.imageCount++;
			blogData.content.push({
				type: 'image',
				alt: node.getAttribute('alt') || `Blog image ${blogData.imageCount}`,
				placeholder: `[Image ${blogData.imageCount}]`
			});
		}
	}

	return blogData;
}

export function generateBlogCode(blogData, featuredImage = {}, imageUrls = []) {
	let imageIndex = 0, blogHTML = "";

	function escapeAttr(str) {
		if (str === null || str === undefined) return '';
		return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function escapeHtml(str) {
		if (str === null || str === undefined) return '';
		return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
	}

	if (blogData.title) {
		blogHTML += `<h1 class="text-center fs-1">${escapeHtml(blogData.title)}</h1><hr>\n\n`;
	}

	if (featuredImage.url) {
		let imgTag = `<img src="${escapeAttr(featuredImage.url)}"`;
		if (featuredImage.alt) imgTag += ` alt="${escapeAttr(featuredImage.alt)}"`;
		if (featuredImage.title) imgTag += ` title="${escapeAttr(featuredImage.title)}"`;
		imgTag += ` class="w-100 mb-3">\n\n`;
		blogHTML += imgTag;
	}

	for (const item of blogData.content) {
		switch (item.type) {
			case 'heading': {
				const level = item.level || 2;
				const className = item.className ? ` ${item.className}` : '';
				blogHTML += level === 1
					? `<h1 class="text-center${className}">${item.content}</h1>\n\n`
					: `<h${level} class="${item.className}">${item.content}</h${level}>\n\n`;
				break;
			}
			case 'paragraph': {
				const content = (item.content || "").trim();
				if (content && content.replace(/<[^>]*>/g, '').trim().length > 0) {
					blogHTML += `<p>${content}</p>\n\n`;
				}
				break;
			}
			case 'list': {
				const tag = item.ordered ? 'ol' : 'ul';
				blogHTML += `<${tag}>\n`;
				item.items.forEach(li => {
					if (li && li.trim().length > 0) {
						blogHTML += `  <li>${li}</li>\n`;
					}
				});
				blogHTML += `</${tag}>\n\n`;
				break;
			}
			case 'image': {
				const imageUrl = imageUrls[imageIndex] || "#";
				blogHTML += `<img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(item.alt)}" class="w-100 mb-3">\n\n`;
				imageIndex++;
				break;
			}
		}
	}

	blogHTML += `<div class="fancy-line"></div><style>.fancy-line{width:60%;margin:20px auto;border-top:2px solid #116466;text-align:center;position:relative}.fancy-line::after{content:"✦ ✦ ✦";position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:white;padding:0 10px;color:red}</style>`;
	return blogHTML;
}

function extractBlogFAQContent(html) {
	const tempDiv = document.createElement("div");
	tempDiv.innerHTML = html;
	cleanHTML(tempDiv);

	const elementsArray = Array.from(tempDiv.children);
	const faqData = [];

	let faqStart = -1;
	elementsArray.forEach((element, i) => {
		const text = element.textContent.trim().toLowerCase();
		if ((text.includes("faq") || text.includes("frequently asked questions")) &&
			element.tagName.match(/^H[1-6]$/i) && faqStart === -1) {
			faqStart = i;
		}
	});

	if (faqStart === -1) return [];

	let faqEnd = elementsArray.length;
	for (let i = faqStart + 1; i < elementsArray.length; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim();
		if (text.includes("For Online Course Page:") ||
			(element.tagName.match(/^H[1-6]$/i) && !text.toLowerCase().includes("faq") && i > faqStart + 3)) {
			faqEnd = i;
			break;
		}
	}

	let currentQuestion = "";
	let currentAnswer = "";
	let collectingAnswer = false;

	for (let i = faqStart + 1; i < faqEnd; i++) {
		const element = elementsArray[i];
		const text = element.textContent.trim();
		const innerHTML = element.innerHTML.trim();

		if (!text) continue;

		const isQuestion = (
			/^\d+\.\s+/.test(text) ||
			(innerHTML.includes('<strong>') && text.includes('?')) ||
			(innerHTML.includes('<b>') && text.includes('?')) ||
			(text.endsWith('?') && text.length < 200)
		);

		if (isQuestion) {
			if (currentQuestion && currentAnswer) {
				faqData.push({
					question: cleanFAQText(currentQuestion),
					answer: currentAnswer
				});
			}
			currentQuestion = text;
			const questionMatch = text.match(/^\d+\.\s+(.*?)(?:\?)(.*)$/);
			if (questionMatch && questionMatch[2] && questionMatch[2].trim()) {
				currentAnswer = questionMatch[2].trim();
				collectingAnswer = true;
			} else {
				currentAnswer = "";
				collectingAnswer = true;
			}
		} else if (collectingAnswer && text) {
			if (currentAnswer) {
				currentAnswer += " " + element.outerHTML;
			} else {
				currentAnswer = element.outerHTML;
			}
			const nextIsQuestion = i + 1 < faqEnd && (
				/^\d+\.\s+/.test(elementsArray[i + 1].textContent.trim()) ||
				(elementsArray[i + 1].innerHTML.includes('<strong>') &&
					elementsArray[i + 1].textContent.trim().includes('?'))
			);

			if (nextIsQuestion) {
				if (currentQuestion && currentAnswer) {
					faqData.push({
						question: cleanFAQText(currentQuestion),
						answer: currentAnswer
					});
				}
				currentQuestion = "";
				currentAnswer = "";
				collectingAnswer = false;
			}
		}
	}

	if (currentQuestion && currentAnswer) {
		faqData.push({
			question: cleanFAQText(currentQuestion),
			answer: currentAnswer
		});
	}

	return faqData;
}

export function generateBlogFAQCode(faqData) {
	if (!faqData || faqData.length === 0) return "<!-- No FAQs found in the FAQ section -->";

	function escapeHtml(str) {
		if (str === null || str === undefined) return '';
		return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
	}

	const midPoint = Math.ceil(faqData.length / 2);
	const col1 = faqData.slice(0, midPoint);
	const col2 = faqData.slice(midPoint);

	let faqHtml = `<div class="faq-section">\n<h2 class="h3 mb-4">Frequently Asked Questions</h2>\n<div class="row">\n`;

	// Column 1
	faqHtml += `  <div class="col-md-6">\n`;
	col1.forEach((faq, index) => {
		const question = cleanFAQText(faq.question);
		let answer = faq.answer.replace(/^A:\s*/i, '').trim();
		if (question && answer) {
			faqHtml += `    <div class="mb-3">\n`;
			faqHtml += `      <h5 class="h6 fw-bold">${escapeHtml(question)}</h5>\n`;
			faqHtml += `      <div class="faq-answer">${answer}</div>\n`;
			faqHtml += `    </div>\n`;
		}
	});
	faqHtml += `  </div>\n`;

	// Column 2
	faqHtml += `  <div class="col-md-6">\n`;
	col2.forEach((faq, index) => {
		const question = cleanFAQText(faq.question);
		let answer = faq.answer.replace(/^A:\s*/i, '').trim();
		if (question && answer) {
			faqHtml += `    <div class="mb-3">\n`;
			faqHtml += `      <h5 class="h6 fw-bold">${escapeHtml(question)}</h5>\n`;
			faqHtml += `      <div class="faq-answer">${answer}</div>\n`;
			faqHtml += `    </div>\n`;
		}
	});
	faqHtml += `  </div>\n`;

	faqHtml += `</div>\n</div>`;
	return faqHtml;
}

// ==========================================
// GLOSSARY GENERATOR LOGIC
// ==========================================

export async function processGlossaryFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = async (event) => {
			try {
				const result = await mammoth.convertToHtml({ arrayBuffer: event.target.result });
				const processed = extractGlossaryData(result.value);
				resolve(processed);
			} catch (error) {
				console.error("Conversion error:", error);
				reject(error);
			}
		};
		reader.onerror = () => reject(new Error("Error reading file"));
		reader.readAsArrayBuffer(file);
	});
}

function extractGlossaryData(html) {
	const tempDiv = document.createElement("div");
	tempDiv.innerHTML = html;
	const glossaryData = [];
	const tables = tempDiv.getElementsByTagName("table");

	if (tables.length > 0) {
		const rows = tables[0].getElementsByTagName("tr");
		for (let i = 1; i < rows.length; i++) {
			const cells = rows[i].getElementsByTagName("td");
			if (cells.length === 2) {
				const term = cells[0].innerText.trim();
				const definition = cells[1].innerHTML.trim();
				if (term && definition) {
					glossaryData.push({ term: term, definition: definition });
				}
			}
		}
	}
	return glossaryData;
}

export function generateGlossaryCode(glossaryData) {
	const groupedData = {};
	glossaryData.forEach(item => {
		const term = item.term.trim();
		const definition = item.definition.trim();
		const firstLetter = term.charAt(0).toUpperCase();
		if (!groupedData[firstLetter]) groupedData[firstLetter] = [];
		groupedData[firstLetter].push({ term: term, definition: definition });
	});

	let alphabetButtons = "";
	let glossaryContent = "";

	for (let i = 65; i <= 90; i++) {
		const letter = String.fromCharCode(i);
		alphabetButtons += `<button class="glossaryBtn btn btn-outline-primary m-1 ${letter === 'A' ? 'active' : ''}" onclick="openItem('${letter}', event)">${letter}</button>\n`;

		glossaryContent += `<div id="${letter}" class="result-container glosary-item" style="display:${letter === 'A' ? 'block' : 'none'};">\n`;

		if (groupedData[letter] && groupedData[letter].length > 0) {
			groupedData[letter].forEach(item => {
				glossaryContent += `<h2>${item.term}</h2>\n<div>${item.definition}</div>\n`;
			});
		} else {
			glossaryContent += `<h2>${letter}</h2><p>No terms found</p>\n`;
		}
		glossaryContent += "</div>\n";
	}

	const glossaryHtml = `
            <style>
                .active.glossaryBtn,
                .glossaryBtn:hover {
                    background: black !important;
                    transform: translateY(-4px) scale(1);
                    transition: 0.2s;
                    color: #ffbf00!important
                }
            </style>
            <div class="custom-glossary">
                <script>
                    function openItem(glossaryItem, evt) {
                        var items = document.getElementsByClassName("result-container");
                        for (var i = 0; i < items.length; i++) {
                            items[i].style.display = "none";
                        }
                        document.getElementById(glossaryItem).style.display = "block";

                        var btns = document.getElementsByClassName("glossaryBtn");
                        for (var j = 0; j < btns.length; j++) {
                            btns[j].classList.remove("active");
                        }
                        evt.target.classList.add("active");
                    }
                </script>
                <div class="container">
                    <div class="glossaryBtnMain alphabet-buttons mb-3">
                        ${alphabetButtons}
                    </div>
                    ${glossaryContent}
                </div>
            </div>`;

	return glossaryHtml;
}
