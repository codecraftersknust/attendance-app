"use client";

import useSWR from "swr";
import { apiClient } from "@/lib/api";
import { PROGRAMMES } from "@/lib/programmes";

/**
 * Canonical programme list fetched from the backend (single source of truth),
 * falling back to the bundled list while loading or offline.
 * "General" is a catch-all for courses, not a real programme, so it is
 * hidden from dropdowns.
 */
export function useProgrammes(): string[] {
    const { data } = useSWR("programmes", () => apiClient.listProgrammes(), {
        dedupingInterval: 3_600_000,
        revalidateOnFocus: false,
    });
    const list = data && data.length > 0 ? data : [...PROGRAMMES];
    return list.filter((p) => p !== "General");
}
