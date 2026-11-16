/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RESUME CONTENT — single source of truth
 * ─────────────────────────────────────────────────────────────────────────────
 *  Edit the text below and every surface updates: the nav preview modal, the
 *  browser print view and the downloadable PDF. Nothing else needs touching.
 *
 *  Structure per language (en / es):
 *    labels        → editorial column names and small captions
 *    profile       → name, role and contact rows (no phone number)
 *    summary       → the ABOUT ME paragraph
 *    experience    → array (period / company / role / note / bullets)
 *    education     → array, newest first (period / title / subtitle)
 *    skillGroups   → exactly three columns; add or remove items freely
 *    additional    → two columns: other skills and recognitions
 *
 *  Keep periods short ("2024 — 2026") so the date column stays aligned.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Base filename for the downloaded PDF (no extension). */
export const RESUME_FILE_NAME = "Josefina-Marsala-CV";

export const RESUME = {
  en: {
    labels: {
      about: "ABOUT ME",
      experience: "EXPERIENCE",
      education: "EDUCATION & COURSES",
      skills: "TECHNICAL SKILLS",
      additional: "ADDITIONAL",
      other: "OTHER SKILLS",
      recognitions: "RECOGNITIONS",
    },

    profile: {
      name: "Josefina Marsala",
      displayName: "Jos Marsala",
      role: "Software Development Student · Junior Developer & Designer",
    },

    contact: [
      {
        label: "EMAIL",
        value: "jossmarsala@gmail.com",
        href: "mailto:jossmarsala@gmail.com",
      },
      {
        label: "LINKEDIN",
        value: "linkedin.com/in/josmarsala",
        href: "https://www.linkedin.com/in/josmarsala/",
      },
      {
        label: "GITHUB",
        value: "github.com/jossmarsala",
        href: "https://github.com/jossmarsala",
      },
      {
        label: "WEBSITE",
        value: "josmarsala.vercel.app",
        href: "https://josmarsala.vercel.app",
      },
    ],

    summary:
      "2nd-year Software Development student at ITU UNCuyo, high-school Computer Science graduate and national Computer Science Olympiad medalist. I have three years of experience building web projects across frontend, backend and databases (React, Python, FastAPI). My background in Multimedia Design complements my technical profile, letting me approach development with both software quality and user experience in mind. I am looking for my first professional opportunity as a junior developer, bringing problem-solving skills, attention to detail and technical value to a team.",

    experience: [
      {
        period: "2024 — 2026",
        company: "Vitalia",
        role: "Product Designer, Web Developer & UX",
        bullets: [
          "Developed the user interface with React and CSS, ensuring responsiveness across multiple devices.",
          "Designed and implemented a REST API with FastAPI to manage the user database and personalised plans.",
          "Achievement: 3rd place in the national EmprendeU competition and 20+ active users on the platform.",
        ],
      },
      {
        period: "2026",
        company: "POSDATA",
        role: "Freelance Developer & Designer",
        note: "Independent project",
        bullets: [
          "Systems development and business modelling, from Figma wireframes to implementation and deployment.",
          "Interface development with React and Next.js, applying UX/UI principles and responsive design.",
          "Project management and version control with Git/GitHub.",
        ],
      },
    ],

    education: [
      {
        period: "2025 —\nPresent",
        title: "Software Development",
        subtitle: "ITU UNCuyo",
      },
      {
        period: "2020 — 2024",
        title: "Computer Science Diploma",
        subtitle: "Escuela de Comercio Martín Zapata",
      },
      {
        period: "2026",
        title: "Multimedia Design & Digital Media Diploma",
        subtitle: "UTN Buenos Aires",
      },
      {
        period: "2026",
        title: "Cybersecurity Diploma",
        subtitle: "ITU UNCuyo",
      },
      {
        period: "2024 — 2025",
        title: "Google Cybersecurity Certificate (170h)",
        subtitle: "Google",
      },
      {
        period: "2025",
        title: "Python + FastAPI Course (60h)",
        subtitle: "ITU UNCuyo",
      },
    ],

    skillGroups: [
      {
        label: "PROGRAMMING & DEVELOPMENT",
        items: [
          "C++, Java",
          "Python, FastAPI, REST APIs",
          "SQL/MySQL, MongoDB",
          "HTML, CSS, JavaScript",
          "React, TypeScript",
          "Agile methodologies + Scrum",
        ],
      },
      {
        label: "TOOLS & OS",
        items: [
          "Linux (+ Windows & macOS)",
          "VSCode, NetBeans",
          "Git (GitHub) version control",
          "Vercel, Supabase",
          "Docker",
          "Excel, Figma & Adobe Suite",
        ],
      },
      {
        label: "LANGUAGES",
        items: [
          "Spanish — Native",
          "English — Professional B2+",
          "Italian — Conversational B1",
        ],
      },
    ],

    additional: {
      other: [
        "Pitching and business modeling",
        "Communication and teamwork",
        "AI-assisted development and prompt engineering",
        "Knowledge of multimedia design",
      ],
      recognitions: [
        "2nd place — National Computer Science Olympiad (2024)",
        "1st and 3rd place — National EmprendeU Competition (2023–2024), with Vitalia and Gota a Gota",
      ],
    },
  },

  es: {
    labels: {
      about: "SOBRE MÍ",
      experience: "EXPERIENCIA",
      education: "EDUCACIÓN Y CURSOS",
      skills: "HABILIDADES TÉCNICAS",
      additional: "ADICIONAL",
      other: "OTRAS COMPETENCIAS",
      recognitions: "RECONOCIMIENTOS",
    },

    profile: {
      name: "Josefina Marsala",
      displayName: "Jos Marsala",
      role: "Estudiante de Desarrollo de Software · Programadora Junior",
    },

    contact: [
      {
        label: "CORREO",
        value: "jossmarsala@gmail.com",
        href: "mailto:jossmarsala@gmail.com",
      },
      {
        label: "LINKEDIN",
        value: "linkedin.com/in/josmarsala",
        href: "https://www.linkedin.com/in/josmarsala/",
      },
      {
        label: "GITHUB",
        value: "github.com/jossmarsala",
        href: "https://github.com/jossmarsala",
      },
      {
        label: "SITIO WEB",
        value: "josmarsala.vercel.app",
        href: "https://josmarsala.vercel.app",
      },
    ],

    summary:
      "Estudiante de 2.º año de Desarrollo de Software en ITU UNCuyo, Bachiller en Informática y medallista en las Olimpiadas Nacionales de Informática. Cuento con tres años de experiencia en desarrollo de proyectos web, integrando tecnologías frontend, backend y bases de datos (React, Python, FastAPI). Mi formación en Diseño Multimedial complementa mi perfil técnico y me permite abordar el desarrollo considerando tanto la calidad del software como la experiencia de usuario (UX/UI). Busco mi primera oportunidad profesional como desarrolladora junior para aportar capacidad de resolución de problemas, atención al detalle y valor técnico a un equipo.",

    experience: [
      {
        period: "2024 — 2026",
        company: "Vitalia",
        role: "Diseñadora de Producto, Desarrolladora Web & UX",
        bullets: [
          "Desarrollé la interfaz de usuario con React y CSS, asegurando la responsividad en múltiples dispositivos.",
          "Diseñé e implementé una API REST con FastAPI para gestionar la base de datos de usuarios y planes personalizados.",
          "Logro: 3.er puesto en la competencia nacional EmprendeU y más de 20 usuarios activos en la plataforma.",
        ],
      },
      {
        period: "2026",
        company: "POSDATA",
        role: "Desarrolladora y Diseñadora Freelance",
        note: "Proyecto independiente",
        bullets: [
          "Desarrollo de sistemas y modelado de negocios, desde wireframes en Figma hasta su implementación y despliegue.",
          "Desarrollo de interfaces con React y Next.js, aplicando principios de UX/UI y diseño responsive.",
          "Gestión de proyectos y control de versiones mediante Git/GitHub.",
        ],
      },
    ],

    education: [
      {
        period: "2025 —\nPresente",
        title: "Desarrollo de Software",
        subtitle: "ITU UNCuyo",
      },
      {
        period: "2020 — 2024",
        title: "Bachiller en Informática",
        subtitle: "Escuela de Comercio Martín Zapata",
      },
      {
        period: "2026",
        title: "Diplomatura en Diseño Multimedial y Medios Digitales",
        subtitle: "UTN Buenos Aires",
      },
      {
        period: "2026",
        title: "Diplomatura en Ciberseguridad",
        subtitle: "ITU UNCuyo",
      },
      {
        period: "2024 — 2025",
        title: "Certificado Profesional de Ciberseguridad de Google (170h)",
        subtitle: "Google",
      },
      {
        period: "2025",
        title: "Curso de Python + FastAPI (60h)",
        subtitle: "ITU UNCuyo",
      },
    ],

    skillGroups: [
      {
        label: "PROGRAMACIÓN Y DESARROLLO",
        items: [
          "C++, Java",
          "Python, FastAPI, REST APIs",
          "SQL/MySQL, MongoDB",
          "HTML, CSS, JavaScript",
          "React, TypeScript",
          "Metodologías ágiles + Scrum",
        ],
      },
      {
        label: "HERRAMIENTAS Y SO",
        items: [
          "Linux (+ Windows y macOS)",
          "VSCode, NetBeans",
          "Git (GitHub) control de versiones",
          "Vercel, Supabase",
          "Docker",
          "Excel, Figma y Suite de Adobe",
        ],
      },
      {
        label: "IDIOMAS",
        items: [
          "Español — Nativo",
          "Inglés — Profesional B2+",
          "Italiano — Conversacional B1",
        ],
      },
    ],

    additional: {
      other: [
        "Pitching y modelado de negocios",
        "Comunicación y trabajo en equipo",
        "Desarrollo asistido por IA y prompt engineering",
        "Conocimientos en diseño multimedial",
      ],
      recognitions: [
        "2.º puesto — Olimpiadas Nacionales de Informática (2024)",
        "1.º y 3.er puesto — Competencia nacional EmprendeU (2023–2024), con Vitalia y Gota a Gota",
      ],
    },
  },
};
