"use client";
export function QRScanner({ onSuccess }: { onSuccess: () => void }) {
    return (
        <div className="text-center space-y-4 p-4">
            <p className="text-gray-700 text-sm sm:text-base">Scan the QR code displayed by your lecturer.</p>
            <div className="w-full max-w-xs sm:max-w-sm mx-auto aspect-square bg-gray-200 rounded-md flex items-center justify-center">
                <p className="text-sm sm:text-base">QR Scanner Mock</p>
            </div>
            <button
                onClick={onSuccess}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm sm:text-base w-full sm:w-auto"
            >
                Simulate Scan
            </button>
        </div>
    );
}