import { Card, CardTitle, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Hero() {
    return (
        <div className="relative bg-[url(/hero.jpg)] bg-cover bg-center bg-no-repeat h-[60vh] sm:h-[70vh] border-b-4 border-white">
            <div className="absolute inset-0 bg-linear-to-r from-emerald-900 from-30% to-none" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                <Card className="z-10 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 rounded-lg w-full max-w-2xl flex flex-col gap-4">
                    <CardHeader className="px-0">
                        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                            Smart Attendance Management for Students and Lecturers
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <p className="text-gray-600 text-sm sm:text-base">
                            Secure and efficient attendance tracking for students and lecturers.
                            QR, face, and geo verification in a streamlined workflow.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4 px-0">
                        <Button className="bg-emerald-900 hover:bg-emerald-900/90 w-full sm:w-auto" size="lg">
                            Create an Account
                        </Button>
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                            Learn More
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}