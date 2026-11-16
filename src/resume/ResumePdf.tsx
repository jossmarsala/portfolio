import type { ReactNode } from "react";
import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

/**
 * Local shape of the resume data, inferred from the JS config so edits there
 * stay type-safe here without maintaining a parallel interface.
 */
export type ResumeData = (typeof import("@/data/resumeData"))["RESUME"]["en"];

/** A4 is 793 × 1122 px in the HTML sheet; map that canvas to PDF points. */
const POINTS_PER_PX = 595.28 / 793;
const u = (px: number) => px * POINTS_PER_PX;

const INK = "#111111";
const SOFT_INK = "#2f2f2f";
const MUTED = "#5f5f5f";
const FAINT = "#8e8e8e";
const RULE_FAINT = "rgba(17, 17, 17, 0.12)";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: INK,
    fontFamily: "Helvetica",
    fontSize: u(10.5),
    lineHeight: 1.48,
    height: "100%",
    paddingTop: u(38),
    paddingHorizontal: u(48),
    paddingBottom: u(28),
  },

  /* Masthead */
  masthead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: u(20),
  },
  mastheadCopy: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: "flex-start",
    paddingRight: u(28),
  },
  name: {
    fontFamily: "Helvetica-Bold",
    fontSize: u(38),
    lineHeight: 1.0,
    letterSpacing: u(-1.3),
    textTransform: "uppercase",
  },
  role: {
    fontFamily: "Helvetica-Bold",
    fontSize: u(14.5),
    lineHeight: 1.3,
    color: INK,
    marginTop: u(6),
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: u(8),
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactSep: {
    fontSize: u(8.5),
    color: FAINT,
    marginHorizontal: u(6),
  },
  contactText: {
    fontSize: u(10.2),
    color: SOFT_INK,
  },
  contactLink: {
    fontSize: u(10.2),
    color: SOFT_INK,
    textDecoration: "none",
  },
  portraitFrame: {
    width: u(106),
    height: u(126),
    overflow: "hidden",
  },
  portrait: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  portraitEmpty: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f2f2f2",
  },

  /* Grid: subtle horizontal hairlines only */
  grid: {
    width: "100%",
    flexGrow: 1,
  },
  row: {
    width: "100%",
    flexDirection: "row",
    paddingTop: u(12),
    paddingBottom: u(13),
    borderTopWidth: 0.75,
    borderTopColor: RULE_FAINT,
    borderStyle: "solid",
  },
  labelCell: {
    width: u(140),
    paddingRight: u(16),
  },
  label: {
    fontFamily: "Helvetica-Bold",
    fontSize: u(10.5),
    letterSpacing: u(1.1),
    lineHeight: 1.3,
    textTransform: "uppercase",
    color: INK,
  },
  contentCell: {
    flexGrow: 1,
    flexShrink: 1,
  },

  /* About */
  summary: {
    maxWidth: u(530),
    fontSize: u(10.5),
    lineHeight: 1.55,
    color: SOFT_INK,
  },

  /* Experience */
  experienceEntry: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: u(12),
  },
  experienceEntryLast: {
    marginBottom: 0,
  },
  date: {
    width: u(78),
    flexShrink: 0,
    fontFamily: "Times-Italic",
    fontSize: u(10),
    lineHeight: 1.35,
    color: MUTED,
    paddingTop: u(1),
  },
  experienceDetail: {
    flexGrow: 1,
    flexShrink: 1,
  },
  experienceHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    lineHeight: 1.3,
  },
  company: {
    fontFamily: "Helvetica-Bold",
    fontSize: u(11.2),
    letterSpacing: u(0.6),
    textTransform: "uppercase",
  },
  experienceRole: {
    fontFamily: "Helvetica",
    fontSize: u(10.5),
    color: SOFT_INK,
  },
  location: {
    fontFamily: "Times-Italic",
    fontSize: u(9.8),
    color: MUTED,
  },
  bullets: {
    width: "100%",
    marginTop: u(5),
  },
  bulletText: {
    width: "100%",
    maxWidth: u(460),
    fontSize: u(10.2),
    lineHeight: 1.48,
    color: SOFT_INK,
    paddingLeft: u(10),
    textIndent: u(-10),
    marginBottom: u(3.5),
  },

  /* Education */
  educationEntry: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: u(6.5),
  },
  educationEntryLast: {
    marginBottom: 0,
  },
  educationDetail: {
    flexGrow: 1,
    flexShrink: 1,
  },
  educationTitle: {
    width: "100%",
    fontFamily: "Helvetica-Bold",
    fontSize: u(10.5),
    lineHeight: 1.25,
    color: INK,
  },
  educationSubtitle: {
    width: "100%",
    fontFamily: "Times-Italic",
    fontSize: u(9.8),
    lineHeight: 1.25,
    color: MUTED,
    marginTop: u(1),
  },

  /* Skills */
  skills: {
    width: "100%",
    flexDirection: "row",
  },
  skillGroup0: {
    width: "39%",
    paddingRight: u(16),
  },
  skillGroup1: {
    width: "35%",
    paddingRight: u(16),
  },
  skillGroup2: {
    width: "26%",
  },
  skillLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: u(9.5),
    letterSpacing: u(0.8),
    lineHeight: 1.3,
    textTransform: "uppercase",
    color: INK,
  },
  skillList: {
    marginTop: u(5),
  },
  skillText: {
    width: "100%",
    fontSize: u(10.2),
    lineHeight: 1.45,
    color: SOFT_INK,
    paddingLeft: u(8),
    textIndent: u(-8),
    marginBottom: u(3),
  },

  /* Additional */
  additional: {
    width: "100%",
    flexDirection: "row",
  },
  additionalGroup0: {
    width: "52%",
    paddingRight: u(20),
  },
  additionalGroup1: {
    width: "48%",
  },
  additionalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: u(9.5),
    letterSpacing: u(0.8),
    lineHeight: 1.3,
    textTransform: "uppercase",
    color: INK,
  },
  additionalList: {
    marginTop: u(5),
  },
  additionalText: {
    width: "100%",
    fontSize: u(10.2),
    lineHeight: 1.45,
    color: SOFT_INK,
    paddingLeft: u(8),
    textIndent: u(-8),
    marginBottom: u(3),
  },
});

