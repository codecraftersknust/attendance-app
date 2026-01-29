"use client";
export function GeoCheck({ onVerified }: { onVerified: () => void }) {
    return (
        <div className="text-center space-y-3">
            <p className="text-gray-700">Checking your location...</p>
            <div className="w-48 h-48 bg-gray-200 rounded-md flex items-center justify-center">
                <p>Geo Check Mock</p>
            </div>
            <button
                onClick={onVerified}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
                Simulate Location Verified
            </button>
        </div>
    );
}