import { Card, CardTitle, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Hero() {
    return (
        <div className="relative bg-[url(/hero.jpg)] bg-cover bg-center bg-no-repeat h-[70vh] border-b-4 border-white">
            <div className="absolute inset-0 bg-linear-to-r from-emerald-900 from-30% to-none" />
            <Card className="px-5 py-10 rounded-lg w-full max-w-2xl flex flex-col gap-4 absolute top-1/2 left-1/5 -translate-y-1/2">
                <CardHeader>
                    <CardTitle className="text-4xl font-bold" >Smart Attendance Management for Students and Lecturers</CardTitle>
                </CardHeader>
                < CardContent >
                    <p className="text-gray-600" >
                        Secure and efficient attendance tracking for students and lecturers.
                        QR, face, and geo verification in a streamlined workflow.
                    </p>
                </CardContent>
                < CardFooter className="flex gap-2" >
                    <Button className="bg-emerald-900 hover:bg-emerald-900/90" size={"lg"} > Create an Account </Button>
                    < Button variant="outline" size={"lg"} > Learn More </Button>
                </CardFooter>
            </Card>
        </div>
    );
}