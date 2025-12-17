"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
	Eraser,
	Eye,
	History,
	Undo2,
	Copy,
	Trash2,
	FileText,
	CheckCircle2,
	AlertCircle,
	Code,
	Settings
} from "lucide-react";
import { PreviewDrawer } from "@/components/preview-drawer";
import { cleanHTML, getHTMLStats, getReductionRate } from "@/lib/html-cleaner";

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

const optionLabels = {
	removeNBSP: { label: "Remove &nbsp;", icon: "space-shuttle" },
	removeClasses: { label: "Remove classes", icon: "tags" },
	removeIds: { label: "Remove IDs", icon: "id-card" },
	removeStyleAttrs: { label: "Remove style attrs", icon: "paint-brush" },
	removeDataAttrs: { label: "Remove data attrs", icon: "database" },
	removeEmptyTags: { label: "Remove empty tags", icon: "trash-alt" },
	removeInlineStyles: { label: "Remove inline styles", icon: "code" },
	removeFontTags: { label: "Remove font/span", icon: "font" },
	minifyHTML: { label: "Minify HTML", icon: "compress" },
	beautifyHTML: { label: "Beautify HTML", icon: "code" },
	preserveEssentialAttrs: { label: "Preserve essential", icon: "shield-alt" },
	removeComments: { label: "Remove comments", icon: "comment-slash" },
	normalizeWhitespace: { label: "Normalize whitespace", icon: "text-height" },
	removeScriptStyleTags: { label: "Remove script/style", icon: "ban" },
	removeBrTags: { label: "Remove <br> tags", icon: "level-up-alt" },
	convertLineBreaks: { label: "Convert line breaks", icon: "paragraph" }
};

