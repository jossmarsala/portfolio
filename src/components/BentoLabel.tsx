import DecryptedText from "../DecryptedText";
import { DECRYPTED_LABEL } from "../config/decryptedTextPresets";

export interface BentoLabelProps {
  title: string;
  sub: string;
}

/**
 * Caption row rendered below each bento cell.
 * Shared by BentoImages and BentoSideProjects.
 */
export function BentoLabel({ title, sub }: BentoLabelProps) {
  return (
    <div className="bento-images__label">
      <span className="bento-images__label-title">
        <DecryptedText
          {...DECRYPTED_LABEL}
          text={title}
          className="bento-images__label-title-revealed"
          encryptedClassName="bento-images__label-title-encrypted"
        />
      </span>
      <span className="bento-images__label-sub">{sub}</span>
    </div>
  );
}

export default BentoLabel;
