"use client";
export function QRScanner({ onSuccess }: { onSuccess: () => void }) {
    return (
        <div className="text-center space-y-3">
            <p className="text-gray-700">Scan the QR code displayed by your lecturer.</p>
            <div className="w-48 h-48 bg-gray-200 rounded-md flex items-center justify-center">
                <p>QR Scanner Mock</p>
            </div>
            <button
                onClick={onSuccess}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
                Simulate Scan
            </button>
        </div>
    );
}