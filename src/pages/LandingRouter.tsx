import { useCompany } from "@/hooks/useCompany";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";

const LandingLancamento = lazy(() => import("./franqueado/LandingLancamento"));
const LandingPromax = lazy(() => import("./promax/LandingPromax"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

/**
 * Routes to the correct landing page based on the resolved company.
 * Resolution order in CompanyProvider:
 * 1. Hostname (production domains)
 * 2. ?brand=slug query param (dev/preview)
 * 3. sessionStorage persisted slug
 * 4. Authenticated user's company
 * 5. Default (Injediesel)
 */
export default function LandingRouter() {
  const { company, isLoading } = useCompany();

  if (isLoading) return <PageLoader />;

  const slug = company?.slug ?? "injediesel";

  return (
    <Suspense fallback={<PageLoader />}>
      {slug === "promax-tuner" ? <LandingPromax /> : <LandingLancamento />}
    </Suspense>
  );
}
