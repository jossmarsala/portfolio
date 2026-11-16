import { pdf } from "@react-pdf/renderer";
import { PROFILE_PHOTO_URL } from "@/config/profile";
import { ResumeDocument, type ResumeData } from "./ResumePdf";
import { loadPortraitAsJpeg } from "./loadPortraitAsJpeg";

/**
 * Lazily imported by the modal when the user asks for the download. Keeping
 * @react-pdf/renderer behind this module means the renderer never reaches the
 * initial bundle.
 */
export async function createResumePdfBlob(data: ResumeData): Promise<Blob> {
  const photo = await loadPortraitAsJpeg(PROFILE_PHOTO_URL);
  return pdf(<ResumeDocument data={data} photo={photo} />).toBlob();
}
