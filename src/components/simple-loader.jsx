"use client";

export function SimpleLoader() {
	return (
		<div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center">
			<div className="flex flex-col items-center">
				<img
					src="https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif"
					alt="Loading..."
					className="w-32 h-32 rounded-full shadow-2xl mb-4 bg-slate-800"
				/>
				<div className="flex gap-1">
					<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
					<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
					<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
				</div>
			</div>
		</div>
	);
}
