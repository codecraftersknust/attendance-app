"use client";

import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import { useEffect } from "react";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { start } = useTopLoader();

    useEffect(() => {
        if (!loading && user) {
            start();
            router.replace("/dashboard");
        }
    }, [user, loading, router, start]);

    if (!loading && user) {
        return null;
    }

    return (
        <div className="bg-linear-to-t from-emerald-900 to-emerald-700 flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-4xl">
                <LoginForm />
            </div>
        </div>
    )
}