interface RowProps {
  label: string;
  children: ReactNode;
}

function ResumeRow({ label, children }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.labelCell}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.contentCell}>{children}</View>
    </View>
  );
}

interface ResumeDocumentProps {
  data: ResumeData;
  photo?: string | null;
}

/**
 * PDF twin of the HTML ResumeSheet.
 * Minimalist editorial aesthetic matching the HTML canvas.
 */
export function ResumeDocument({ data, photo }: ResumeDocumentProps) {
  const { labels, profile } = data;

  return (
    <Document
      title={`${profile.name} — ${profile.role}`}
      author={profile.name}
      subject={profile.role}
      creator="josmarsala.com"
      producer="josmarsala.com"
      language={labels.about === "SOBRE MÍ" ? "es" : "en"}
      keywords="resume, curriculum, software development, junior developer, designer"
    >
      <Page size="A4" style={styles.page} wrap={false}>
        {/* Masthead: name, prominent role, contact & portrait */}
        <View style={styles.masthead}>
          <View style={styles.mastheadCopy}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.role}>{profile.role}</Text>

            <View style={styles.contactRow}>
              {data.contact.map((item, index) => (
                <View key={item.label} style={styles.contactItem}>
                  {index > 0 && <Text style={styles.contactSep}>·</Text>}
                  {item.href ? (
                    <Link src={item.href} style={styles.contactLink}>
                      {item.value}
                    </Link>
                  ) : (
                    <Text style={styles.contactText}>{item.value}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.portraitFrame}>
            {photo ? (
              <Image src={photo} style={styles.portrait} />
            ) : (
              <View style={styles.portraitEmpty} />
            )}
          </View>
        </View>

        {/* Grid: purely alignment & negative space with subtle hairlines */}
        <View style={styles.grid}>
          {/* ABOUT ME */}
          <ResumeRow label={labels.about}>
            <Text style={styles.summary}>{data.summary}</Text>
          </ResumeRow>

          {/* EXPERIENCE */}
          <ResumeRow label={labels.experience}>
            <View>
              {data.experience.map((entry, index) => (
                <View
                  key={`${entry.period}-${entry.company}`}
                  style={[
                    styles.experienceEntry,
                    index === data.experience.length - 1
                      ? styles.experienceEntryLast
                      : {},
                  ]}
                >
                  <Text style={styles.date}>{entry.period}</Text>
                  <View style={styles.experienceDetail}>
                    <View style={styles.experienceHeader}>
                      <Text style={styles.company}>{entry.company}</Text>
                      <Text style={styles.experienceRole}>
                        {" · "}
                        {entry.role}
                        {entry.note ? (
                          <Text style={styles.location}> · {entry.note}</Text>
                        ) : null}
                      </Text>
                    </View>
                    <View style={styles.bullets}>
                      {entry.bullets.map((bullet) => (
                        <Text key={bullet} style={styles.bulletText}>
                          {`•  ${bullet}`}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ResumeRow>

          {/* EDUCATION & COURSES */}
          <ResumeRow label={labels.education}>
            <View>
              {data.education.map((entry, index) => (
                <View
                  key={`${entry.period}-${entry.title}`}
                  style={[
                    styles.educationEntry,
                    index === data.education.length - 1
                      ? styles.educationEntryLast
                      : {},
                  ]}
                >
                  <Text style={styles.date}>{entry.period}</Text>
                  <View style={styles.educationDetail}>
                    <Text style={styles.educationTitle}>{entry.title}</Text>
                    <Text style={styles.educationSubtitle}>{entry.subtitle}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ResumeRow>

          {/* TECHNICAL SKILLS */}
          <ResumeRow label={labels.skills}>
            <View style={styles.skills}>
              {data.skillGroups.map((group, index) => {
                const groupStyle =
                  index === 0
                    ? styles.skillGroup0
                    : index === 1
                    ? styles.skillGroup1
                    : styles.skillGroup2;
                return (
                  <View key={group.label} style={groupStyle}>
                    <Text style={styles.skillLabel}>{group.label}</Text>
                    <View style={styles.skillList}>
                      {group.items.map((item) => (
                        <Text key={item} style={styles.skillText}>
                          {`•  ${item}`}
                        </Text>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </ResumeRow>

          {/* ADDITIONAL */}
          <ResumeRow label={labels.additional}>
            <View style={styles.additional}>
              <View style={styles.additionalGroup0}>
                <Text style={styles.additionalLabel}>{labels.other}</Text>
                <View style={styles.additionalList}>
                  {data.additional.other.map((item) => (
                    <Text key={item} style={styles.additionalText}>
                      {`•  ${item}`}
                    </Text>
                  ))}
                </View>
              </View>
              <View style={styles.additionalGroup1}>
                <Text style={styles.additionalLabel}>{labels.recognitions}</Text>
                <View style={styles.additionalList}>
                  {data.additional.recognitions.map((item) => (
                    <Text key={item} style={styles.additionalText}>
                      {`•  ${item}`}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </ResumeRow>
        </View>
      </Page>
    </Document>
  );
}

export default ResumeDocument;
