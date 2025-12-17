"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	FileText,
	Upload,
	Code,
	Eye,
	Copy,
	CheckCircle2,
	AlertCircle,
	Image as ImageIcon
} from "lucide-react";
import {
	processBlogFile,
	generateBlogCode,
	generateBlogFAQCode
} from "@/lib/docx-processor";
import { PreviewDrawer } from "@/components/preview-drawer";

export function BlogGenerator() {
	const [file, setFile] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [progressText, setProgressText] = useState("");
	const [blogData, setBlogData] = useState(null);
	const [notification, setNotification] = useState(null);

	// Blog Form State
	const [featuredImage, setFeaturedImage] = useState("");
	const [altText, setAltText] = useState("");
	const [title, setTitle] = useState("");
	const [contentImages, setContentImages] = useState({}); // { 0: "url1", 1: "url2" }

	// Generated Code States
	const [blogCode, setBlogCode] = useState("");
	const [faqCode, setFaqCode] = useState("");

	// View State
	const [activeView, setActiveView] = useState("content"); // content, faq
	const fileInputRef = useRef(null);

	// Preview Drawer State
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewContent, setPreviewContent] = useState("");
	const [previewTitle, setPreviewTitle] = useState("");

	const showNotification = (message, type = "success") => {
		setNotification({ message, type });
		setTimeout(() => setNotification(null), 3000);
	};

	const handleFileChange = (e) => {
		if (e.target.files && e.target.files[0]) {
			setFile(e.target.files[0]);
			showNotification(`Selected: ${e.target.files[0].name}`, "info");
		}
	};

	const handleUpload = async () => {
		if (!file) return showNotification("Please select a file to upload.", "warning");

		setIsProcessing(true);
		setProgress(10);
		setProgressText("Reading DOCX file...");

		try {
			const interval = setInterval(() => {
				setProgress(p => Math.min(p + 10, 90));
			}, 200);

			const data = await processBlogFile(file);

			clearInterval(interval);
			setProgress(100);
			setProgressText("Blog content extracted successfully!");
			setBlogData(data);
			setTitle(data.blogData.title); // Auto-fill title
			showNotification("Blog content extracted!", "success");

			setTimeout(() => {
				setIsProcessing(false);
				setProgress(0);
				setProgressText("");
			}, 2000);

		} catch (error) {
			setIsProcessing(false);
			showNotification("Error extraction content: " + error.message, "error");
		}
	};

	const handleImageChange = (index, value) => {
		setContentImages(prev => ({
			...prev,
			[index]: value
		}));
	};

	const handleGenerateBlog = () => {
		if (!blogData) return showNotification("Please upload and process a file first.", "warning");

		// Prepare data with user inputs
		const imagesArray = [];
		// The state `blogData` structure is { blogData: {...}, faqData: [...] }
		// We need to access the inner blogData for the image count
		const innerBlogData = blogData.blogData;

		for (let i = 0; i < innerBlogData.imageCount; i++) {
			imagesArray.push(contentImages[i] || "");
		}

		// Prepare the data object expected by the generator
		const dataForGenerator = {
			...innerBlogData,
			title: title // Override title with user input
		};

		const featuredImageObj = {
			url: featuredImage,
			alt: altText
		};

		// Call with correct signature: generateBlogCode(blogData, featuredImageObj, imageUrlsArray)
		const code = generateBlogCode(dataForGenerator, featuredImageObj, imagesArray);
		setBlogCode(code);
		setActiveView("content");
		showNotification("Blog content code generated successfully!");
	};

	const handleGenerateFAQ = () => {
		if (!blogData) return showNotification("Please upload and process a file first.", "warning");
		// Pass the faqData array from the state object
		const code = generateBlogFAQCode(blogData.faqData);
		setFaqCode(code);
		setActiveView("faq");
		showNotification("FAQ code generated successfully!");
	};

	const downloadDemoFile = () => {
		const link = document.createElement('a');
		link.href = 'https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765354092/Blog_Sample_File.docx';
		link.download = 'Blog_Sample_File.docx';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const openPreview = (content, title) => {
		setPreviewContent(content);
		setPreviewTitle(title);
		setPreviewOpen(true);
	};

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		showNotification("Copied to clipboard!");
	};

	return (
		<div className="space-y-6">
			<div className="grid lg:grid-cols-2 gap-6">

				{/* LEFT COLUMN: Controls */}
				<div className="space-y-6">

					<Card className="card">
						<CardHeader className="card-header">
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5 text-warning" />
								Upload Blog Post
							</CardTitle>
						</CardHeader>
						<CardContent className="card-body space-y-4">

							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">
									Upload a DOCX file formatted for a blog post.
								</p>
								<Button variant="outline" size="sm" onClick={downloadDemoFile} className="btn">
									<Upload className="mr-2 h-4 w-4" />
									Download Demo File
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
									{file ? `Selected: ${file.name}` : "No file selected"}
								</div>
							</div>

							{isProcessing && (
								<div className="pt-2">
									<Progress value={progress} className="progress-bar mb-2" />
									<p className="text-center text-sm text-muted-foreground">{progressText}</p>
								</div>
							)}

						</CardContent>
					</Card>

					{/* Settings Card */}
					<Card className="card">
						<CardHeader className="card-header">
							<CardTitle className="flex items-center gap-2">
								<ImageIcon className="h-5 w-5 text-info" />
								Blog Settings
							</CardTitle>
						</CardHeader>
						<CardContent className="card-body space-y-4">
							<div className="space-y-2">
								<Label>Featured Image URL</Label>
								<Input
									placeholder="https://example.com/image.jpg"
									value={featuredImage}
									onChange={(e) => setFeaturedImage(e.target.value)}
									className="form-control"
								/>
							</div>
							<div className="space-y-2">
								<Label>Alt Text</Label>
								<Input
									placeholder="Describe the image"
									value={altText}
									onChange={(e) => setAltText(e.target.value)}
									className="form-control"
								/>
							</div>
							<div className="space-y-2">
								<Label>Blog Title</Label>
								<Input
									placeholder="Extracted from doc or enter manually"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="form-control"
								/>
							</div>

							{blogData && blogData.imageCount > 0 && (
								<div className="space-y-2 border-t pt-4">
									<Label className="text-xs font-semibold uppercase text-muted-foreground">
										Content Images ({blogData.imageCount} found)
									</Label>
									<ScrollArea className="h-[150px] pr-4">
										<div className="space-y-2">
											{Array.from({ length: blogData.imageCount }).map((_, i) => (
												<div key={i} className="flex flex-col gap-1">
													<Label className="text-xs">Image {i + 1} URL</Label>
													<Input
														placeholder={`URL for image placeholder ${i + 1}`}
														value={contentImages[i] || ""}
														onChange={(e) => handleImageChange(i, e.target.value)}
														className="form-control"
													/>
												</div>
											))}
										</div>
									</ScrollArea>
								</div>
							)}

							<div className="grid grid-cols-2 gap-2 pt-2">
								<Button onClick={handleUpload} className="btn bg-primary hover:bg-primary/90 text-primary-foreground">
									<Upload className="mr-2 h-4 w-4" /> 1. Process
								</Button>
								<div className="flex flex-col gap-2">
									<Button onClick={handleGenerateBlog} className="btn bg-green-600 hover:bg-green-700 text-white">
										<Code className="mr-2 h-4 w-4" /> 2. Generate Blog
									</Button>
									<Button onClick={handleGenerateFAQ} className="btn bg-green-600 hover:bg-green-700 text-white">
										<Code className="mr-2 h-4 w-4" /> 3. Generate FAQ
									</Button>
								</div>
							</div>

						</CardContent>
					</Card>

				</div>

				{/* RIGHT COLUMN: Output */}
				<div className="space-y-6">
					<div className="card bg-card border rounded-lg shadow-sm min-h-[600px] flex flex-col overflow-hidden">

						{/* Selector Buttons */}
						{(blogCode || faqCode) ? (
							<div className="flex gap-2 p-2 border-b bg-muted/30">
								<button
									onClick={() => setActiveView("content")}
									className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'content'
										? 'bg-primary text-primary-foreground shadow-sm'
										: 'hover:bg-accent text-muted-foreground'
										}`}
								>
									Blog Content
								</button>
								<button
									onClick={() => setActiveView("faq")}
									className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'faq'
										? 'bg-primary text-primary-foreground shadow-sm'
										: 'hover:bg-accent text-muted-foreground'
										}`}
								>
									FAQ Code
								</button>
							</div>
						) : (
							<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10">
								<Code className="h-12 w-12 mb-4 opacity-20" />
								<h4 className="text-xl font-medium mb-2">No Code Generated Yet</h4>
								<p className="text-sm text-center max-w-xs">
									Upload a file and generate content to see the code here
								</p>
							</div>
						)}

						{/* Textarea Content */}
						{(blogCode || faqCode) && (
							<div className="flex-1 p-4 flex flex-col h-full overflow-hidden">

								{/* FAQ Interactive List */}


								<div className="flex items-center justify-between mb-2 mt-2">
									<h4 className="text-sm font-semibold flex items-center gap-2">
										<Code className="h-4 w-4" />
										{activeView === 'content' ? "Blog HTML Code" : "FAQ HTML Code"}
									</h4>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											className="preview-icon-btn"
											onClick={() => {
												const content = activeView === 'content' ? blogCode : faqCode;
												const title = activeView === 'content' ? 'Blog Post' : 'FAQ';
												openPreview(content, title);
											}}
										>
											<Eye className="h-3 w-3 mr-1" /> Preview
										</Button>
										<Button
											size="sm"
											className="copy-btn"
											onClick={() => {
												const content = activeView === 'content' ? blogCode : faqCode;
												copyToClipboard(content);
											}}
										>
											<Copy className="h-3 w-3 mr-1" /> Copy Code
										</Button>
									</div>
								</div>

								<textarea
									className="flex-1 w-full bg-muted/50 border rounded-md p-4 font-mono text-xs resize-none focus:outline-ring code-editor"
									value={activeView === 'content' ? blogCode : faqCode}
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
				data={activeView === 'faq' ? blogData?.faqData : null}
			/>

			{notification && (
				<div className={`notification fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${notification.type === 'error'
					? 'bg-destructive text-destructive-foreground'
					: notification.type === 'warning'
						? 'bg-warning text-warning-foreground'
						: 'text-foreground'
					}`}>
					{notification.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
					{notification.message}
				</div>
			)}
		</div>
	);
}
