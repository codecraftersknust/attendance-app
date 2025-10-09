export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

            <p className="text-gray-700">
                This Privacy Policy explains how Absence collects, uses, and protects your information
                when you use our attendance platform. By using our services, you agree to the
                collection and use of information in accordance with this policy.
            </p>

            <h2 className="text-xl font-semibold">Information We Collect</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Account details such as name, email, and role.</li>
                <li>Attendance artifacts such as QR scan events, timestamps, and session IDs.</li>
                <li>Optional verification data such as geolocation bounds and selfie matches.</li>
            </ul>

            <h2 className="text-xl font-semibold">How We Use Information</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Provide and secure attendance features for students and lecturers.</li>
                <li>Improve reliability, prevent fraud, and analyze product usage.</li>
                <li>Communicate updates and support information.</li>
            </ul>

            <h2 className="text-xl font-semibold">Data Retention</h2>
            <p className="text-gray-700">
                We retain data for as long as necessary to provide the service and to comply with
                legal obligations. You can request deletion of your account data subject to
                applicable requirements.
            </p>

            <h2 className="text-xl font-semibold">Your Choices</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Access, update, or delete your account information.</li>
                <li>Control location permissions in your browser or device settings.</li>
                <li>Opt out of non-essential communications.</li>
            </ul>

            <h2 className="text-xl font-semibold">Contact Us</h2>
            <p className="text-gray-700">
                If you have questions about this policy, contact us via the Support page.
            </p>
        </div>
    );
}


