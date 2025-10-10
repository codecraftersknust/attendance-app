import { Button } from "../ui/button";

export function CTA() {
    return (
        <div className="bg-white flex justify-center items-center h-auto py-20">
            <div className="z-10 max-w-7xl mx-auto text-center gap-4 flex flex-col">
                <h1 className="text-4xl font-bold">Ready to get started?</h1>
                <p className="text-lg">
                    Upgrade from paper sheets to intelligent attendance tracking powered by
                    <span className="font-bold text-emerald-900"> Biometrics, AI, and authentication.</span>
                </p>
                <div className="flex items-center justify-center gap-8 mt-4">
                    <Button className="bg-emerald-900 hover:bg-emerald-900/90" size="lg">Learn More</Button>
                    <Button variant="outline" size={"lg"}>Create an Account</Button>
                </div>
            </div>
        </div>
    );
}