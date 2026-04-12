import { Suspense } from "react";
import SuccessContent from "./_components/success-content";

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
