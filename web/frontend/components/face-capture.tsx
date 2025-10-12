"use client";
export function FaceCapture({ onCaptured }: { onCaptured: () => void }) {
    return (
        <div className="text-center space-y-4 p-4">
            <p className="text-gray-700 text-sm sm:text-base">Capture your face to verify identity.</p>
            <div className="w-full max-w-xs sm:max-w-sm mx-auto aspect-square bg-gray-200 rounded-md flex items-center justify-center">
                <p className="text-sm sm:text-base">Face Capture Mock</p>
            </div>
            <button
                onClick={onCaptured}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm sm:text-base w-full sm:w-auto"
            >
                Simulate Capture
            </button>
        </div>
    );
}