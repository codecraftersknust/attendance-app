import { Button } from "../ui/button";
import Image from "next/image";

export function Resources() {
    return (
        <div className="bg-linear-to-r from-emerald-900 to-emerald-700 flex justify-center items-center h-auto py-12 sm:py-16 lg:py-20 drop-shadow-xl/50">
            <div className="container text-white flex flex-col lg:flex-row items-center justify-between mx-auto px-4 sm:px-6 lg:px-8 gap-8 lg:gap-12">
                <div className="flex flex-col gap-4 max-w-md text-center lg:text-left">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Resources & Insights</h2>
                    <p className="text-lg sm:text-xl font-medium">
                        Learn more about attendance automation, academic data management, and
                        best practices for digital classrooms.
                    </p>
                    <Button className="mt-4 bg-emerald-600 font-bold hover:bg-emerald-600/90 w-full sm:w-auto" size="lg">Learn More</Button>
                </div>
                <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full lg:w-1/2 text-center">
                    <div className="group">
                        <div className="group-hover:-translate-y-2 transition-translate duration-300 p-4 sm:p-6 bg-transparent border-t-6 border-emerald-200 flex flex-col items-center gap-2">
                            <div className="p-3 sm:p-4 bg-emerald-50 w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-full flex items-center justify-center">
                                <Image className="w-16 h-16 sm:w-20 sm:h-20" src="/paper.svg" alt="Whitepaper" width={100} height={100} />
                            </div>
                            <h3 className="font-semibold text-base sm:text-lg">Whitepaper</h3>
                            <p className="text-sm sm:text-base font-medium">
                                Discover how AI and location services improve attendance accuracy and reduce
                                manual errors by 95%.
                            </p>
                        </div>
                    </div>
                    <div className="group">
                        <div className="group-hover:-translate-y-2 transition-translate duration-300 p-4 sm:p-6 bg-transparent border-t-6 border-emerald-300 flex flex-col items-center gap-2">
                            <div className="p-3 sm:p-4 bg-emerald-100 w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-full flex items-center justify-center">
                                <Image className="w-16 h-16 sm:w-20 sm:h-20" src="/video.svg" alt="Demo Video" width={100} height={100} />
                            </div>
                            <h3 className="font-semibold text-base sm:text-lg">Demo Video</h3>
                            <p className="text-sm sm:text-base font-medium">
                                Watch how lecturers can generate attendance sessions and students check in
                                using facial recognition and QR codes.
                            </p>
                        </div>
                    </div>
                    <div className="group">
                        <div className="group-hover:-translate-y-2 transition-translate duration-300 p-4 sm:p-6 bg-transparent border-t-6 border-emerald-200 flex flex-col items-center gap-2">
                            <div className="p-3 sm:p-4 bg-emerald-50 w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-full flex items-center justify-center">
                                <Image className="w-16 h-16 sm:w-20 sm:h-20" src="/case.svg" alt="Case Study" width={100} height={100} />
                            </div>
                            <h3 className="font-semibold text-base sm:text-lg">Case Study</h3>
                            <p className="text-sm sm:text-base font-medium">
                                Read how a university improved attendance tracking efficiency by 60% using
                                SmartAttend.
                            </p>
                        </div>
                    </div>
                    <div className="group">
                        <div className="group-hover:-translate-y-2 transition-translate duration-300 p-4 sm:p-6 bg-transparent border-t-6 border-emerald-300 flex flex-col items-center gap-2">
                            <div className="p-3 sm:p-4 bg-emerald-100 w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-full flex items-center justify-center">
                                <Image className="w-16 h-16 sm:w-20 sm:h-20" src="/guide.svg" alt="Implementation Guide" width={100} height={100} />
                            </div>
                            <h3 className="font-semibold text-base sm:text-lg">Implementation Guide</h3>
                            <p className="text-sm sm:text-base font-medium">
                                A step-by-step setup guide for IT administrators to deploy Absence on
                                campus infrastructure with minimal effort.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}