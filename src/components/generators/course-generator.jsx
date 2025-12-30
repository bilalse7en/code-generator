"use client";

import {useState,useRef} from "react";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Progress} from "@/components/ui/progress";
import {ScrollArea} from "@/components/ui/scroll-area";
import {
	FileText,
	Upload,
	Code,
	Eye,
	Copy,
	CheckCircle2,
	AlertCircle
} from "lucide-react";
import {
	processCourseFile,
	generateOverviewCode,
	generateCourseObjectivesCode,
	generateSyllabusCode,
	generateFAQCode
} from "@/lib/docx-processor";
import {PreviewDrawer} from "@/components/preview-drawer";

export function CourseGenerator() {
	const [courseName,setCourseName]=useState("");
	const [file,setFile]=useState(null);
	const [isProcessing,setIsProcessing]=useState(false);
	const [progress,setProgress]=useState(0);
	const [progressText,setProgressText]=useState("");
	const [courseData,setCourseData]=useState(null);
	const [notification,setNotification]=useState(null);

	// Generated Code States
	const [overviewCode,setOverviewCode]=useState("");
	const [objectivesCode,setObjectivesCode]=useState("");
	const [syllabusCode,setSyllabusCode]=useState("");
	const [faqCode,setFaqCode]=useState("");

	// View State
	const [activeView,setActiveView]=useState("overview"); // overview, objectives, syllabus, faq
	const fileInputRef=useRef(null);

	// Preview Drawer State
	const [previewOpen,setPreviewOpen]=useState(false);
	const [previewContent,setPreviewContent]=useState("");
	const [previewTitle,setPreviewTitle]=useState("");

	const showNotification=(message,type="success") => {
		setNotification({message,type});
		setTimeout(() => setNotification(null),3000);
	};

	const handleFileChange=(e) => {
		if(e.target.files&&e.target.files[0]) {
			setFile(e.target.files[0]);
			showNotification(`Selected: ${e.target.files[0].name}`,"info");
		}
	};

	const handleUpload=async () => {
		if(!file) return showNotification("Please select a file to upload.","warning");
		if(!courseName) return showNotification("Please enter a course name.","warning");

		setIsProcessing(true);
		setProgress(10);
		setProgressText("Reading DOCX file...");

		try {
			// Simulate progress
			const interval=setInterval(() => {
				setProgress(p => Math.min(p+10,90));
			},200);

			const data=await processCourseFile(file,courseName);

			clearInterval(interval);
			setProgress(100);
			setProgressText("Course content extracted successfully!");
			setCourseData(data);
			showNotification("Course content extracted successfully!","success");

			setTimeout(() => {
				setIsProcessing(false);
				setProgress(0);
				setProgressText("");
			},2000);

		} catch(error) {
			setIsProcessing(false);
			showNotification("Error extractng content: "+error.message,"error");
		}
	};

	const handleGenerateOverview=() => {
		if(!courseData?.fileProcessed) return showNotification("Please upload and process a DOCX file first.","warning");
		const code=generateOverviewCode(courseData);
		setOverviewCode(code);
		setActiveView("overview");
		showNotification("Overview code generated successfully!");
	};

	const handleGenerateObjectives=() => {
		if(!courseData?.fileProcessed) return showNotification("Please upload and process a DOCX file first.","warning");
		const code=generateCourseObjectivesCode(courseData);
		setObjectivesCode(code);
		setActiveView("objectives");
		showNotification("Course Objectives code generated successfully!");
	};

	const handleGenerateSyllabus=() => {
		if(!courseData?.fileProcessed) return showNotification("Please upload and process a DOCX file first.","warning");
		const code=generateSyllabusCode(courseData);
		setSyllabusCode(code);
		setActiveView("syllabus");
		showNotification("Syllabus code generated successfully!");
	};

	const handleGenerateFAQ=() => {
		if(!courseData?.fileProcessed) return showNotification("Please upload and process a DOCX file first.","warning");
		const code=generateFAQCode(courseData);
		setFaqCode(code);
		setActiveView("faq");
		showNotification("FAQ code generated successfully!");
	};

	const downloadDemoFile=() => {
		const link=document.createElement('a');
		link.href='https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765354187/demo-file-of-website-content-for-3-section.docx';
		link.download='demo-file-of-website-content-for-3-section.docx';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const openPreview=(content,title) => {
		setPreviewContent(content);
		setPreviewTitle(title);
		setPreviewOpen(true);
	};

	const copyToClipboard=(text) => {
		navigator.clipboard.writeText(text);
		showNotification("Copied to clipboard!");
	};

	return (
		<div className="space-y-6">
			<div className="grid lg:grid-cols-2 gap-6">

				{/* LEFT COLUMN: Controls */}
				<div className="space-y-6">

					{/* Upload Card */}
					<Card className="card">
						<CardHeader className="card-header">
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5 text-warning" />
								Upload DOCX File
							</CardTitle>
						</CardHeader>
						<CardContent className="card-body space-y-4">
							<div className="space-y-2">
								<Label htmlFor="courseName">Course Name</Label>
								<Input
									id="courseName"
									placeholder="Enter course name (e.g., Swing Stage Scaffold Training)"
									value={courseName}
									onChange={(e) => setCourseName(e.target.value)}
									className="form-control"
								/>
							</div>

							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">
									Download our demo file to check the required structure. Create your course file following the same format, then upload for easy website content code generation.
								</p>
								<Button variant="outline" size="sm" onClick={downloadDemoFile} className="btn">
									<Upload className="mr-2 h-4 w-4" />
									Download Demo Course File
								</Button>
							</div>

							<div className="space-y-2">
								<div className="file-upload-area p-8 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-muted/50 transition-colors"
									onClick={() => fileInputRef.current?.click()}>
									<Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
									<p className="text-sm text-muted-foreground">Click to upload DOCX file</p>
								</div>
								<Input
									ref={fileInputRef}
									type="file"
									accept=".docx"
									onChange={handleFileChange}
									className="hidden"
								/>
								<div className="text-xs text-muted-foreground mt-1 text-center">
									{file? `Selected: ${file.name}`:"No file selected"}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Progress Card */}
					{isProcessing&&(
						<Card className="card">
							<CardContent className="card-body pt-6">
								<Progress value={progress} className="progress-bar mb-2" />
								<p className="text-center text-sm text-muted-foreground">{progressText}</p>
							</CardContent>
						</Card>
					)}

					{/* Actions Card */}
					<Card className="card">
						<CardHeader className="card-header">
							<CardTitle className="flex items-center gap-2">
								<Code className="h-5 w-5 text-info" />
								Generate Content
							</CardTitle>
						</CardHeader>
						<CardContent className="card-body">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<Button onClick={handleUpload} className="btn bg-primary hover:bg-primary/90 text-primary-foreground">
									<Upload className="mr-2 h-4 w-4" /> Upload File
								</Button>
								<Button onClick={handleGenerateOverview} className="btn bg-green-600 hover:bg-green-700 text-white">
									<Code className="mr-2 h-4 w-4" /> Generate Overview
								</Button>
								<Button onClick={handleGenerateObjectives} className="btn bg-green-600 hover:bg-green-700 text-white">
									<Code className="mr-2 h-4 w-4" /> Course Objectives
								</Button>
								<Button onClick={handleGenerateSyllabus} className="btn bg-green-600 hover:bg-green-700 text-white">
									<Code className="mr-2 h-4 w-4" /> Generate Syllabus
								</Button>
								<Button onClick={handleGenerateFAQ} className="btn bg-green-600 hover:bg-green-700 text-white">
									<Code className="mr-2 h-4 w-4" /> Generate FAQ
								</Button>
							</div>
						</CardContent>
					</Card>

				</div>

				{/* RIGHT COLUMN: Output */}
				<div className="space-y-6">
					<div className="card bg-card border rounded-lg shadow-sm min-h-[600px] flex flex-col overflow-hidden">

						{/* Selector Buttons */}
						{(overviewCode||objectivesCode||syllabusCode||faqCode)? (
							<div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
								<button
									onClick={() => setActiveView("overview")}
									className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView==='overview'
										? 'bg-primary text-primary-foreground shadow-sm'
										:'hover:bg-accent text-muted-foreground'
										}`}
								>
									Overview
								</button>
								<button
									onClick={() => setActiveView("objectives")}
									className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView==='objectives'
										? 'bg-primary text-primary-foreground shadow-sm'
										:'hover:bg-accent text-muted-foreground'
										}`}
								>
									Objectives
								</button>
								<button
									onClick={() => setActiveView("syllabus")}
									className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView==='syllabus'
										? 'bg-primary text-primary-foreground shadow-sm'
										:'hover:bg-accent text-muted-foreground'
										}`}
								>
									Syllabus
								</button>
								<button
									onClick={() => setActiveView("faq")}
									className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView==='faq'
										? 'bg-primary text-primary-foreground shadow-sm'
										:'hover:bg-accent text-muted-foreground'
										}`}
								>
									FAQ
								</button>
							</div>
						):(
							<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10">
								<Code className="h-12 w-12 mb-4 opacity-20" />
								<h4 className="text-xl font-medium mb-2">No Code Generated Yet</h4>
								<p className="text-sm text-center max-w-xs">
									Upload a file and generate content to see the code here
								</p>
							</div>
						)}

						{/* Textarea Content */}
						{(overviewCode||objectivesCode||syllabusCode||faqCode)&&(
							<div className="flex-1 p-4 flex flex-col h-full overflow-hidden">

								{/* FAQ Interactive List Removed to match Blog Generator UI */}

								<div className="flex items-center justify-between mb-2 mt-2">
									<h4 className="text-sm font-semibold flex items-center gap-2">
										<Code className="h-4 w-4" />
										{activeView==='overview'&&"Overview Code"}
										{activeView==='objectives'&&"Course Objectives Code"}
										{activeView==='syllabus'&&"Syllabus Code"}
										{activeView==='faq'&&"Full FAQ HTML Code"}
									</h4>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											className="preview-icon-btn"
											onClick={() => {
												const content={
													'overview': overviewCode,
													'objectives': objectivesCode,
													'syllabus': syllabusCode,
													'faq': faqCode
												}[activeView];
												const title={
													'overview': 'Overview',
													'objectives': 'Course Objectives',
													'syllabus': 'Syllabus',
													'faq': 'FAQ'
												}[activeView];
												openPreview(content,title);
											}}
										>
											<Eye className="h-3 w-3 mr-1" /> Preview
										</Button>
										<Button
											size="sm"
											className="copy-btn"
											onClick={() => {
												const content={
													'overview': overviewCode,
													'objectives': objectivesCode,
													'syllabus': syllabusCode,
													'faq': faqCode
												}[activeView];
												copyToClipboard(content);
											}}
										>
											<Copy className="h-3 w-3 mr-1" /> Copy All
										</Button>
									</div>
								</div>

								<textarea
									className="flex-1 w-full bg-muted/50 border rounded-md p-4 font-mono text-xs resize-none focus:outline-ring code-editor"
									value={
										activeView==='overview'? overviewCode:
											activeView==='objectives'? objectivesCode:
												activeView==='syllabus'? syllabusCode:
													activeView==='faq'? faqCode:""
									}
									readOnly
									placeholder="Code will appear here..."
								/>
							</div>
						)}
					</div>
				</div>
			</div>

			<PreviewDrawer
				open={previewOpen}
				onOpenChange={setPreviewOpen}
				title={previewTitle}
				content={previewContent}
				data={activeView==='faq'? courseData?.faqData:null}
			/>

			{/* Toast Notification */}
			{notification&&(
				<div className={`notification fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${notification.type==='error'
					? 'bg-destructive text-destructive-foreground'
					:notification.type==='warning'
						? 'bg-warning text-warning-foreground'
						:'text-foreground'
					}`}>
					{notification.type==='error'? (
						<AlertCircle className="h-5 w-5" />
					):(
						<CheckCircle2 className="h-5 w-5" />
					)}
					{notification.message}
				</div>
			)}
		</div>
	);
}
