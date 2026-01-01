"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card,CardContent,CardDescription,CardFooter,CardHeader,CardTitle} from "@/components/ui/card";
import {authenticate} from "@/lib/auth";
import {Lock} from "lucide-react";

export function LoginScreen({onLogin}) {
	const [username,setUsername]=useState("");
	const [password,setPassword]=useState("");
	const [error,setError]=useState("");

	const handleSubmit=(e) => {
		e.preventDefault();
		setError("");
		const user=authenticate(username,password);
		if(user) {
			onLogin(user);
		} else {
			setError("Invalid credentials. Please try again.");
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md animate-in-card">
				<CardHeader className="space-y-1">
					<div className="flex justify-center mb-4">
						<div className="rounded-full bg-primary/10 p-3">
							<Lock className="h-6 w-6 text-primary" />
						</div>
					</div>
					<CardTitle className="text-2xl font-bold text-center">Sign in to Content Suite</CardTitle>
					<CardDescription className="text-center">
						Enter your credentials to access the generators
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								placeholder="admin"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								autoCapitalize="none"
								autoCorrect="off"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						{error&&(
							<div className="text-sm text-red-500 font-medium text-center">
								{error}
							</div>
						)}
					</CardContent>
					<CardFooter>
						<Button className="w-full mt-4" type="submit">
							Sign In
						</Button>
						{/* Hardcoded hints for demo purposes */}
						<div className="mt-4 text-xs text-center text-muted-foreground w-full hidden">
							<p>Demo Credentials (User / Pass):</p>
							<p>Admin: admin / Bilal@7</p>
							<p>Blog: blog / Blog@123</p>
							<p>Content: content / content@123</p>
						</div>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
