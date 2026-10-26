import { useState, useEffect } from "react";
import DecryptedText from "./DecryptedText";
import { NAV_LINKS } from "./config/navLinks";
import { DECRYPTED_NAV } from "./config/decryptedTextPresets";
import { useLang } from "./context/LanguageContext";
import "./Navbar.css";

interface NavbarProps {
  onAboutClick?: () => void;
}

// Map each navLinks label key to its translation key
const NAV_TRANSLATION_KEYS: Record<string, "nav_work" | "nav_about" | "nav_resume"> = {
  work: "nav_work",
  about: "nav_about",
  resume: "nav_resume",
};

export function Navbar({ onAboutClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const { lang, toggleLang, t } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* ── Language toggle — anchored to the left edge ── */}
      <button
        id="lang-toggle"
        className="navbar__lang-toggle"
        onClick={toggleLang}
        aria-label={t("lang_toggle_label")}
        title={t("lang_toggle_label")}
      >
        <span className={`navbar__lang-opt ${lang === "en" ? "navbar__lang-opt--active" : ""}`}>
          EN
        </span>
        <span className="navbar__lang-divider">|</span>
        <span className={`navbar__lang-opt ${lang === "es" ? "navbar__lang-opt--active" : ""}`}>
          ES
        </span>
      </button>

      <ul className="navbar__list">
        {NAV_LINKS.map(({ label, href }) => {
          const isAbout = label === "about";
          const translationKey = NAV_TRANSLATION_KEYS[label];
          const translatedLabel = translationKey ? t(translationKey) : label;
          return (
            <li key={label} className="navbar__item">
              <a
                href={isAbout ? undefined : href}
                className="navbar__link"
                aria-label={translatedLabel}
                role={isAbout ? "button" : undefined}
                onClick={
                  isAbout
                    ? (e) => {
                        e.preventDefault();
                        onAboutClick?.();
                      }
                    : undefined
                }
              >
                <DecryptedText
                  {...DECRYPTED_NAV}
                  text={translatedLabel}
                  className="navbar__link-revealed"
                  encryptedClassName="navbar__link-encrypted"
                />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default Navbar;
