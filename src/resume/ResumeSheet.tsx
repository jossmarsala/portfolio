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
 * Calm, reference-style A4 resume: name/photo/contact masthead, a quiet
 * left-hand section rail and dense, readable content columns.
 */
export function ResumeSheet({ lang, priority = false }: ResumeSheetProps) {
  const data = RESUME[lang];
  const { labels, profile } = data;

  return (
    <article className="resume-sheet" aria-label={`${profile.name} — ${profile.role}`}>
      <header className="resume-sheet__masthead">
        <div className="resume-sheet__masthead-copy">
          <h1 className="resume-sheet__name">{profile.name}</h1>
          <p className="resume-sheet__role">{profile.role}</p>
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

        <nav className="resume-sheet__contact" aria-label="Contact links">
          {data.contact.map((item) =>
            item.href ? (
              <a
                key={item.label}
                className="resume-sheet__contact-link"
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {item.value}
              </a>
            ) : (
              <span key={item.label} className="resume-sheet__contact-link">
                {item.value}
              </span>
            ),
          )}
        </nav>
      </header>

      <div className="resume-grid">
        <section className="resume-row">
          <h2 className="resume-row__label">{labels.about}</h2>
          <div className="resume-row__content">
            <p className="resume-about__summary">{data.summary}</p>
          </div>
        </section>

        <section className="resume-row">
          <h2 className="resume-row__label">{labels.experience}</h2>
          <div className="resume-row__content resume-experience">
            {data.experience.map((entry) => (
              <article
                className="resume-experience__entry"
                key={`${entry.period}-${entry.company}`}
              >
                <div className="resume-experience__meta">
                  <h3 className="resume-experience__role">{entry.role}</h3>
                  <p className="resume-experience__company">{entry.company}</p>
                  <p className="resume-experience__period">{entry.period}</p>
                  {entry.note && (
                    <p className="resume-experience__note">{entry.note}</p>
                  )}
                </div>
                <ul className="resume-experience__description">
                  {entry.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="resume-row">
          <h2 className="resume-row__label">{labels.education}</h2>
          <div className="resume-row__content resume-education">
            {data.education.map((entry) => (
              <div
                className="resume-education__entry"
                key={`${entry.period}-${entry.title}`}
              >
                <p className="resume-education__title">{entry.title}</p>
                <p className="resume-education__subtitle">{entry.subtitle}</p>
                <p className="resume-education__period">{entry.period}</p>
              </div>
            ))}
          </div>
        </section>

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
