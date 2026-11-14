import { lazy, Suspense } from "react";
import { Navigate, useParams } from "react-router-dom";
import RouteFallback from "@/components/ui/RouteFallback";
import NotFoundPage from "@/pages/NotFoundPage";
import { getProject } from "@/config/projects";

const ProjectPage = lazy(() => import("@/pages/ProjectPage"));

export function ProjectRoute() {
  return (
    <Suspense
      fallback={<RouteFallback variant="overlay" label="loading case study" />}
    >
      <ProjectPage />
    </Suspense>
  );
}

/** Preserves old /project/:slug links. */
export function LegacyProjectRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const project = getProject(slug);
  if (!project) return <NotFoundPage />;
  return <Navigate to={`/projects/${project.slug}`} replace />;
}

/** Preserves old root-level /:slug links (e.g. /misu). */
export function LegacySlugRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const project = getProject(slug);
  if (!project) return <NotFoundPage />;
  return <Navigate to={`/projects/${project.slug}`} replace />;
}
