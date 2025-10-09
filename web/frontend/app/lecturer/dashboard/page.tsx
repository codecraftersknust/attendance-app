import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LecturerDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Welcome, Prof.</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <h2 className="font-semibold text-lg">Active Sessions</h2>
                        <p className="text-gray-600">You have 1 session in progress</p>
                        <Button className="mt-3 w-full">View Session</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <h2 className="font-semibold text-lg">Today's Classes</h2>
                        <ul className="list-disc ml-4 text-gray-700">
                            <li>AI Lab - 10 AM</li>
                            <li>Control Systems - 2 PM</li>
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <h2 className="font-semibold text-lg">Quick Actions</h2>
                        <div className="space-y-2">
                            <Button className="w-full">Create New Session</Button>
                            <Button variant="outline" className="w-full">View Reports</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


