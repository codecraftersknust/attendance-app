import { Button } from "../ui/button";

export function CTA() {
    return (
        <div className="bg-white flex justify-center items-center h-auto py-12 sm:py-16 lg:py-20">
            <div className="z-10 max-w-7xl mx-auto text-center gap-4 flex flex-col px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Ready to get started?</h1>
                <p className="text-base sm:text-lg">
                    Upgrade from paper sheets to intelligent attendance tracking powered by
                    <span className="font-bold text-emerald-900"> Biometrics, AI, and authentication.</span>
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-4">
                    <Button className="bg-emerald-900 hover:bg-emerald-900/90 w-full sm:w-auto" size="lg">Learn More</Button>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">Create an Account</Button>
                </div>
            </div>
        </div>
    );
}