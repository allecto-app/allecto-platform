import { Suspense } from "react";
import { SignupFlow } from "../../src/components/onboarding/SignupFlow";

function OnboardingContent() {
  return <SignupFlow />;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-600">Carregando...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
