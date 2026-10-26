import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
import DecryptedText from "./DecryptedText";
import WarpHeadline from "./components/WarpHeadline";
import { WARP_FOOTER_HEADLINE_PROPS } from "./config/warpTextPresets";
import JosMarsalaLogo from "./JosMarsalaLogo";
import { NAV_LINKS } from "./config/navLinks";
import {
  DECRYPTED_NAV,
  DECRYPTED_NAV_SLOW,
} from "./config/decryptedTextPresets";
import { useLang } from "./context/LanguageContext";
import "./Footer.css";

// Map nav label keys to translation keys
const NAV_TRANSLATION_KEYS: Record<
  string,
  "nav_work" | "nav_about" | "nav_resume"
> = {
  work: "nav_work",
  about: "nav_about",
  resume: "nav_resume",
};

export interface FooterProps {
  scroller?: string | Element | null;
  onAboutClick?: () => void;
}

export function Footer({ scroller, onAboutClick }: FooterProps = {}) {
  const footerRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const midRowRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useLang();

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: footer,
        start: "top bottom",
        end: "bottom bottom",
        scrub: 1,
        scroller: scroller || undefined,
      },
    });

    tl.fromTo(
      headlineRef.current,
      {
        opacity: 0,
        y: 60,
        rotationX: -40,
        transformPerspective: 1000,
        transformOrigin: "top center",
        filter: "blur(12px)",
      },
      { opacity: 1, y: 0, rotationX: 0, filter: "blur(0px)", ease: "none" },
    )
      .fromTo(
        midRowRef.current,
        {
          opacity: 0,
          y: 30,
          rotationX: -30,
          transformPerspective: 1000,
          transformOrigin: "top center",
        },
        { opacity: 1, y: 0, rotationX: 0, ease: "none" },
        "<",
      )
      .fromTo(
        bottomRef.current,
        {
          opacity: 0,
          y: 15,
          rotationX: -20,
          transformPerspective: 1000,
          transformOrigin: "top center",
        },
        { opacity: 1, y: 0, rotationX: 0, ease: "none" },
        "<",
      );

    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }, []);

  return (
    <footer ref={footerRef} className="footer" aria-label="Site footer">
      {/* ── Headline: "let's / talk." | "hable / mos." ── */}
      <div ref={headlineRef} className="footer__headline-wrapper">
        <WarpHeadline
          leftText={t("footer_headline_left")}
          rightText={t("footer_headline_right")}
          className="footer__warp-headline"
          warpProps={WARP_FOOTER_HEADLINE_PROPS}
        />
      </div>

      {/* ── Mid row: name left / nav right ── */}
      <div ref={midRowRef} className="footer__mid">
        <div className="footer__sig">
          <span className="footer__sig-name">
            <JosMarsalaLogo />
          </span>
          <span className="footer__sig-role">{t("footer_sig_role")}</span>
        </div>
        <nav className="footer__nav" aria-label="Footer navigation">
          <ul className="footer__nav-list">
            {NAV_LINKS.map(({ label, href }) => {
              const isAbout = label === "about";
              const translationKey = NAV_TRANSLATION_KEYS[label];
              const translatedLabel = translationKey
                ? t(translationKey)
                : label;
              return (
                <li key={label} className="footer__nav-item">
                  <a
                    href={isAbout ? undefined : href}
                    className="footer__nav-link"
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
                      className="footer__nav-revealed"
                      encryptedClassName="footer__nav-encrypted"
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* ── Bottom bar ── */}
      <div ref={bottomRef} className="footer__bottom">
        <span className="footer__year">© {new Date().getFullYear()}</span>
        <a
          href="mailto:hello@josmarsala.com"
          className="footer__contact"
          aria-label="Send an email"
        >
          <DecryptedText
            {...DECRYPTED_NAV_SLOW}
            text="hello@josmarsala.com"
            className="footer__contact-revealed"
            encryptedClassName="footer__contact-encrypted"
          />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
