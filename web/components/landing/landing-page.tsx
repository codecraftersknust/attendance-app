"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrCode, Camera, MapPin } from "lucide-react";

const STEPS = [
  {
    step: 1,
    title: "Scan QR Code",
    description: "Scan the rotating QR code displayed by your lecturer in class",
    icon: QrCode,
    color: "emerald",
  },
  {
    step: 2,
    title: "Capture Selfie",
    description: "Take a quick selfie for facial verification",
    icon: Camera,
    color: "amber",
  },
  {
    step: 3,
    title: "Verify Location",
    description: "Your location confirms you're in the right place",
    icon: MapPin,
    color: "emerald",
  },
];

export function LandingPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Main content: Hero + Steps side by side - centered in viewport */}
      <section className="flex-1 flex items-center justify-center min-h-0 overflow-y-auto bg-gradient-to-b from-emerald-50/80 via-white to-amber-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center w-full">
            {/* Left: Hero text + single CTA */}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
                Smart attendance for students and lecturers
              </h1>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-gray-600 max-w-xl lg:max-w-none">
                QR, face, and geo verification in one streamlined workflow.
              </p>
              <div className="mt-6 sm:mt-8">
                <Link href="/auth/register" className="block sm:inline-block">
                  <Button
                    variant="primary"
                    className="w-full sm:w-auto px-6 sm:px-8 min-h-[44px] sm:min-h-0"
                    size="lg"
                  >
                    Get Started
                  </Button>
                </Link>
                <p className="mt-4 text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-amber-600 hover:text-amber-700 active:text-amber-800 font-medium transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Right: Steps */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 text-center lg:text-left">
                How it works
              </h2>
              <p className="text-gray-600 text-sm mb-6 sm:mb-8 text-center lg:text-left">
                Three simple steps to mark your attendance securely
              </p>
              <div className="space-y-4 sm:space-y-6">
                {STEPS.map((item) => {
                  const Icon = item.icon;
                  const isAmber = item.color === "amber";
                  return (
                    <div
                      key={item.step}
                      className="flex items-start gap-3 sm:gap-4"
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                          isAmber
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isAmber ? "text-amber-600" : "text-emerald-600"
                          }`}
                        >
                          Step {item.step}
                        </span>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mt-0.5">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-gray-600 text-sm">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - responsive, full width */}
      <footer className="shrink-0 border-t bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <p className="order-2 sm:order-1 text-center sm:text-left">© {new Date().getFullYear()} Absense</p>
            <div className="flex items-center justify-center sm:justify-end gap-4 sm:gap-6 order-1 sm:order-2">
              <Link href="/privacy" className="hover:text-emerald-700 transition-colors min-h-[44px] sm:min-h-0 flex items-center">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-emerald-700 transition-colors min-h-[44px] sm:min-h-0 flex items-center">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
