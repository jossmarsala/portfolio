import { Link } from "react-router-dom";
import { useLang } from "@/context/LanguageContext";
import { useSeo } from "@/lib/seo";
import "./NotFoundPage.css";

export function NotFoundPage() {
  const { t } = useLang();

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
        {t("not_found_title")}
      </h1>
      <p className="not-found__copy">{t("not_found_copy")}</p>
      <Link className="not-found__link" to="/">
        <span className="not-found__bracket">[</span>
        {t("not_found_back")}
        <span className="not-found__bracket">]</span>
      </Link>
    </section>
  );
}

export default NotFoundPage;
