/**
 * Canonical programme list fetched from the backend (single source of truth),
 * falling back to the bundled list while loading or offline.
 * "General" is a catch-all for courses, not a real programme, so it is
 * hidden from pickers.
 */
import { useEffect, useState } from 'react';
import apiClient from '@/services/api';
import { PROGRAMMES } from '@/lib/programmes';

const FALLBACK: string[] = [...PROGRAMMES];

export function useProgrammes(): string[] {
    const [programmes, setProgrammes] = useState<string[]>(FALLBACK);

    useEffect(() => {
        let cancelled = false;
        apiClient
            .get<string[]>('/auth/programmes')
            .then((res) => {
                if (!cancelled && Array.isArray(res.data) && res.data.length > 0) {
                    setProgrammes(res.data.filter((p) => p !== 'General'));
                }
            })
            .catch(() => {
                // Offline or older backend — keep the bundled fallback
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return programmes;
}
