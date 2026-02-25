import { Navbar } from "@/components/landing/navbar";
import { LandingPage } from "@/components/landing/landing-page";

export default function Home() {
	return (
		<div className="h-screen flex flex-col overflow-hidden">
			<Navbar />
			<LandingPage />
		</div>
	);
}
