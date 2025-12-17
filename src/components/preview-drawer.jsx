"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Copy, X } from "lucide-react";
import { useState } from "react";

export function PreviewDrawer({
	open,
	onOpenChange,
	title,
	content,
	onCopy,
	data
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		if (content) {
			await navigator.clipboard.writeText(content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			onCopy?.();
		}
	};

	const copyText = async (text) => {
		await navigator.clipboard.writeText(text);
	};

	const isFaqView = title?.toLowerCase().includes('faq') && Array.isArray(data) && data.length > 0;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[80vw] p-0">
				<SheetHeader className="flex flex-row items-center justify-between border-b border-border p-4">
					<div className="flex items-center gap-2">
						<Eye className="h-5 w-5 text-primary" />
						<SheetTitle>{title} Preview</SheetTitle>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleCopy}
							className="gap-2"
						>
							<Copy className="h-4 w-4" />
							{copied ? 'Copied!' : 'Copy Code'}
						</Button>
					</div>
				</SheetHeader>
				<ScrollArea className="h-[calc(100vh-80px)]">
					<div className="p-6">
						{isFaqView ? (
							<div className="space-y-4">
								<div className="alert alert-info bg-muted p-4 rounded-lg mb-4 text-sm text-muted-foreground border">
									<p className="font-semibold mb-1">Interactive FAQ Mode</p>
									<p>Use the buttons below to copy individual questions (text) or answers (HTML).</p>
								</div>
								{data.map((faq, idx) => (
									<div key={idx} className="bg-card border rounded-lg p-4 shadow-sm">
										<div className="flex flex-col gap-4">
											{/* Question Section */}
											<div className="flex justify-between items-start gap-4">
												<div className="flex-1">
													<span className="text-xs text-muted-foreground font-semibold uppercase mb-1 block">Question {idx + 1}</span>
													<p className="font-medium text-foreground">{faq.question}</p>
												</div>
												<Button
													size="sm"
													variant="outline"
													className="h-8 text-xs shrink-0"
													onClick={() => copyText(faq.question)}
												>
													<Copy className="h-3 w-3 mr-1" /> Copy Text
												</Button>
											</div>

											<div className="h-px bg-border/50" />

											{/* Answer Section */}
											<div className="flex justify-between items-start gap-4">
												<div className="flex-1">
													<span className="text-xs text-muted-foreground font-semibold uppercase mb-1 block">Answer {idx + 1}</span>
													<div className="text-sm text-muted-foreground line-clamp-3 bg-muted/30 p-2 rounded" dangerouslySetInnerHTML={{ __html: faq.answer }} />
												</div>
												<Button
													size="sm"
													variant="outline"
													className="h-8 text-xs shrink-0"
													onClick={() => copyText(faq.answer)}
												>
													<Copy className="h-3 w-3 mr-1" /> Copy HTML
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div
								className="preview-container prose prose-sm dark:prose-invert max-w-none rounded-lg border border-border p-6"
								dangerouslySetInnerHTML={{ __html: content || '' }}
							/>
						)}
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}
