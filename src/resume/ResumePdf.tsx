import type { ReactNode } from "react";
import {
  Document,
  Font,
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
const SOFT_INK = "#333333";
const MUTED = "#6b6b6b";
const FAINT = "#9a9a9a";
const RULE_FAINT = "#e5e5e5";

const FONT_BASE = import.meta.env.BASE_URL || "/";

/* Same families as the site: Helvetica for display/body (built into the PDF
   renderer) and self-hosted Roboto Mono for metadata. */
Font.register({
  family: "Roboto Mono",
  fonts: [
    {
      src: `${FONT_BASE}fonts/roboto-mono-var.ttf`,
      fontWeight: 400,
      fontStyle: "normal",
    },
  ],
});

/* Keep line breaks identical to the HTML sheet. */
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: INK,
    fontFamily: "Helvetica",
    fontSize: u(10.5),
    lineHeight: 1.48,
    paddingTop: u(36),
    paddingHorizontal: u(44),
    paddingBottom: u(28),
  },

  /* Masthead */
  masthead: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: u(38),
  },
  mastheadCopy: {
    width: u(267),
    paddingTop: u(1),
    marginRight: u(30),
  },
  name: {
    fontFamily: "Helvetica",
    fontSize: u(28),
    fontWeight: 700,
    lineHeight: 1.05,
    letterSpacing: u(-0.42),
  },
  role: {
    fontFamily: "Helvetica",
    fontSize: u(16),
    lineHeight: 1.32,
    letterSpacing: u(-0.08),
    color: "#3d3d3d",
    marginTop: u(5),
    maxWidth: u(270),
  },
  portraitFrame: {
    width: u(124),
    height: u(148),
    marginTop: u(2),
    marginRight: u(30),
    overflow: "hidden",
    borderRadius: 3,
  },
  portrait: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  portraitEmpty: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
  },
  contactList: {
    width: u(190),
    paddingTop: u(2),
  },
  contactText: {
    fontFamily: "Helvetica",
    fontSize: u(10.2),
    lineHeight: 1.55,
    color: "#2e2e2e",
    marginBottom: u(3),
  },
  contactLink: {
    fontFamily: "Helvetica",
    fontSize: u(10.2),
    lineHeight: 1.55,
    color: "#2e2e2e",
    textDecoration: "none",
    marginBottom: u(3),
  },

  /* Grid: quiet section rail, no rules */
  grid: {
    width: "100%",
    flexGrow: 1,
    justifyContent: "space-between",
  },
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: u(16),
  },
  labelCell: {
    width: u(178),
    paddingRight: u(28),
  },
  label: {
    fontFamily: "Helvetica",
    fontSize: u(12.5),
    lineHeight: 1.45,
    letterSpacing: u(-0.06),
    color: "#7d7d7d",
  },
  contentCell: {
    width: u(435),
  },

  /* About */
  summary: {
    width: "100%",
    fontSize: u(9.9),
    lineHeight: 1.55,
    color: SOFT_INK,
  },

  /* Experience */
  experienceEntry: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: u(18),
  },
  experienceEntryLast: {
    marginBottom: 0,
  },
  experienceMeta: {
    width: u(150),
    flexShrink: 0,
    marginRight: u(22),
  },
  experienceRole: {
    fontFamily: "Helvetica-Bold",
    fontSize: u(10.5),
    lineHeight: 1.35,
    letterSpacing: u(-0.05),
    color: INK,
  },
  company: {
    fontFamily: "Helvetica-Bold",
    fontSize: u(10.5),
    lineHeight: 1.35,
    color: INK,
  },
  period: {
    fontSize: u(9.9),
    lineHeight: 1.45,
    color: MUTED,
    marginTop: u(3),
  },
  location: {
    fontSize: u(9.9),
    lineHeight: 1.45,
    color: MUTED,
  },
  experienceDetail: {
    flexGrow: 1,
    flexShrink: 1,
    width: u(263),
  },
  bullets: {
    width: "100%",
  },
  bulletText: {
    width: "100%",
    fontSize: u(9.8),
    lineHeight: 1.55,
    color: SOFT_INK,
    marginBottom: u(4),
  },

  /* Education */
  educationColumns: {
    flexDirection: "row",
  },
  educationColumn: {
    width: u(202),
    marginRight: u(30),
  },
  educationColumnLast: {
    width: u(202),
  },
  educationEntry: {
    marginBottom: u(9),
  },
  educationEntryLast: {
    marginBottom: 0,
  },
  educationTitle: {
    width: "100%",
    fontFamily: "Helvetica-Bold",
    fontSize: u(10.5),
    lineHeight: 1.3,
    letterSpacing: u(-0.05),
    color: INK,
  },
  educationSubtitle: {
    width: "100%",
    fontFamily: "Helvetica",
    fontSize: u(10),
    lineHeight: 1.35,
    color: "#444444",
  },
  educationPeriod: {
    width: "100%",
    fontSize: u(9.8),
    lineHeight: 1.4,
    color: MUTED,
  },

  /* Skills */
  skills: {
    width: "100%",
    flexDirection: "row",
  },
  skillGroup0: {
    width: u(167),
    paddingRight: u(22),
  },
  skillGroup1: {
    width: u(157),
    paddingRight: u(22),
  },
  skillGroup2: {
    width: u(111),
  },
  skillLabel: {
    fontFamily: "Roboto Mono",
    fontSize: u(8),
    lineHeight: 1.4,
    letterSpacing: u(0.56),
    textTransform: "uppercase",
    color: MUTED,
  },
  skillList: {
    marginTop: u(5),
  },
  skillText: {
    fontSize: u(9.8),
    lineHeight: 1.5,
    color: SOFT_INK,
    marginBottom: u(1),
  },

  /* Additional */
  additional: {
    width: "100%",
    flexDirection: "row",
  },
  additionalGroup0: {
    width: u(214),
    paddingRight: u(28),
  },
  additionalGroup1: {
    width: u(193),
  },
  additionalLabel: {
    fontFamily: "Roboto Mono",
    fontSize: u(8),
    lineHeight: 1.4,
    letterSpacing: u(0.56),
    textTransform: "uppercase",
    color: MUTED,
  },
  additionalList: {
    marginTop: u(5),
  },
  additionalText: {
    fontSize: u(9.8),
    lineHeight: 1.5,
    color: SOFT_INK,
    marginBottom: u(1),
  },

  /* Footer */
  footer: {
    position: "absolute",
    left: u(76),
    right: u(76),
    bottom: u(30),
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: u(12),
    borderTopWidth: 0.6,
    borderTopColor: RULE_FAINT,
    borderStyle: "solid",
    fontFamily: "Roboto Mono",
    fontSize: u(8.2),
    letterSpacing: u(0.6),
    lineHeight: 1.4,
    textTransform: "uppercase",
    color: FAINT,
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
      language={labels.about.toLowerCase().includes("sobre") ? "es" : "en"}
      keywords="resume, curriculum, software development, junior developer, designer"
    >
      <Page size="A4" style={styles.page}>
        {/* Masthead: name/role, portrait, stacked contact */}
        <View style={styles.masthead}>
          <View style={styles.mastheadCopy}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.role}>{profile.role}</Text>
          </View>

          <View style={styles.portraitFrame}>
            {photo ? (
              <Image src={photo} style={styles.portrait} />
            ) : (
              <View style={styles.portraitEmpty} />
            )}
          </View>

          <View style={styles.contactList}>
            {data.contact.map((item) =>
              item.href ? (
                <Link key={item.label} src={item.href} style={styles.contactLink}>
                  {item.value}
                </Link>
              ) : (
                <Text key={item.label} style={styles.contactText}>
                  {item.value}
                </Text>
              ),
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
                  <View style={styles.experienceMeta}>
                    <Text style={styles.experienceRole}>{entry.role}</Text>
                    <Text style={styles.company}>{entry.company}</Text>
                    <Text style={styles.period}>{entry.period}</Text>
                    {entry.note ? (
                      <Text style={styles.location}>{entry.note}</Text>
                    ) : null}
                  </View>
                  <View style={styles.experienceDetail}>
                    <View style={styles.bullets}>
                      {entry.bullets.map((bullet) => (
                        <Text key={bullet} style={styles.bulletText}>
                          {bullet}
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
            <View style={styles.educationColumns}>
              {[data.education.slice(0, 3), data.education.slice(3)].map(
                (column, columnIndex) => (
                  <View
                    key={columnIndex}
                    style={
                      columnIndex === 0
                        ? styles.educationColumn
                        : styles.educationColumnLast
                    }
                  >
                    {column.map((entry, index) => (
                      <View
                        key={`${entry.period}-${entry.title}`}
                        style={[
                          styles.educationEntry,
                          index === column.length - 1
                            ? styles.educationEntryLast
                            : {},
                        ]}
                      >
                        <Text style={styles.educationTitle}>{entry.title}</Text>
                        <Text style={styles.educationSubtitle}>
                          {entry.subtitle}
                        </Text>
                        <Text style={styles.educationPeriod}>{entry.period}</Text>
                      </View>
                    ))}
                  </View>
                ),
              )}
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
                          {item}
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
                      {item}
                    </Text>
                  ))}
                </View>
              </View>
              <View style={styles.additionalGroup1}>
                <Text style={styles.additionalLabel}>
                  {labels.recognitions}
                </Text>
                <View style={styles.additionalList}>
                  {data.additional.recognitions.map((item) => (
                    <Text key={item} style={styles.additionalText}>
                      {item}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </ResumeRow>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{data.footerNote}</Text>
          <Text>
            {labels.page} 1 / 1 · {profile.displayName}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default ResumeDocument;
