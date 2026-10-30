"use client";

import { TrackerPage } from "@/components/smart/tracker-page";
import { TrackerProvider } from "@/context/tracker-context";

export default function Home() {
  return (
    <TrackerProvider>
      <TrackerPage />
    </TrackerProvider>
  );
}
