"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
	FileSpreadsheet,
	Upload,
	Code,
	Copy,
	Eye,
	CheckCircle2,
	AlertCircle
} from "lucide-react";
import { processResourceFile } from "@/lib/excel-processor";
import { PreviewDrawer } from "@/components/preview-drawer";

export function ResourceGenerator() {
	const [file, setFile] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [progressText, setProgressText] = useState("");
	const [resourceCode, setResourceCode] = useState("");
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

	const handleGenerate = async () => {
		if (!file) return showNotification("Please select a file to upload.", "warning");

		setIsProcessing(true);
		setProgress(10);
		setProgressText("Reading Excel file...");

		try {
			const interval = setInterval(() => {
				setProgress(p => Math.min(p + 10, 90));
			}, 200);

			const { html, count } = await processResourceFile(file);

			clearInterval(interval);
			setProgress(100);
			setProgressText("Resources generated successfully!");
			setResourceCode(html);

			showNotification(`Generated HTML for ${count} resources!`, "success");

			setTimeout(() => {
				setIsProcessing(false);
				setProgress(0);
				setProgressText("");
			}, 2000);

		} catch (error) {
			setIsProcessing(false);
			showNotification("Error processing file: " + error.message, "error");
		}
	};

	const downloadDemoFile = () => {
		const link = document.createElement('a');
		link.href = 'https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765354092/Resource_Sample_File.xlsx';
		link.download = 'Resource_Sample_File.xlsx';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const openPreview = () => {
		setPreviewContent(resourceCode);
		setPreviewOpen(true);
	};

	const copyToClipboard = () => {
		navigator.clipboard.writeText(resourceCode);
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
								<FileSpreadsheet className="h-5 w-5 text-warning" />
								Upload Resource File
							</CardTitle>
						</CardHeader>
						<CardContent className="card-body space-y-4">
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">
									Upload an Excel file (.xlsx) with columns for Module, Title, PDFs, and Links.
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
									<p className="text-sm text-muted-foreground">Click to upload Excel file</p>
								</div>
								<Input
									ref={fileInputRef}
									type="file"
									accept=".xlsx, .xls"
									onChange={handleFileChange}
									className="hidden"
								/>
								<div className="text-xs text-muted-foreground mt-1 text-center">
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
							<Button onClick={handleGenerate} className="btn w-full bg-green-600 hover:bg-green-700 text-white">
								<Code className="mr-2 h-4 w-4" /> Generate Resource HTML
							</Button>
						</CardContent>
					</Card>

				</div>

				{/* RIGHT COLUMN: Output */}
				<div className="space-y-6">
					<div className="card bg-card border rounded-lg shadow-sm min-h-[600px] flex flex-col">

						{!resourceCode ? (
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
										<Code className="h-4 w-4" /> Resource HTML Code
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
									value={resourceCode}
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
				title="Resource Preview"
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
