"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
	ImageIcon,
	Upload,
	Download,
	Trash2,
	Settings,
	RefreshCw,
	Eye,
	CheckCircle2,
	AlertCircle,
	CloudUpload,
	X
} from "lucide-react";
import {
	convertImage,
	formatFileSize,
	calculateReduction,
	validateImageFile,
	downloadImage,
	getSupportedFormats
} from "@/lib/image-converter";

export function ImageConverter() {
	const [files, setFiles] = useState([]);
	const [fromFormat, setFromFormat] = useState("png");
	const [toFormat, setToFormat] = useState("");
	const [quality, setQuality] = useState(100);
	const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
	const [preserveMetadata, setPreserveMetadata] = useState(true);
	const [width, setWidth] = useState("");
	const [height, setHeight] = useState("");
	const [isConverting, setIsConverting] = useState(false);
	const [progress, setProgress] = useState(0);
	const [currentFile, setCurrentFile] = useState("");
	const [convertedFiles, setConvertedFiles] = useState([]);
	const [showSettings, setShowSettings] = useState(false);
	const [notification, setNotification] = useState(null);
	const [dragActive, setDragActive] = useState(false);
	const fileInputRef = useRef(null);

	const formats = getSupportedFormats();

	const showNotification = (message, type = "success") => {
		setNotification({ message, type });
		setTimeout(() => setNotification(null), 3000);
	};

	const handleDrag = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	}, []);

	const handleDrop = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			handleFiles(Array.from(e.dataTransfer.files));
		}
	}, [fromFormat]);

	const handleFileChange = (e) => {
		if (e.target.files && e.target.files.length > 0) {
			handleFiles(Array.from(e.target.files));
		}
	};

	const handleFiles = (newFiles) => {
		const validFiles = newFiles.filter(file => {
			const validation = validateImageFile(file, fromFormat);
			if (!validation.valid) {
				showNotification(validation.errors[0], "error");
				return false;
			}
			return true;
		}).slice(0, 10); // Max 10 files

		if (validFiles.length > 0) {
			setFiles(prev => [...prev, ...validFiles].slice(0, 10));
			showNotification(`Added ${validFiles.length} file(s)`);
		}
	};

	const removeFile = (index) => {
		setFiles(prev => prev.filter((_, i) => i !== index));
	};

	const clearQueue = () => {
		setFiles([]);
		setConvertedFiles([]);
		showNotification("Queue cleared");
	};

	const convertAll = async () => {
		if (files.length === 0) {
			showNotification("Please add some files first", "error");
			return;
		}

		if (!toFormat) {
			showNotification("Please select a target format", "error");
			return;
		}

		setIsConverting(true);
		setConvertedFiles([]);
		setProgress(0);

		const results = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			setCurrentFile(file.name);
			setProgress(Math.round(((i + 0.5) / files.length) * 100));

			try {
				const result = await convertImage(file, toFormat, {
					quality,
					width: width ? parseInt(width) : null,
					height: height ? parseInt(height) : null,
					maintainAspectRatio
				});

				results.push({
					...result,
					originalName: file.name,
					success: true
				});
			} catch (error) {
				results.push({
					originalName: file.name,
					success: false,
					error: error.message
				});
			}

			setProgress(Math.round(((i + 1) / files.length) * 100));
		}

		setConvertedFiles(results);
		setIsConverting(false);
		setCurrentFile("");

		const successCount = results.filter(r => r.success).length;
		showNotification(`Converted ${successCount}/${files.length} files successfully`);
	};

	const downloadAll = () => {
		const successFiles = convertedFiles.filter(f => f.success);
		successFiles.forEach(file => {
			downloadImage(file.blob, file.fileName);
		});
		showNotification(`Downloading ${successFiles.length} files`);
	};

	const downloadSingle = (file) => {
		downloadImage(file.blob, file.fileName);
		showNotification(`Downloading ${file.fileName}`);
	};

	const reset = () => {
		setFiles([]);
		setConvertedFiles([]);
		setProgress(0);
		setCurrentFile("");
	};

	// Calculate total stats
	const totalOriginalSize = convertedFiles.reduce((sum, f) => sum + (f.originalSize || 0), 0);
	const totalConvertedSize = convertedFiles.reduce((sum, f) => sum + (f.convertedSize || 0), 0);
	const totalReduction = calculateReduction(totalOriginalSize, totalConvertedSize);

	return (
		<div className="space-y-6">
			{/* Hero Section */}
			<div className="text-center space-y-2">
				<h2 className="text-2xl font-bold">Batch Image Converter</h2>
				<p className="text-muted-foreground">
					Convert multiple images between formats with professional settings. Preview before/after comparisons.
				</p>
			</div>

			{/* Main Card */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Settings className="h-5 w-5" />
							Convert Images
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* File Upload Area */}
					<div
						className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
								? "border-primary bg-primary/5"
								: "border-muted-foreground/25 hover:border-primary/50"
							}`}
						onDragEnter={handleDrag}
						onDragLeave={handleDrag}
						onDragOver={handleDrag}
						onDrop={handleDrop}
					>
						<CloudUpload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
						<h4 className="text-lg font-medium mb-2">Drag & Drop Your Images Here</h4>
						<p className="text-sm text-muted-foreground mb-4">
							Supports {fromFormat.toUpperCase()} files only
						</p>
						<Button onClick={() => fileInputRef.current?.click()}>
							<Upload className="mr-2 h-4 w-4" />
							Choose Files
						</Button>
						<input
							ref={fileInputRef}
							type="file"
							accept={`.${fromFormat}`}
							multiple
							onChange={handleFileChange}
							className="hidden"
						/>
						<p className="text-xs text-muted-foreground mt-4">
							Maximum 10 images, 5MB each
						</p>
					</div>

					{/* File Queue */}
					{files.length > 0 && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="font-medium flex items-center gap-2">
									<ImageIcon className="h-4 w-4" />
									Selected Files
									<Badge variant="secondary">{files.length}</Badge>
								</h4>
								<Button variant="outline" size="sm" onClick={clearQueue}>
									<Trash2 className="mr-2 h-4 w-4" />
									Clear Queue
								</Button>
							</div>
							<div className="space-y-2 max-h-48 overflow-y-auto">
								{files.map((file, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
									>
										<div className="flex items-center gap-3">
											<ImageIcon className="h-5 w-5 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">{file.name}</p>
												<p className="text-xs text-muted-foreground">
													{formatFileSize(file.size)}
												</p>
											</div>
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => removeFile(index)}
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Format Selection */}
					<div className="grid md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Convert From</Label>
							<Select value={fromFormat} onValueChange={setFromFormat}>
								<SelectTrigger>
									<SelectValue placeholder="Select source format" />
								</SelectTrigger>
								<SelectContent>
									{formats.map(format => (
										<SelectItem key={format.value} value={format.value}>
											{format.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Convert To</Label>
							<Select value={toFormat} onValueChange={setToFormat}>
								<SelectTrigger>
									<SelectValue placeholder="Select target format..." />
								</SelectTrigger>
								<SelectContent>
									{formats.filter(f => f.value !== fromFormat).map(format => (
										<SelectItem key={format.value} value={format.value}>
											{format.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Advanced Settings */}
					<Accordion type="single" collapsible>
						<AccordionItem value="settings">
							<AccordionTrigger>
								<div className="flex items-center gap-2">
									<Settings className="h-4 w-4" />
									Advanced Settings
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<div className="space-y-4 pt-4">
									{/* Quality Slider */}
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label>Quality</Label>
											<Badge variant="outline">{quality}%</Badge>
										</div>
										<input
											type="range"
											min="1"
											max="100"
											value={quality}
											onChange={(e) => setQuality(parseInt(e.target.value))}
											className="w-full"
										/>
										<div className="flex justify-between text-xs text-muted-foreground">
											<span>Low (Smaller Size)</span>
											<span>High (Better Quality)</span>
										</div>
									</div>

									{/* Switches */}
									<div className="flex flex-col gap-3">
										<div className="flex items-center space-x-2">
											<Switch
												id="aspectRatio"
												checked={maintainAspectRatio}
												onCheckedChange={setMaintainAspectRatio}
											/>
											<Label htmlFor="aspectRatio">Maintain Aspect Ratio</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Switch
												id="metadata"
												checked={preserveMetadata}
												onCheckedChange={setPreserveMetadata}
											/>
											<Label htmlFor="metadata">Preserve Metadata</Label>
										</div>
									</div>

									{/* Dimensions */}
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label>Width (Optional)</Label>
											<Input
												type="number"
												placeholder="Auto"
												value={width}
												onChange={(e) => setWidth(e.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label>Height (Optional)</Label>
											<Input
												type="number"
												placeholder="Auto"
												value={height}
												onChange={(e) => setHeight(e.target.value)}
												disabled={maintainAspectRatio}
											/>
										</div>
									</div>
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion>

					{/* Convert Button */}
					<Button
						className="w-full"
						size="lg"
						onClick={convertAll}
						disabled={files.length === 0 || !toFormat || isConverting}
					>
						<RefreshCw className={`mr-2 h-4 w-4 ${isConverting ? 'animate-spin' : ''}`} />
						Convert All Images
					</Button>

					{/* Progress */}
					{isConverting && (
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span>{currentFile}</span>
								<span>{progress}%</span>
							</div>
							<Progress value={progress} />
						</div>
					)}

					{/* Results */}
					{convertedFiles.length > 0 && (
						<div className="space-y-4">
							{/* Stats */}
							<div className="grid grid-cols-4 gap-4">
								<div className="rounded-lg border p-3 text-center">
									<div className="text-xs text-muted-foreground">Files Converted</div>
									<div className="text-lg font-semibold">
										{convertedFiles.filter(f => f.success).length}
									</div>
								</div>
								<div className="rounded-lg border p-3 text-center">
									<div className="text-xs text-muted-foreground">Size Reduction</div>
									<div className="text-lg font-semibold text-green-500">{totalReduction}%</div>
								</div>
								<div className="rounded-lg border p-3 text-center">
									<div className="text-xs text-muted-foreground">Original Size</div>
									<div className="text-lg font-semibold">{formatFileSize(totalOriginalSize)}</div>
								</div>
								<div className="rounded-lg border p-3 text-center">
									<div className="text-xs text-muted-foreground">Converted Size</div>
									<div className="text-lg font-semibold">{formatFileSize(totalConvertedSize)}</div>
								</div>
							</div>

							{/* Converted Files List */}
							<div className="space-y-2 max-h-48 overflow-y-auto">
								{convertedFiles.map((file, index) => (
									<div
										key={index}
										className={`flex items-center justify-between p-3 rounded-lg ${file.success ? 'bg-green-500/10' : 'bg-destructive/10'
											}`}
									>
										<div className="flex items-center gap-3">
											{file.success ? (
												<CheckCircle2 className="h-5 w-5 text-green-500" />
											) : (
												<AlertCircle className="h-5 w-5 text-destructive" />
											)}
											<div>
												<p className="text-sm font-medium">{file.fileName || file.originalName}</p>
												{file.success && (
													<p className="text-xs text-muted-foreground">
														{formatFileSize(file.originalSize)} → {formatFileSize(file.convertedSize)}
														<span className="text-green-500 ml-2">
															(-{calculateReduction(file.originalSize, file.convertedSize)}%)
														</span>
													</p>
												)}
												{!file.success && (
													<p className="text-xs text-destructive">{file.error}</p>
												)}
											</div>
										</div>
										{file.success && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => downloadSingle(file)}
											>
												<Download className="h-4 w-4" />
											</Button>
										)}
									</div>
								))}
							</div>

							{/* Download Actions */}
							<div className="flex gap-3">
								<Button className="flex-1" onClick={downloadAll}>
									<Download className="mr-2 h-4 w-4" />
									Download All Files
								</Button>
								<Button variant="outline" className="flex-1" onClick={reset}>
									<RefreshCw className="mr-2 h-4 w-4" />
									Convert More Images
								</Button>
							</div>
						</div>
					)}
				</CardContent>
				<CardFooter className="flex justify-between text-xs text-muted-foreground">
					<span>🔒 Your files are processed locally and never uploaded to any server.</span>
					<span>⚡ Fast batch conversion powered by HTML5 Canvas</span>
				</CardFooter>
			</Card>

			{/* Notification Toast */}
			{notification && (
				<div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${notification.type === 'error'
						? 'bg-destructive text-destructive-foreground'
						: 'bg-primary text-primary-foreground'
					}`}>
					{notification.type === 'error' ? (
						<AlertCircle className="h-5 w-5" />
					) : (
						<CheckCircle2 className="h-5 w-5" />
					)}
					{notification.message}
				</div>
			)}
		</div>
	);
}
