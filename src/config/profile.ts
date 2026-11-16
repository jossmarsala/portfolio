import portraitUrl from "@/assets/about-portrait.webp";

/**
 * The portrait used by the About sidebar and the resume header.
 * Imported from one bundled asset so both surfaces always show the exact same
 * photo — and so the PDF renderer can fetch it same-origin, without CORS.
 */
export const PROFILE_PHOTO_URL = portraitUrl;
