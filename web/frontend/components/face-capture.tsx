"use client";
export function FaceCapture({ onCaptured }: { onCaptured: () => void }) {
    return (
        <div className="text-center space-y-3">
            <p className="text-gray-700">Capture your face to verify identity.</p>
            <div className="w-48 h-48 bg-gray-200 rounded-md flex items-center justify-center">
                <p>Face Capture Mock</p>
            </div>
            <button
                onClick={onCaptured}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
                Simulate Capture
            </button>
        </div>
    );
}