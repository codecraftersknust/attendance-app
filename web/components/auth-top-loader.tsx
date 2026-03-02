"use client";

import { useEffect } from "react";
import { useTopLoader } from "nextjs-toploader";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Syncs auth loading state with the top loader so it shows during
 * initial auth check and login/register flows.
 */
export function AuthTopLoader() {
    const { loading } = useAuth();
    const { start, done } = useTopLoader();

    useEffect(() => {
        if (loading) {
            start();
        } else {
            done();
        }
    }, [loading, start, done]);

    return null;
}
