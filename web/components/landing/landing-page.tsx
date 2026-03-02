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
      <section className="relative flex-1 flex items-center justify-center min-h-0 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-emerald-100 via-teal-50/90 to-amber-100/80 pt-[env(safe-area-inset-top)] scroll-pt-16">
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, #0f766e 1px, transparent 1px),
              linear-gradient(to bottom, #0f766e 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0 pt-5 pb-6 sm:pt-6 sm:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 lg:gap-16 items-center w-full min-w-0">
            {/* Left: Hero text + single CTA */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-medium mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Smart verification
              </div>
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
                <p className="mt-4 text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-amber-600 hover:text-amber-700 active:text-amber-800 font-medium transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Right: Steps - card container */}
            <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 shadow-xl p-4 sm:p-8 min-w-0">
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
                        className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm ${
                          isAmber
                            ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200/50"
                            : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/50"
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

      {/* Footer - compact, single line, centered */}
      <footer className="shrink-0 w-full border-t border-emerald-200/60 bg-gradient-to-r from-emerald-900 to-teal-900 text-white pb-[env(safe-area-inset-bottom)] text-center">
        <div className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
          <span className="text-xs">
            © {new Date().getFullYear()} Absense
          </span>
          <span className="mx-2 sm:mx-3 opacity-70">·</span>
          <Link href="/privacy" className="text-xs hover:text-white/90 transition-colors inline">
            Privacy
          </Link>
          <span className="mx-2 sm:mx-3 opacity-70">·</span>
          <Link href="/terms" className="text-xs hover:text-white/90 transition-colors inline">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
