import {Inter,JetBrains_Mono,Orbitron,Space_Grotesk,Exo_2,Chakra_Petch} from "next/font/google";
import {ThemeProvider} from "@/components/theme-provider";
import {BackgroundSpace} from "@/components/background-space";
import {CustomCursor} from "@/components/custom-cursor";
import "./globals.css";

const inter=Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const jetbrainsMono=JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
});

const orbitron=Orbitron({
	variable: "--font-orbitron",
	subsets: ["latin"],
});

const spaceGrotesk=Space_Grotesk({
	variable: "--font-space-grotesk",
	subsets: ["latin"],
});

const exo2=Exo_2({
	variable: "--font-exo",
	subsets: ["latin"],
});

const chakraPetch=Chakra_Petch({
	weight: ['300','400','500','600','700'],
	variable: "--font-chakra",
	subsets: ["latin"],
});

export const metadata={
	title: "Course Content Generator | Content Suite",
	description: "Extract Overview, Syllabus, FAQs, Glossary, Resources and Blog Content from your documents. Professional web content generation tool.",
	keywords: "course generator, content generator, DOCX to HTML, blog generator, glossary generator",
	authors: [{name: "Content Suite"}],
	icons: {
		icon: "https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif",
	},
};

export default function RootLayout({children}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${jetbrainsMono.variable} ${orbitron.variable} ${spaceGrotesk.variable} ${exo2.variable} ${chakraPetch.variable} font-sans antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem={false}
					themes={['light','dark','nebula','inferno','toxic','synthwave','aurora']}
					storageKey="content-suite-theme"
				>
					<CustomCursor />
					<BackgroundSpace />
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
