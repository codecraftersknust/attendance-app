import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t bg-white">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-3">
                        <Link href="/">
                            <span className="inline-flex items-center gap-2 font-semibold text-lg">
                                Absence
                            </span>
                        </Link>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Smart attendance management for students and lecturers - QR, face, and geo verification in a streamlined workflow.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">Product</h4>
                        <ul className="mt-3 space-y-2 text-sm text-gray-600">
                            <li><Link href="/getting-started" className="hover:text-gray-900">Getting Started</Link></li>
                            <li><Link href="/instructor-resources" className="hover:text-gray-900">Instructor Resources</Link></li>
                            <li><Link href="/support" className="hover:text-gray-900">Support & Help</Link></li>
                            <li><Link href="/about" className="hover:text-gray-900">About</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">For Roles</h4>
                        <ul className="mt-3 space-y-2 text-sm text-gray-600">
                            <li><Link href="/student/dashboard" className="hover:text-gray-900">Students</Link></li>
                            <li><Link href="/lecturer/dashboard" className="hover:text-gray-900">Lecturers</Link></li>
                            <li><Link href="/lecturer/reports" className="hover:text-gray-900">Reports</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">Company</h4>
                        <ul className="mt-3 space-y-2 text-sm text-gray-600">
                            <li><Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-gray-900">Terms of Service</Link></li>
                            <li><Link href="/contact" className="hover:text-gray-900">Contact</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="border-t">
                <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
                    <p>© {new Date().getFullYear()} Absence. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
                        <span className="text-emerald-900">•</span>
                        <Link href="/terms" className="hover:text-gray-900">Terms</Link>
                        <span className="text-emerald-900">•</span>
                        <Link href="/sitemap.xml" className="hover:text-gray-900">Sitemap</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}