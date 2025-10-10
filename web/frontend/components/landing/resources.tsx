import { Button } from "../ui/button";
import Image from "next/image";

export function Resources() {
    return (
        <div className="bg-linear-to-r from-emerald-900 to-emerald-700 flex justify-center items-center h-auto py-20 drop-shadow-xl/50">
            <div className="container text-white flex items-center justify-between mx-auto">
                <div className="flex flex-col gap-4 max-w-md">
                    <h2 className="text-4xl font-bold">Resources & Insights</h2>
                    <p className="text-xl font-medium">
                        Learn more about attendance automation, academic data management, and
                        best practices for digital classrooms.
                    </p>
                    <Button className="mt-4 bg-emerald-600 font-bold hover:bg-emerald-600/90" size="lg">Learn More</Button>
                </div>
                <div className="grid gap-8 md:grid-cols-4 mt-4 w-1/2 text-center">
                    <div className="group">
                        <div className="group-hover:-translate-y-2 transition-translate duration-300 p-6 bg-transparent border-t-6 border-emerald-200 flex flex-col items-center gap-2">
                            <div className="p-4 bg-emerald-50 w-24 h-24 mb-4 rounded-full flex items-center justify-center">
                                <Image className="w-20 h-20" src="/paper.svg" alt="Whitepaper" width={100} height={100} />
                            </div>
                            <h3 className="font-semibold text-lg">Whitepaper</h3>
                            <p className="text-base font-medium">
                                Discover how AI and location services improve attendance accuracy and reduce
                                manual errors by 95%.
                            </p>
                        </div>
                    </div>
                    <div className="group">
                        <div className="group-hover:-translate-y-2 transition-translate duration-300 p-6 bg-transparent border-t-6 border-emerald-300 flex flex-col items-center gap-2">
                            <div className="p-4 bg-emerald-100 w-24 h-24 mb-4 rounded-full flex items-center justify-center">
                                <Image className="w-20 h-20" src="/video.svg" alt="Demo Video" width={100} height={100} />
                            </div>
                            <h3 className="font-semibold text-lg">Demo Video</h3>
                            <p className="text-base font-medium">
                                Watch how lecturers can generate attendance sessions and students check in
                                using facial recognition and QR codes.
                            </p>
                        </div>
                    </div>
                    <div className="group">
                        <div className="group-hover:-translate-y-2 transition-translate duration-300 p-6 bg-transparent border-t-6 border-emerald-200 flex flex-col items-center gap-2">
                            <div className="p-4 bg-emerald-50 w-24 h-24 mb-4 rounded-full flex items-center justify-center">
                                <Image className="w-20 h-20" src="/case.svg" alt="Case Study" width={100} height={100} />
                            </div>
                            <h3 className="font-semibold text-lg">Case Study</h3>
                            <p className="text-base font-medium">
                                Read how a university improved attendance tracking efficiency by 60% using
                                SmartAttend.
                            </p>
                        </div>
                    </div>
                    <div className="group">
                        <div className="group-hover:-translate-y-2 transition-translate duration-300 p-6 bg-transparent border-t-6 border-emerald-300 flex flex-col items-center gap-2">
                            <div className="p-4 bg-emerald-100 w-24 h-24 mb-4 rounded-full flex items-center justify-center">
                                <Image className="w-20 h-20" src="/guide.svg" alt="Implementation Guide" width={100} height={100} />
                            </div>
                            <h3 className="font-semibold text-lg">Implementation Guide</h3>
                            <p className="text-base font-medium">
                                A step-by-step setup guide for IT administrators to deploy SmartAttend on
                                campus infrastructure with minimal effort.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}