export function HTMLCleaner() {
	const [html, setHtml] = useState("");
	const [options, setOptions] = useState(defaultOptions);
	const [stats, setStats] = useState({ charCount: 0, wordCount: 0, nbspCount: 0, tagCount: 0, cleanScore: 0 });
	const [reductionRate, setReductionRate] = useState(0);
	const [history, setHistory] = useState([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [notification, setNotification] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);

	const showNotification = (message, type = "success") => {
		setNotification({ message, type });
		setTimeout(() => setNotification(null), 3000);
	};

	// Update stats when HTML changes
	useEffect(() => {
		if (typeof window !== 'undefined' && html) {
			const newStats = getHTMLStats(html);
			setStats(newStats);
		}
	}, [html]);

	const handleClean = useCallback(() => {
		if (!html.trim()) {
			showNotification("Please enter some HTML first", "error");
			return;
		}

		setIsProcessing(true);

		// Save current state to history
		setHistory(prev => [...prev.slice(0, historyIndex + 1), html]);
		setHistoryIndex(prev => prev + 1);

		try {
			const cleaned = cleanHTML(html, options);
			const reduction = getReductionRate(html, cleaned);

			setHtml(cleaned);
			setReductionRate(reduction);
			showNotification(`HTML cleaned! Reduced by ${reduction}%`);
		} catch (error) {
			showNotification("Error cleaning HTML: " + error.message, "error");
		} finally {
			setIsProcessing(false);
		}
	}, [html, options, historyIndex]);

	const handleUndo = () => {
		if (historyIndex >= 0) {
			setHtml(history[historyIndex]);
			setHistoryIndex(prev => prev - 1);
			showNotification("Undo successful");
		}
	};

	const handleCopy = async () => {
		if (!html.trim()) {
			showNotification("Nothing to copy", "error");
			return;
		}
		await navigator.clipboard.writeText(html);
		showNotification("HTML copied to clipboard!");
	};

	const handleClear = () => {
		if (html) {
			setHistory(prev => [...prev, html]);
			setHistoryIndex(prev => prev + 1);
		}
		setHtml("");
		setReductionRate(0);
		showNotification("Editor cleared");
	};

	const handlePasteExample = () => {
		const exampleHTML = `<div class="container" style="margin: 0 auto;" id="main-content">
  <p style="color: red;">&nbsp;This is a&nbsp;paragraph with&nbsp;
  non-breaking spaces&nbsp;and inline styles.&nbsp;</p>
  <span class="highlight" data-info="test">Some text</span>
  <!-- This is a comment -->
  <p></p>
  <div class="empty"></div>
  <script>alert('test');</script>
  <style>.test { color: blue; }</style>
  <br><br>
</div>`;
		setHtml(exampleHTML);
		showNotification("Example HTML pasted");
	};

	const toggleOption = (key) => {
		setOptions(prev => ({ ...prev, [key]: !prev[key] }));
	};

	const selectAll = () => {
		setOptions(Object.fromEntries(Object.keys(defaultOptions).map(k => [k, true])));
	};

	const deselectAll = () => {
		setOptions(Object.fromEntries(Object.keys(defaultOptions).map(k => [k, false])));
	};

	return (
		<div className="space-y-6">
			{/* Main Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Eraser className="h-5 w-5 text-blue-500" />
						Advanced HTML Cleaner
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Action Buttons */}
					<div className="flex flex-wrap gap-2">
						<Button onClick={handleClean} disabled={isProcessing}>
							<Eraser className="mr-2 h-4 w-4" />
							Clean HTML
						</Button>
						<Button variant="outline" onClick={() => setPreviewOpen(true)}>
							<Eye className="mr-2 h-4 w-4" />
							Preview
						</Button>
						<Button variant="outline" onClick={handleUndo} disabled={historyIndex < 0}>
							<Undo2 className="mr-2 h-4 w-4" />
							Undo
						</Button>
						<Button variant="outline" onClick={handleCopy}>
							<Copy className="mr-2 h-4 w-4" />
							Copy
						</Button>
						<Button variant="outline" onClick={handleClear}>
							<Trash2 className="mr-2 h-4 w-4" />
							Clear
						</Button>
						<Button variant="outline" onClick={handlePasteExample}>
							<FileText className="mr-2 h-4 w-4" />
							Example
						</Button>
					</div>

					{/* Editor */}
					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							<Code className="h-4 w-4" />
							Paste your HTML here:
						</Label>
						<Textarea
							value={html}
							onChange={(e) => setHtml(e.target.value)}
							placeholder="Paste your HTML content here..."
							className="min-h-[250px] font-mono text-sm"
						/>
					</div>

					{/* Statistics */}
					<div className="grid grid-cols-3 md:grid-cols-6 gap-2">
						<div className="rounded-lg border p-3 text-center">
							<div className="text-xs text-muted-foreground">Chars</div>
							<div className="text-lg font-semibold">{stats.charCount.toLocaleString()}</div>
						</div>
						<div className="rounded-lg border p-3 text-center">
							<div className="text-xs text-muted-foreground">Words</div>
							<div className="text-lg font-semibold">{stats.wordCount.toLocaleString()}</div>
						</div>
						<div className="rounded-lg border p-3 text-center">
							<div className="text-xs text-muted-foreground">&amp;nbsp;</div>
							<div className="text-lg font-semibold">{stats.nbspCount}</div>
						</div>
						<div className="rounded-lg border p-3 text-center">
							<div className="text-xs text-muted-foreground">Tags</div>
							<div className="text-lg font-semibold">{stats.tagCount}</div>
						</div>
						<div className="rounded-lg border p-3 text-center">
							<div className="text-xs text-muted-foreground">Score</div>
							<div className="text-lg font-semibold">{stats.cleanScore}%</div>
						</div>
						<div className="rounded-lg border p-3 text-center">
							<div className="text-xs text-muted-foreground">Reduction</div>
							<div className="text-lg font-semibold text-green-500">{reductionRate}%</div>
						</div>
					</div>

					{/* Cleaning Options Accordion */}
					<Accordion type="single" collapsible>
						<AccordionItem value="options">
							<AccordionTrigger>
								<div className="flex items-center gap-2">
									<Settings className="h-4 w-4" />
									Cleaning Options
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
									{Object.entries(optionLabels).map(([key, { label }]) => (
										<div key={key} className="flex items-center space-x-2">
											<Switch
												id={key}
												checked={options[key]}
												onCheckedChange={() => toggleOption(key)}
											/>
											<Label htmlFor={key} className="text-sm cursor-pointer">
												{label}
											</Label>
										</div>
									))}
								</div>
								<div className="flex gap-2 mt-4 pt-4 border-t">
									<Button variant="outline" size="sm" onClick={selectAll}>
										Select All
									</Button>
									<Button variant="outline" size="sm" onClick={deselectAll}>
										Deselect All
									</Button>
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</CardContent>
			</Card>

			{/* Preview Drawer */}
			<PreviewDrawer
				open={previewOpen}
				onOpenChange={setPreviewOpen}
				title="HTML"
				code={html}
				onCopy={() => showNotification("Code copied!")}
			/>

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
