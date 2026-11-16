import {
  createContext,
  useContext,
  useState,
  useEffect,
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

    // Resume preview
    resume_aria: "Resume preview",
    resume_close: "close",
    resume_download: "download pdf",
    resume_downloading: "preparing pdf…",
    resume_error: "The PDF could not be generated. Please try again.",

    // Hero
    hero_tagline: "i design. i develop.",

    // Works section
    works_headline_left: "my",
    works_headline_right: "work.",
    works_editorial_link: "about me\u00a0→",
    works_editorial_text:
      "Software developer and digital designer with 3+ years of experience. I build digital systems and businesses that blend engineering, high-impact design and business strategy.",

    // About sidebar
    about_aria: "About me",
    about_close: "CLOSE",
    about_bio_intro:
      "I'm Jos, digital product designer and software developer with 3 years of experience. My work combines ",
    about_bio_kw_engineering: "engineering",
    about_bio_kw_design: "design",
    about_bio_between: ", and ",
    about_bio_kw_business: "business",
    about_bio_outro: " strategy.",
    about_bio_second:
      "I have a background in Software Development and hold diplomas in Multimedia Design and Cybersecurity. In 2024 I was national runner-up in the Informatics Olympiads with my team and, since then, I have led and developed 10+ projects that integrate full-stack programming, cybersecurity, and product vision.",
    about_bio:
      "I'm Jos, digital product designer and software developer with 3 years of experience. My work combines engineering, design, and business strategy.\n\nI have an academic background in Software Development and hold diplomas in Multimedia Design and Cybersecurity. In 2024 I was national runner-up in the Informatics Olympiads with my team and, since then, I have led and developed 10+ projects that integrate full-stack programming, cybersecurity, and business vision.",
    about_cta: "let's talk",

    // Bento side projects
    bento_new_project: "your new project",

    // Project view
    project_close: "close",
    project_process: "process",
    project_features: "features",
    project_impact: "impact",
    project_problem_solution: "problem & solution",
    project_problem_solution_indexed: "00 - [problem & solution]",
    project_more_work: "more work",

    // Loading states
    loading_visual: "loading visual",
    loading_work: "loading work",
    loading_footer: "loading footer",
    loading_case_study: "loading case study",
    loading_redirecting: "redirecting",

    // 404
    not_found_title: "this page doesn't exist.",
    not_found_copy: "The case study may have moved, or the link was mistyped.",
    not_found_back: "back to work",

    // Footer
    footer_headline_left: "let's",
    footer_headline_right: "talk.",
    footer_sig_role: "designer & developer",

    // Custom cursor
    cursor_see_work: "see work",
  },
  es: {
    // Navbar
    nav_work: "trabajo",
    nav_about: "sobre mí",
    nav_resume: "currículum",
    lang_toggle_label: "Cambiar a inglés",

    // Resume preview
    resume_aria: "Vista previa del currículum",
    resume_close: "cerrar",
    resume_download: "descargar pdf",
    resume_downloading: "preparando pdf…",
    resume_error: "No se pudo generar el PDF. Intentá de nuevo.",

    // Hero
    hero_tagline: "diseñadora y desarrolladora.",

    // Works section
    works_headline_left: "mi",
    works_headline_right: "trabajo.",
    works_editorial_link: "sobre mí\u00a0→",
    works_editorial_text:
      "Soy desarrolladora de software y diseñadora digital con más de 3 años de experiencia. Construyo productos digitales que integran ingeniería, diseño y estrategia de negocio.",

    // About sidebar
    about_aria: "Sobre mí",
    about_close: "CERRAR",
    about_bio_intro:
      "Soy Jos. Diseñadora de productos digitales y desarrolladora de software con 3 años de experiencia. Mi trabajo combina ",
    about_bio_kw_engineering: "ingeniería",
    about_bio_kw_design: "diseño",
    about_bio_between: " y estrategia de ",
    about_bio_kw_business: "negocio",
    about_bio_outro: ".",
    about_bio_second:
      "Cuento con formación en Desarrollo de Software y soy diplomada en Diseño Multimedial y Ciberseguridad. En 2024 fui subcampeona nacional en las Olimpíadas de Informática con mi equipo y, desde entonces, he liderado y desarrollado +10 proyectos que integran programación full-stack, seguridad informática y visión de producto.",
    about_bio:
      "Soy Jos. Diseñadora de productos digitales y desarrolladora de software con 3 años de experiencia. Mi trabajo combina ingeniería, diseño y estrategia de negocio.\n\nCuento con formación en Desarrollo de Software y soy diplomada en Diseño Multimedial y Ciberseguridad. En 2024 fui subcampeona nacional en las Olimpíadas de Informática con mi equipo y, desde entonces, he liderado y desarrollado +10 proyectos que integran programación full-stack, seguridad informática y visión de producto.",
    about_cta: "hablemos",

    // Bento side projects
    bento_new_project: "tu nuevo proyecto",

    // Project view
    project_close: "cerrar",
    project_process: "proceso",
    project_features: "características",
    project_impact: "impacto",
    project_problem_solution: "problemática y solución",
    project_problem_solution_indexed: "00 - [problemática y solución]",
    project_more_work: "más trabajo",

    // Loading states
    loading_visual: "cargando visual",
    loading_work: "cargando trabajo",
    loading_footer: "cargando pie de página",
    loading_case_study: "cargando caso de estudio",
    loading_redirecting: "redirigiendo",

    // 404
    not_found_title: "esta página no existe.",
    not_found_copy:
      "El caso de estudio puede haberse movido o el enlace está mal escrito.",
    not_found_back: "volver al trabajo",

    // Footer
    footer_headline_left: "ideemos",
    footer_headline_right: "algo.",
    footer_sig_role: "diseñadora & desarrolladora",

    // Custom cursor
    cursor_see_work: "ver trabajo",
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

  // Keep the document language in sync with the active locale so screen
  // readers and browser translation prompts use the right language.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

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
