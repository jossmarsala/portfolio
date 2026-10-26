import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type Lang = "en" | "es";

// ─── Full translation map ────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    // Navbar
    nav_work: "work",
    nav_about: "about",
    nav_resume: "resume",
    lang_toggle_label: "Switch to Spanish",

    // Hero
    hero_tagline: "i design. i develop.",

    // Works section
    works_headline_left: "my",
    works_headline_right: "work.",
    works_editorial_link: "about me\u00a0→",
    works_editorial_text:
      "I'm a software development student with 3+ years of experience across two fields: design and code. I engineer systems and businesses that look and work beautifully.",

    // About sidebar
    about_aria: "About me",
    about_close: "ESC / CLOSE",
    about_bio_intro:
      "I am a digital product designer and developer. My approach integrates aesthetics, business strategy, and software engineering to accompany the entire lifecycle of a product. I am interested in building things with purpose: where",
    about_bio_keyword_design: "design",
    about_bio_and: "and",
    about_bio_keyword_tech: "technology",
    about_bio_outro: "function as parts of the same system.",
    about_bio:
      "I am a digital product designer and developer. My approach integrates aesthetics, business strategy, and software engineering to accompany the entire lifecycle of a product. I am interested in building things with purpose: where design and technology function as parts of the same system.",
    about_cta: "let's talk",

    // Footer
    footer_headline_left: "let's",
    footer_headline_right: "talk.",
    footer_sig_role: "designer & developer",
  },
  es: {
    // Navbar
    nav_work: "trabajo",
    nav_about: "sobre mí",
    nav_resume: "cv",
    lang_toggle_label: "Cambiar a inglés",

    // Hero
    hero_tagline: "diseñadora y desarrolladora.",

    // Works section
    works_headline_left: "mi",
    works_headline_right: "trabajo.",
    works_editorial_link: "sobre mí\u00a0→",
    works_editorial_text:
      "Soy estudiante de Desarrollo de Software con más de 3 años de experiencia combinando diseño y programación. Creo sistemas y negocios digitales que destacan por su estética y funcionalidad.",

    // About sidebar
    about_aria: "Sobre mí",
    about_close: "ESC / CERRAR",
    about_bio_intro:
      "Soy diseñadora y desarrolladora de productos digitales. Mi enfoque integra estética, estrategia de negocio e ingeniería de software para acompañar todo el ciclo de vida de un producto. Me interesa construir cosas con propósito: donde el",
    about_bio_keyword_design: "diseño",
    about_bio_and: "y la",
    about_bio_keyword_tech: "tecnología",
    about_bio_outro: "funcionen como partes de un mismo sistema.",
    about_bio:
      "Soy diseñadora y desarrolladora de productos digitales. Mi enfoque integra estética, estrategia de negocio e ingeniería de software para acompañar todo el ciclo de vida de un producto. Me interesa construir cosas con propósito: donde el diseño y la tecnología funcionen como partes de un mismo sistema.",
    about_cta: "hablemos",

    // Footer
    footer_headline_left: "let's",
    footer_headline_right: "talk.",
    footer_sig_role: "diseñadora & desarrolladora",
  },
} as const;

export type TranslationKey = keyof (typeof TRANSLATIONS)["en"];

// ─── Context ─────────────────────────────────────────────────────────────────
interface LanguageContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  toggleLang: () => {},
  t: (key) => TRANSLATIONS.en[key],
});

/** Detect browser / device language and return "es" if Spanish, "en" otherwise. */
function detectDeviceLang(): Lang {
  const nav =
    navigator.language ||
    (navigator as { userLanguage?: string }).userLanguage ||
    "en";
  return nav.toLowerCase().startsWith("es") ? "es" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(detectDeviceLang);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "en" ? "es" : "en"));
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => TRANSLATIONS[lang][key],
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
