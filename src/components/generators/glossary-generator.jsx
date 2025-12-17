"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
	FileText,
	Upload,
	Code,
	Copy,
	Eye,
	Book,
	CheckCircle2,
	AlertCircle
} from "lucide-react";
import {
	processGlossaryFile,
	generateGlossaryCode
} from "@/lib/docx-processor";
import { PreviewDrawer } from "@/components/preview-drawer";

export function GlossaryGenerator() {
	const [file, setFile] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [progressText, setProgressText] = useState("");
	const [glossaryData, setGlossaryData] = useState(null);
	const [glossaryCode, setGlossaryCode] = useState("");
	const [notification, setNotification] = useState(null);

	const fileInputRef = useRef(null);

	// Preview Drawer State
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewContent, setPreviewContent] = useState("");

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

			const data = await processGlossaryFile(file);

			clearInterval(interval);
			setProgress(100);
			setProgressText("Glossary extracted successfully!");
			setGlossaryData(data);

			showNotification(`Glossary extracted! Found ${data.length} terms.`, "success");

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

	const handleGenerate = () => {
		if (!glossaryData) return showNotification("Please upload and process a DOCX file first.", "warning");
		const code = generateGlossaryCode(glossaryData);
		setGlossaryCode(code);
		showNotification("Glossary code generated successfully!");
	};

	const downloadDemoFile = () => {
		const link = document.createElement('a');
		link.href = 'https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765354092/Glossary_Sample_File.docx';
		link.download = 'Glossary_Sample_File.docx';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const openPreview = () => {
		setPreviewContent(glossaryCode);
		setPreviewOpen(true);
	};

	const copyToClipboard = () => {
		navigator.clipboard.writeText(glossaryCode);
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
								<Book className="h-5 w-5 text-warning" />
								Upload Glossary File
							</CardTitle>
						</CardHeader>
						<CardContent className="card-body space-y-4">
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">
									Upload a DOCX file containing tables with Term and Definition columns.
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
								<div className="text-xs text-muted-foreground mt-1">
									{file ? `Selected: ${file.name}` : "No file selected"}
								</div>
							</div>
						</CardContent>
					</Card>

					{isProcessing && (
						<Card className="card">
							<CardContent className="card-body pt-6">
								<Progress value={progress} className="progress-bar mb-2" />
								<p className="text-center text-sm text-muted-foreground">{progressText}</p>
							</CardContent>
						</Card>
					)}

					<Card className="card">
						<CardHeader className="card-header">
							<CardTitle className="flex items-center gap-2">
								<Code className="h-5 w-5 text-info" />
								Generate Content
							</CardTitle>
						</CardHeader>
						<CardContent className="card-body">
							<div className="grid grid-cols-2 gap-2">
								<Button onClick={handleUpload} className="btn bg-primary hover:bg-primary/90">
									<Upload className="mr-2 h-4 w-4" /> 1. Process File
								</Button>
								<Button onClick={handleGenerate} className="btn bg-green-600 hover:bg-green-700 text-white">
									<Code className="mr-2 h-4 w-4" /> 2. Generate Code
								</Button>
							</div>
						</CardContent>
					</Card>

				</div>

				{/* RIGHT COLUMN: Output */}
				<div className="space-y-6">
					<div className="card bg-card border rounded-lg shadow-sm min-h-[600px] flex flex-col">

						{!glossaryCode ? (
							<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10">
								<Code className="h-12 w-12 mb-4 opacity-20" />
								<h4 className="text-xl font-medium mb-2">No Code Generated Yet</h4>
								<p className="text-sm text-center max-w-xs">
									Upload a file and generate content to see the code here
								</p>
							</div>
						) : (
							<div className="flex-1 p-4 flex flex-col">
								<div className="flex items-center justify-between mb-2">
									<h4 className="text-sm font-semibold flex items-center gap-2">
										<Code className="h-4 w-4" /> Glossary Code
									</h4>
									<div className="flex gap-2">
										<Button variant="outline" size="sm" onClick={openPreview} className="preview-icon-btn">
											<Eye className="h-3 w-3 mr-1" /> Preview
										</Button>
										<Button size="sm" onClick={copyToClipboard} className="copy-btn">
											<Copy className="h-3 w-3 mr-1" /> Copy
										</Button>
									</div>
								</div>

								<textarea
									className="flex-1 w-full bg-muted/50 border rounded-md p-4 font-mono text-xs resize-none focus:outline-ring code-editor"
									value={glossaryCode}
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
				title="Glossary Preview"
				content={previewContent}
			/>

			{notification && (
				<div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${notification.type === 'error'
					? 'bg-destructive text-destructive-foreground'
					: notification.type === 'warning'
						? 'bg-warning text-warning-foreground'
						: 'bg-green-600 text-white'
					}`}>
					{notification.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
					{notification.message}
				</div>
			)}
		</div>
	);
}
