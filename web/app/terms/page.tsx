export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

            <p className="text-gray-700">
                These Terms govern your use of the Absense platform. By accessing or using the
                service, you agree to be bound by these Terms.
            </p>

            <h2 className="text-xl font-semibold">Use of Service</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>You are responsible for maintaining the confidentiality of your account.</li>
                <li>Do not misuse the service or interfere with other users.</li>
                <li>Comply with applicable laws and institutional policies.</li>
            </ul>

            <h2 className="text-xl font-semibold">Accounts and Access</h2>
            <p className="text-gray-700">
                Roles such as student and lecturer determine available features. We may suspend or
                terminate access for violations of these Terms.
            </p>

            <h2 className="text-xl font-semibold">Limitation of Liability</h2>
            <p className="text-gray-700">
                To the maximum extent permitted by law, Absense is not liable for indirect or
                consequential damages arising from your use of the service.
            </p>

            <h2 className="text-xl font-semibold">Changes</h2>
            <p className="text-gray-700">
                We may update these Terms. Continued use of the service after changes constitutes
                acceptance of the updated Terms.
            </p>

            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-gray-700">
                For questions regarding these Terms, contact us via the Support page.
            </p>
        </div>
    );
}


