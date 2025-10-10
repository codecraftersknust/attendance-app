import { Card, CardContent } from "@/components/ui/card";
import { Table } from "@/components/ui/table";

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <Card>
                <CardContent>
                    <h2 className="font-semibold mb-3">Recent Attendance Records</h2>
                    <Table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Course</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Verification Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Oct 8</td>
                                <td>CS101</td>
                                <td>45</td>
                                <td>5</td>
                                <td>98%</td>
                            </tr>
                            <tr>
                                <td>Oct 7</td>
                                <td>EE205</td>
                                <td>38</td>
                                <td>7</td>
                                <td>96%</td>
                            </tr>
                        </tbody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}


