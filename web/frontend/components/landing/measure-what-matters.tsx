import Image from "next/image";
import { Button } from "../ui/button";

export function MeasureWhatMatters() {
    return (
        <div className="relative bg-[url(/measure.jpg)] bg-cover bg-center bg-no-repeat h-[70vh] flex justify-center items-center py-20 border-b-4 border-white">
            <div className="absolute inset-0 bg-black/50" />
            <div className="z-10 max-w-7xl mx-auto text-white text-center gap-4 flex flex-col">
                <h1 className="text-4xl font-bold">Measure What Matters</h1>
                <p className="text-xl font-medium">
                    Leverage real-time analytics to gain comprehensive insights into individual student and classroom engagement and progress.
                </p>
                <div className="flex justify-between gap-8 mt-10">
                    <div className="text-left max-w-md">
                        <p className="text-lg">
                            The dashboard provides actionable insights, simplifying the process of identifying improvement areas, pinpointing
                            students in need of extra support, and enabling informed decisions to ensure every learner’s success.
                        </p>
                        <Button className="mt-4 bg-emerald-900 hover:bg-emerald-900/90" size="lg">Learn More</Button>
                    </div>
                    <div>
                        <Image className="rounded-lg w-full object-cover object-center" src="/student_analytics.webp" alt="Board" width={500} height={500} />
                    </div>
                </div>
            </div>
        </div>
    );
}