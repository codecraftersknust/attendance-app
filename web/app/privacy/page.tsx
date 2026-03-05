import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
                    <p className="mt-2 text-gray-600">
                        Last updated: March 2, 2025
                    </p>
                </div>

                <p className="text-gray-700 leading-relaxed">
                    Absense (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the Absense attendance verification platform for educational institutions. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web and mobile applications. By using our services, you agree to the collection and use of information in accordance with this policy.
                </p>

                {/* Section 1 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900">1. Information We Collect</h2>
                    <p className="mt-2 text-gray-700">
                        We collect information that you provide directly to us and information that is automatically collected when you use our services.
                    </p>
                    <h3 className="mt-4 text-base font-medium text-gray-900">Account Information</h3>
                    <ul className="mt-2 list-disc pl-6 text-gray-700 space-y-1">
                        <li>Email address</li>
                        <li>Full name</li>
                        <li>User or student ID (as assigned by your institution)</li>
                        <li>Password (stored in encrypted form)</li>
                        <li>Role (student, lecturer, or administrator)</li>
                        <li>For students: year, programme, and course enrollments</li>
                    </ul>
                    <h3 className="mt-4 text-base font-medium text-gray-900">Verification and Attendance Data</h3>
                    <ul className="mt-2 list-disc pl-6 text-gray-700 space-y-1">
                        <li>Face reference image (for facial verification during attendance)</li>
                        <li>Device identifiers (hashed) for device binding</li>
                        <li>Attendance records: QR scan timestamps, session IDs, geolocation (when required)</li>
                        <li>Verification logs: face match results, geofence compliance</li>
                    </ul>
                    <h3 className="mt-4 text-base font-medium text-gray-900">Automatically Collected Information</h3>
                    <ul className="mt-2 list-disc pl-6 text-gray-700 space-y-1">
                        <li>IP address and device type</li>
                        <li>Usage data (e.g., pages visited, features used)</li>
                        <li>Log data (e.g., access times, error logs)</li>
                    </ul>
                </section>

                {/* Section 2 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900">2. How We Use Your Information</h2>
                    <p className="mt-2 text-gray-700">
                        We use the information we collect to:
                    </p>
                    <ul className="mt-2 list-disc pl-6 text-gray-700 space-y-1">
                        <li>Provide, maintain, and improve our attendance verification services</li>
                        <li>Authenticate users and enforce security measures (e.g., device binding, face verification)</li>
                        <li>Process attendance records and generate reports for lecturers and administrators</li>
                        <li>Prevent fraud and ensure the integrity of attendance data</li>
                        <li>Communicate with you about service updates, security alerts, and support</li>
                        <li>Comply with legal obligations and institutional requirements</li>
                        <li>Analyze usage patterns to improve reliability and user experience</li>
                    </ul>
                </section>

                {/* Section 3 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900">3. Information Sharing and Disclosure</h2>
                    <p className="mt-2 text-gray-700">
                        We do not sell your personal information. We may share your information in the following circumstances:
                    </p>
                    <ul className="mt-2 list-disc pl-6 text-gray-700 space-y-1">
                        <li><strong>With your institution:</strong> Attendance data, enrollment information, and verification results may be shared with lecturers and administrators at your school or university.</li>
                        <li><strong>Service providers:</strong> We may use third-party services (e.g., hosting, storage) that process data on our behalf under strict confidentiality agreements.</li>
                        <li><strong>Legal requirements:</strong> We may disclose information when required by law, court order, or government request.</li>
                        <li><strong>Protection of rights:</strong> We may disclose information to protect our rights, your safety, or the safety of others.</li>
                    </ul>
                </section>

                {/* Section 4 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900">4. Data Retention</h2>
                    <p className="mt-2 text-gray-700">
                        We retain your data for as long as your account is active and as needed to provide our services. When you request account deletion, we permanently remove your account and associated data within 30 days. Anonymized audit logs may be retained for up to 90 days for security and compliance purposes. Backup copies may retain deleted data for up to 30 days before permanent purging.
                    </p>
                </section>

                {/* Section 5 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900">5. Your Rights and Choices</h2>
                    <p className="mt-2 text-gray-700">
                        Depending on your location and applicable law, you may have the right to:
                    </p>
                    <ul className="mt-2 list-disc pl-6 text-gray-700 space-y-1">
                        <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                        <li><strong>Correction:</strong> Update or correct inaccurate information through your profile settings</li>
                        <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                        <li><strong>Portability:</strong> Request a copy of your data in a portable format (where applicable)</li>
                        <li><strong>Objection:</strong> Object to certain processing of your data</li>
                        <li><strong>Withdraw consent:</strong> Withdraw consent where processing is based on consent</li>
                    </ul>
                    <p className="mt-4 text-gray-700">
                        To request account deletion, visit our{' '}
                        <Link href="/delete-account" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                            Delete Account
                        </Link> page
                        {' '}for the steps to request deletion of your account and associated data.
                    </p>
                </section>

                {/* Section 6 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900">6. Security</h2>
                    <p className="mt-2 text-gray-700">
                        We implement industry-standard security measures to protect your data, including encryption in transit (TLS/HTTPS), hashed passwords, and secure storage of sensitive information. Face reference images and verification data are stored in secure, access-controlled environments. Despite our efforts, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
                    </p>
                </section>

                {/* Section 7 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900">7. Children&apos;s Privacy</h2>
                    <p className="mt-2 text-gray-700">
                        Our services are intended for use by students, lecturers, and administrators within educational institutions. If you are under the age of 13 (or the applicable age of consent in your jurisdiction), your use of Absense may be subject to your institution&apos;s policies and parental consent. We do not knowingly collect personal information from children under 13 without appropriate consent.
                    </p>
                </section>

                {/* Section 8 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900">8. International Data Transfers</h2>
                    <p className="mt-2 text-gray-700">
                        Your information may be processed in countries other than your country of residence. We take appropriate safeguards to ensure that your data receives an adequate level of protection in accordance with applicable data protection laws.
                    </p>
                </section>

                {/* Section 9 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900">9. Changes to This Policy</h2>
                    <p className="mt-2 text-gray-700">
                        We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date. Your continued use of our services after such changes constitutes acceptance of the updated policy. We encourage you to review this policy periodically.
                    </p>
                </section>

                {/* Section 10 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900">10. Contact Us</h2>
                    <p className="mt-2 text-gray-700">
                        If you have questions about this Privacy Policy or wish to exercise your rights, please contact your institution&apos;s Absense administrator or support team. For general inquiries about Absense, you may reach out through the support channels provided by your institution.
                    </p>
                </section>

                {/* Footer links */}
                <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
                    <Link href="/delete-account" className="text-emerald-600 hover:text-emerald-700">
                        Request Account Deletion
                    </Link>
                    <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">
                        Terms of Service
                    </Link>
                    <Link href="/" className="text-emerald-600 hover:text-emerald-700">
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
