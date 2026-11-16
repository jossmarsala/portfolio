import type { Lang } from "@/context/LanguageContext";
import { PROFILE_PHOTO_URL } from "@/config/profile";
import { RESUME } from "@/data/resumeData";
import "./ResumeSheet.css";

export const A4_WIDTH_PX = 793;
export const A4_HEIGHT_PX = 1122;

interface ResumeSheetProps {
  lang: Lang;
  /** Render eagerly (used for the hidden print copy so the portrait is painted). */
  priority?: boolean;
}

/**
 * Strictly minimalist, premium editorial A4 document.
 * Columns are defined purely through alignment and negative space,
 * with subtle 1px horizontal hairlines separating the main sections.
 */
export function ResumeSheet({ lang, priority = false }: ResumeSheetProps) {
  const data = RESUME[lang];
  const { labels, profile } = data;

  return (
    <article className="resume-sheet" aria-label={`${profile.name} — ${profile.role}`}>
      {/* ── Masthead: name, prominent role, contact & portrait ── */}
      <header className="resume-sheet__masthead">
        <div className="resume-sheet__masthead-copy">
          <h1 className="resume-sheet__name">{profile.name}</h1>
          <p className="resume-sheet__role">{profile.role}</p>

          <nav className="resume-sheet__contact" aria-label="Contact links">
            {data.contact.map((item, index) => (
              <span className="resume-sheet__contact-item" key={item.label}>
                {index > 0 && <span className="resume-sheet__contact-sep">·</span>}
                {item.href ? (
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    {item.value}
                  </a>
                ) : (
                  <span>{item.value}</span>
                )}
              </span>
            ))}
          </nav>
        </div>

        <figure className="resume-sheet__portrait-frame">
          <img
            className="resume-sheet__portrait"
            src={PROFILE_PHOTO_URL}
            alt={`${profile.name} portrait`}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            draggable={false}
          />
        </figure>
      </header>

      <div className="resume-grid">
        {/* ── ABOUT ME ── */}
        <section className="resume-row">
          <h2 className="resume-row__label">{labels.about}</h2>
          <div className="resume-row__content resume-about">
            <p className="resume-about__summary">{data.summary}</p>
          </div>
        </section>

        {/* ── EXPERIENCE ── */}
        <section className="resume-row">
          <h2 className="resume-row__label">{labels.experience}</h2>
          <div className="resume-row__content resume-experience">
            {data.experience.map((entry) => (
              <div
                className="resume-experience__entry"
                key={`${entry.period}-${entry.company}`}
              >
                <span className="resume-date resume-date--experience">
                  {entry.period}
                </span>
                <div className="resume-experience__detail">
                  <div className="resume-experience__header">
                    <span className="resume-experience__company">{entry.company}</span>
                    <span className="resume-experience__role">
                      {" · "}
                      {entry.role}
                      {entry.note && (
                        <span className="resume-experience__location">
                          {" · "}
                          {entry.note}
                        </span>
                      )}
                    </span>
                  </div>
                  <ul className="resume-experience__bullets">
                    {entry.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── EDUCATION & COURSES ── */}
        <section className="resume-row">
          <h2 className="resume-row__label">{labels.education}</h2>
          <div className="resume-row__content resume-education">
            {data.education.map((entry) => (
              <div
                className="resume-education__entry"
                key={`${entry.period}-${entry.title}`}
              >
                <span className="resume-date">{entry.period}</span>
                <div className="resume-education__detail">
                  <p className="resume-education__title">{entry.title}</p>
                  <p className="resume-education__subtitle">{entry.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TECHNICAL SKILLS ── */}
        <section className="resume-row">
          <h2 className="resume-row__label">{labels.skills}</h2>
          <div className="resume-row__content resume-skills">
            {data.skillGroups.map((group) => (
              <div className="resume-skills__group" key={group.label}>
                <h3 className="resume-skills__label">{group.label}</h3>
                <ul className="resume-skills__list">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── ADDITIONAL ── */}
        <section className="resume-row">
          <h2 className="resume-row__label">{labels.additional}</h2>
          <div className="resume-row__content resume-additional">
            <div className="resume-additional__group">
              <h3 className="resume-additional__label">{labels.other}</h3>
              <ul className="resume-additional__list">
                {data.additional.other.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="resume-additional__group">
              <h3 className="resume-additional__label">{labels.recognitions}</h3>
              <ul className="resume-additional__list">
                {data.additional.recognitions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

export default ResumeSheet;
