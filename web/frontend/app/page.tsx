import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { WhatWeDo } from "@/components/landing/what-we-do";
import { MeasureWhatMatters } from "@/components/landing/measure-what-matters";
import { Benefits } from "@/components/landing/benefits";
import { CTA } from "@/components/landing/cta";
import { Resources } from "@/components/landing/resources";

export default function Home() {
	return (
		<>
			<Navbar />
			<Hero />
			<WhatWeDo />
			<MeasureWhatMatters />
			<Benefits />
			<CTA />
			<Resources />
			<Footer />
		</>
	);
}
