import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <h2 className="font-semibold text-lg">Next Class</h2>
                        <p className="text-gray-600">CS101 - Intro to AI</p>
                        <Button className="mt-3 w-full">Mark Attendance</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <h2 className="font-semibold text-lg">Attendance Rate</h2>
                        <p className="text-4xl font-bold text-green-600">92%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <h2 className="font-semibold text-lg">Upcoming Sessions</h2>
                        <ul className="list-disc ml-4 text-gray-700">
                            <li>10 AM - Data Structures</li>
                            <li>2 PM - Robotics Lab</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


