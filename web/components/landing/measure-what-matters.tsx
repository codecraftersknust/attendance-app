import Image from "next/image";
import { Button } from "../ui/button";

export function MeasureWhatMatters() {
    return (
        <div className="relative bg-[url(/measure.jpg)] bg-cover bg-center bg-no-repeat h-auto sm:h-[70vh] flex justify-center items-center py-12 sm:py-16 lg:py-20 drop-shadow-xl/50">
            <div className="absolute inset-0 bg-black/50" />
            <div className="z-10 max-w-7xl mx-auto text-white text-center gap-4 flex flex-col px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Measure What Matters</h1>
                <p className="text-lg sm:text-xl font-medium">
                    Leverage real-time analytics to gain comprehensive insights into individual student and classroom engagement and progress.
                </p>
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8 mt-8 lg:mt-10">
                    <div className="text-left max-w-md lg:flex-1">
                        <p className="text-base sm:text-lg">
                            The dashboard provides actionable insights, simplifying the process of identifying improvement areas, pinpointing
                            students in need of extra support, and enabling informed decisions to ensure every learner's success.
                        </p>
                        <Button className="mt-4 bg-emerald-900 hover:bg-emerald-900/90 w-full sm:w-auto" size="lg">Learn More</Button>
                    </div>
                    <div className="lg:flex-1 flex justify-center">
                        <Image
                            className="rounded-lg w-full max-w-md lg:max-w-lg object-cover object-center"
                            src="/student_analytics.webp"
                            alt="Student Analytics Dashboard"
                            width={500}
                            height={500}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}