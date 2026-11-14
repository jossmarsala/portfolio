import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProjectView from "@/components/ProjectView";
import RouteFallback from "@/components/ui/RouteFallback";
import NotFoundPage from "@/pages/NotFoundPage";
import { getDirectLinkUrl, getProject } from "@/config/projects";

/**
 * Case-study route. The entire ProjectView tree (GSAP timelines, gallery,
 * footer) lives in this lazily-loaded chunk.
 */
export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const project = getProject(slug);
  const directLink = project ? getDirectLinkUrl(project.slug) : null;

  // Projects temporarily pointing at their live site keep the old behaviour.
  useEffect(() => {
    if (directLink) window.location.replace(directLink);
  }, [directLink]);

  if (!project) {
    return <NotFoundPage />;
  }

  if (directLink) {
    return <RouteFallback variant="overlay" label="redirecting" />;
  }

  const handleSelectProject = (nextSlug: string) => {
    const external = getDirectLinkUrl(nextSlug);
    if (external) {
      window.open(external, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(`/projects/${nextSlug}`);
  };

  return (
    <ProjectView
      key={project.slug}
      project={project}
      onClose={() => navigate("/", { state: { scrollTo: "work" } })}
      onProjectSelect={handleSelectProject}
    />
  );
}
