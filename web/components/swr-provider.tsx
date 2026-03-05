"use client";

import { SWRConfig } from "swr";

const swrOptions = {
  revalidateOnFocus: false,
  dedupingInterval: 30000, // 30 seconds - avoid duplicate requests
  revalidateIfStale: true,
  keepPreviousData: true,
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrOptions}>{children}</SWRConfig>;
}
