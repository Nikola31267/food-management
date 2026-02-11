import { Suspense } from "react";
import DailyOrdersPage from "./Table";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <DailyOrdersPage />
    </Suspense>
  );
}
