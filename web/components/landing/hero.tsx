import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
    return (
        <section className="relative overflow-hidden bg-gray-50">
            {/* Subtle gradient accent — no image */}
            <div
                className="absolute inset-0 bg-gradient-to-b from-emerald-50/80 via-transparent to-transparent pointer-events-none"
                aria-hidden
            />
            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl py-20 sm:py-28 lg:py-36 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                        Smart attendance for students and lecturers
                    </h1>
                    <p className="mt-4 text-lg text-gray-600 sm:text-xl max-w-xl mx-auto">
                        QR, face, and geo verification in one streamlined workflow.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/auth/register">
                            <Button
                                className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white"
                                size="lg"
                            >
                                Create an account
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                            <Link href="#what-we-do">Learn more</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
