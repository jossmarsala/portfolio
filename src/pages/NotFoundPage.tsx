import { Link } from "react-router-dom";
import { useSeo } from "@/lib/seo";
import "./NotFoundPage.css";

export function NotFoundPage() {
  useSeo({
    title: "Page not found — Jos Marsala",
    description:
      "This page does not exist. Return to the selected work and case studies.",
    noindex: true,
  });

  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <span className="not-found__code" aria-hidden="true">
        404
      </span>
      <h1 id="not-found-title" className="not-found__title">
        this page doesn't exist.
      </h1>
      <p className="not-found__copy">
        The case study may have moved, or the link was mistyped.
      </p>
      <Link className="not-found__link" to="/">
        <span className="not-found__bracket">[</span>
        back to work
        <span className="not-found__bracket">]</span>
      </Link>
    </section>
  );
}

export default NotFoundPage;
