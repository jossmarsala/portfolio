import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLang } from "@/context/LanguageContext";
import { RESUME, RESUME_FILE_NAME } from "@/data/resumeData";
import { A4_HEIGHT_PX, A4_WIDTH_PX, ResumeSheet } from "./ResumeSheet";
import "./ResumeModal.css";

type DownloadState = "idle" | "working" | "error";

interface ResumeModalProps {
  onClose: () => void;
}

/**
 * Minimal preview dialog: the A4 sheet, a close control in the left corner and
 * a download control in the right corner. The same sheet is printed at 1:1 and
 * mirrored by the PDF.
 */
export function ResumeModal({ onClose }: ResumeModalProps) {
  const { lang, t } = useLang();
  const data = RESUME[lang];

  const dialogRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const [scale, setScale] = useState(0.62);
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");

  /* ── Fit the sheet inside the padded viewport ── */
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const measure = () => {
      const { width, height } = viewport.getBoundingClientRect();
      const computed = window.getComputedStyle(viewport);
      const padX =
        parseFloat(computed.paddingLeft) + parseFloat(computed.paddingRight);
      const padY =
        parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);
      const fit = Math.min(
        Math.max(0, width - padX) / A4_WIDTH_PX,
        Math.max(0, height - padY) / A4_HEIGHT_PX,
        1,
      );
      setScale(Math.max(0.32, Number(fit.toFixed(4))));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    window.addEventListener("orientationchange", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  /* ── Focus, scroll lock, body class and Escape ── */
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("resume-open");

    const frame = requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("resume-open");
      restoreFocusRef.current?.focus?.();
    };
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  const handleDownload = useCallback(async () => {
    if (downloadState === "working") return;
    setDownloadState("working");

    try {
      const { createResumePdfBlob } = await import("./createResumePdf");
      const blob = await createResumePdfBlob(data);

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${RESUME_FILE_NAME}-${lang.toUpperCase()}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
      setDownloadState("idle");
    } catch (error) {
      console.error("Resume PDF generation failed", error);
      setDownloadState("error");
    }
  }, [data, downloadState, lang]);

  return (
    <>
      <div
        ref={dialogRef}
        className="resume-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("resume_aria")}
        onKeyDown={handleKeyDown}
      >
        <div
          className="resume-modal__backdrop"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="resume-modal__chrome">
          <button
            ref={closeRef}
            type="button"
            className="resume-modal__close"
            onClick={onClose}
            aria-label={t("resume_close")}
          >
            <span className="resume-modal__bracket">[</span>
            <span>{t("resume_close")}</span>
            <span className="resume-modal__bracket">]</span>
          </button>

          <button
            type="button"
            className={`resume-modal__download ${
              downloadState === "working" ? "resume-modal__download--working" : ""
            }`}
            onClick={handleDownload}
            disabled={downloadState === "working"}
            aria-live="polite"
          >
            <span className="resume-modal__bracket">[</span>
            <span>
              {downloadState === "working"
                ? t("resume_downloading")
                : t("resume_download")}
            </span>
            <span className="resume-modal__bracket">]</span>
            <span className="resume-modal__download-arrow" aria-hidden="true">
              ↓
            </span>
          </button>
        </div>

        <div className="resume-modal__viewport" ref={viewportRef}>
          <div
            className="resume-modal__canvas"
            style={{
              width: `${A4_WIDTH_PX * scale}px`,
              height: `${A4_HEIGHT_PX * scale}px`,
            }}
          >
            <div
              className="resume-modal__scale"
              style={{ transform: `scale(${scale})` }}
            >
              <ResumeSheet lang={lang} />
            </div>
          </div>
        </div>

        {downloadState === "error" && (
          <p className="resume-modal__error" role="alert">
            {t("resume_error")}
          </p>
        )}
      </div>

      {/* Hidden 1:1 copy used exclusively by @media print. */}
      {createPortal(
        <div className="resume-print-root" aria-hidden="true">
          <ResumeSheet lang={lang} priority />
        </div>,
        document.body,
      )}
    </>
  );
}

export default ResumeModal;
