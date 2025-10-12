import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                        <Link href="/">
                            <span className="inline-flex items-center gap-2 font-semibold text-lg">
                                Absence
                            </span>
                        </Link>
                        <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
                            Smart attendance management for students and lecturers - QR, face, and geo verification in a streamlined workflow.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><Link href="/getting-started" className="hover:text-gray-900 transition-colors">Getting Started</Link></li>
                            <li><Link href="/instructor-resources" className="hover:text-gray-900 transition-colors">Instructor Resources</Link></li>
                            <li><Link href="/support" className="hover:text-gray-900 transition-colors">Support & Help</Link></li>
                            <li><Link href="/about" className="hover:text-gray-900 transition-colors">About</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">For Roles</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><Link href="/student/dashboard" className="hover:text-gray-900 transition-colors">Students</Link></li>
                            <li><Link href="/lecturer/dashboard" className="hover:text-gray-900 transition-colors">Lecturers</Link></li>
                            <li><Link href="/lecturer/reports" className="hover:text-gray-900 transition-colors">Reports</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link></li>
                            <li><Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="border-t">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
                    <p>© {new Date().getFullYear()} Absence. All rights reserved.</p>
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
                        <span className="text-emerald-900">•</span>
                        <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
                        <span className="text-emerald-900">•</span>
                        <Link href="/sitemap.xml" className="hover:text-gray-900 transition-colors">Sitemap</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}