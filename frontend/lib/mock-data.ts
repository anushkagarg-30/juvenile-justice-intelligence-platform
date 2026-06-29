import type { AnalysisResult, CaseAnalysisInput, Country, GeneratedReport, SimilarCase } from "./types";

export const EMPTY_CASE_INPUT: CaseAnalysisInput = {
  country: "",
  juvenileAge: "",
  offenseType: "",
  priorRecord: "",
  caseFacts: "",
  legalQuestion: "",
  comparisonCountries: [],
};

/** Used for mock/demo results only — not for prefilling the intake form. */
export const DEFAULT_CASE_INPUT: CaseAnalysisInput = {
  country: "United States",
  juvenileAge: "15",
  offenseType: "Cybercrime",
  priorRecord: "No prior offenses",
  caseFacts:
    "15-year-old accessed a school network without authorization and altered grades for classmates. No financial gain. First offense. School reported the incident.",
  legalQuestion:
    "What dispositions are most likely for a first-time juvenile cybercrime offender, and which statutes apply?",
  comparisonCountries: ["United States", "United Kingdom"],
};

const _MOCK_SIMILAR_CASES_RAW = [
  {
    id: "1",
    title: "In re Davis",
    country: "United States",
    jurisdiction: "New York",
    year: 2022,
    offenseType: "Cybercrime",
    similarity: 0.809,
    summary: "Unauthorized school network access and grade alteration without financial gain.",
    relevance:
      "Nearly identical fact pattern: first offense, school-based unauthorized access, rehabilitative disposition.",
    outcome: "Restitution; 12-month probation; cyber ethics course",
    sourceUrl: "https://www.courtlistener.com/",
  },
  {
    id: "2",
    title: "In re Green",
    country: "United States",
    jurisdiction: "Missouri",
    year: 2023,
    offenseType: "Cybercrime",
    similarity: 0.805,
    summary: "Juvenile sold exam answers obtained by hacking a teacher email account.",
    relevance: "Shows academic cyber-fraud handled through probation rather than detention.",
    outcome: "School expulsion hearing; probation; restitution",
    sourceUrl: "https://www.courtlistener.com/",
  },
  {
    id: "3",
    title: "In re Wilson",
    country: "United States",
    jurisdiction: "Michigan",
    year: 2021,
    offenseType: "Cybercrime",
    similarity: 0.789,
    summary: "Online threats sent to a teacher; no physical threat carried out.",
    relevance: "Useful comparator for digital conduct with no violence or prior record.",
    outcome: "Counseling; no-contact order; probation",
    sourceUrl: "https://www.courtlistener.com/",
  },
  {
    id: "4",
    title: "In re Walker",
    country: "United States",
    jurisdiction: "Oregon",
    year: 2023,
    offenseType: "Cybercrime",
    similarity: 0.788,
    summary: "Phishing email used to obtain classmate login credentials.",
    relevance: "Credential theft at school aligns with unauthorized access theories.",
    outcome: "Cyber ethics education; probation",
    sourceUrl: "https://www.courtlistener.com/",
  },
  {
    id: "5",
    title: "In re Moore",
    country: "United States",
    jurisdiction: "Colorado",
    year: 2023,
    offenseType: "Cybercrime",
    similarity: 0.786,
    summary: "Gaming account hacked to steal virtual currency without real-world loss.",
    relevance: "Demonstrates technology restrictions as a common juvenile disposition.",
    outcome: "Account restoration; technology restriction; probation",
    sourceUrl: "https://www.courtlistener.com/",
  },
  {
    id: "6",
    title: "In re White",
    country: "United States",
    jurisdiction: "Virginia",
    year: 2022,
    offenseType: "Cybercrime",
    similarity: 0.784,
    summary: "Non-consensual sharing of embarrassing peer images online.",
    relevance: "Digital harm case resolved with counseling and literacy programs.",
    outcome: "Counseling; probation; digital literacy program",
    sourceUrl: "https://www.courtlistener.com/",
  },
  {
    id: "7",
    title: "In re Chen",
    country: "United States",
    jurisdiction: "California",
    year: 2023,
    offenseType: "Cybercrime",
    similarity: 0.78,
    summary: "Fake social media accounts used to harass a classmate.",
    relevance: "School-reported cyber misconduct with no prior delinquency history.",
    outcome: "Counseling; restraining order compliance; probation",
    sourceUrl: "https://www.courtlistener.com/",
  },
  {
    id: "8",
    title: "In re Young",
    country: "United States",
    jurisdiction: "Nevada",
    year: 2021,
    offenseType: "Cybercrime",
    similarity: 0.78,
    summary: "False bomb threat posted on social media; quickly recanted.",
    relevance: "Illustrates threat-related cyber conduct handled with evaluation and probation.",
    outcome: "Psychiatric evaluation; probation; apology letter",
    sourceUrl: "https://www.courtlistener.com/",
  },
  {
    id: "9",
    title: "R v. T (Juvenile)",
    country: "United Kingdom",
    jurisdiction: "England & Wales",
    year: 2022,
    offenseType: "Computer Misuse",
    similarity: 0.742,
    summary: "16-year-old accessed school systems to view confidential records.",
    relevance: "Cross-jurisdiction comparator for unauthorized access without commercial motive.",
    outcome: "Youth rehabilitation order; IT education component",
    sourceUrl: "https://www.bailii.org/",
  },
  {
    id: "10",
    title: "In re J.M.",
    country: "United States",
    jurisdiction: "California",
    year: 2021,
    offenseType: "Shoplifting",
    similarity: 0.714,
    summary: "First-time shoplifting of electronics; cooperative parents.",
    relevance: "Lower-similarity baseline showing diversion for first offenders.",
    outcome: "Diversion program completed; case dismissed",
    sourceUrl: "https://www.courtlistener.com/",
  },
];

export const MOCK_SIMILAR_CASES: SimilarCase[] = _MOCK_SIMILAR_CASES_RAW.map((item) => ({
  ...item,
  country: item.country as Country,
  facts: item.summary,
}));

export const MOCK_REPORT: GeneratedReport = {
  id: "demo-report-001",
  title: "Legal Research Report — Juvenile Cybercrime",
  generatedAt: new Date().toISOString(),
  executiveSummary:
    "The submitted case involves a 15-year-old with no prior record charged with unauthorized school network access. Semantic retrieval identified eight highly similar U.S. cybercrime precedents and two lower-similarity comparators. Courts consistently favored probation, education, and restorative measures over secure detention for first-time digital offenses.",
  applicableLaws:
    "Primary statutory frameworks include the Computer Fraud and Abuse Act (18 U.S.C. § 1030) for unauthorized access, 18 U.S.C. § 5032 governing federal juvenile delinquency proceedings, and state juvenile court jurisdiction statutes. Cross-jurisdiction review suggests analogous computer misuse provisions in the UK Youth Court framework.",
  topPrecedents:
    "In re Davis (NY 2022) and In re Green (MO 2023) are the strongest precedents: both involve first-time juvenile cyber misconduct tied to school systems, resulting in probation and educational interventions. Outcomes across the top eight cybercrime matches show probation in 87.5% of cases.",
  crossCountryComparison:
    "U.S. cases emphasize probation plus digital literacy or cyber ethics programming. The UK comparator (R v. T) applied a youth rehabilitation order with an IT education component, suggesting convergent rehabilitative approaches across jurisdictions despite different statutory labels.",
  legalArgumentSuggestions:
    "Counsel should emphasize the absence of prior offenses, lack of financial motive, school cooperation, and alignment with rehabilitative juvenile justice principles. Request diversion or probation with a tailored cyber ethics program and restitution where grade integrity was affected.",
  citations: [
    "Computer Fraud and Abuse Act § 1030",
    "18 U.S.C. § 5032",
    "In re Davis (2022)",
    "In re Green (2023)",
    "R v. T (Juvenile) (2022)",
  ],
  fullMarkdown: `## Legal Research Report

**Date:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

### 1. Case Summary
A 15-year-old with no prior record is charged with unauthorized school network access and grade alteration.

### 2. Similar Precedents
Eight of ten retrieved cases involve cybercrime by juveniles aged 15–17 with no prior offenses. Probation is the dominant disposition.

### 3. Applicable Law
CFAA § 1030 and federal juvenile delinquency statutes apply at the federal level; state juvenile codes govern parallel proceedings.

### 4. Legal Analysis
The fact pattern aligns with school-based unauthorized access cases resolved through rehabilitative dispositions.

### 5. Possible Outcomes
Probation, cyber ethics education, counseling, restitution, and technology restrictions are most likely.

### 6. Recommendations
Advocate for education-focused disposition and highlight first-offense status.

---
*This report provides AI-assisted legal research support and does not replace professional legal judgment.*`,
};

export const MOCK_ANALYSIS_RESULT: AnalysisResult = {
  input: DEFAULT_CASE_INPUT,
  caseSummary:
    "A 15-year-old in the United States is facing cybercrime charges with no prior offenses after unauthorized school network access and grade alteration.",
  similarCases: MOCK_SIMILAR_CASES,
  laws: [
    {
      id: "law-1",
      name: "Computer Fraud and Abuse Act",
      section: "1030",
      country: "United States",
      topic: "Cybercrime",
      text: "Prohibits unauthorized access to protected computers and related offenses.",
      sourceUrl: "https://uscode.house.gov/",
    },
    {
      id: "law-2",
      name: "18 U.S.C.",
      section: "5032",
      country: "United States",
      topic: "Federal Juvenile Delinquency",
      text: "Governs how juveniles are processed for federal offenses.",
      sourceUrl: "https://uscode.house.gov/",
    },
    {
      id: "law-3",
      name: "JJDPA",
      section: "223",
      country: "United States",
      topic: "Deinstitutionalization",
      text: "Limits secure detention for status offenders and supports community alternatives.",
      sourceUrl: "https://uscode.house.gov/",
    },
    {
      id: "law-4",
      name: "Computer Misuse Act",
      section: "1",
      country: "United Kingdom",
      topic: "Unauthorized Access",
      text: "Criminalizes unauthorized access to computer material.",
      sourceUrl: "https://www.legislation.gov.uk/",
    },
    {
      id: "law-5",
      name: "Juvenile Justice (Care and Protection) Act",
      section: "14",
      country: "India",
      topic: "Juvenile Jurisdiction",
      text: "Establishes procedures for juveniles in conflict with law.",
      sourceUrl: "https://legislative.gov.in/",
    },
  ],
  constitutionalProtections: [
    {
      id: "const-1",
      name: "Roper v. Simmons",
      citation: "543 U.S. 551",
      country: "United States",
      summary: "Prohibits the death penalty for offenses committed by juveniles under 18.",
      relevance: "Establishes heightened Eighth Amendment protections for juvenile offenders.",
    },
    {
      id: "const-2",
      name: "Graham v. Florida",
      citation: "560 U.S. 48",
      country: "United States",
      summary: "Bars life without parole for non-homicide juvenile offenses.",
      relevance: "Reinforces proportionality limits in juvenile sentencing.",
    },
    {
      id: "const-3",
      name: "McKeiver v. Pennsylvania",
      citation: "403 U.S. 528",
      country: "United States",
      summary: "Juveniles do not have a constitutional right to a jury trial in delinquency proceedings.",
      relevance: "Relevant to procedural strategy in juvenile court advocacy.",
    },
  ],
  report: MOCK_REPORT,
  reportReady: true,
};

export const FEATURES = [
  {
    title: "Top 10 Similar Case Retrieval",
    description: "Semantic vector search surfaces the most factually analogous juvenile precedents in seconds.",
    icon: "Search",
  },
  {
    title: "Cross-Jurisdiction Legal Comparison",
    description: "Compare dispositions and legal frameworks across the U.S., UK, and India.",
    icon: "Globe",
  },
  {
    title: "Statute & Constitutional Provision Finder",
    description: "Retrieve applicable statutes, regulations, and constitutional protections automatically.",
    icon: "Scale",
  },
  {
    title: "AI-Generated Legal Research Reports",
    description: "Produce structured, citation-backed research memos ready for counsel review.",
    icon: "FileText",
  },
  {
    title: "Semantic Search with Vector Embeddings",
    description: "Powered by pgvector and Gemini embeddings for meaning-based legal retrieval.",
    icon: "Brain",
  },
  {
    title: "Lawyer-Focused Case Analysis",
    description: "Built for attorneys, researchers, and policy analysts — not generic chat.",
    icon: "Briefcase",
  },
] as const;

export const WORKFLOW_STEPS = [
  {
    step: 1,
    title: "Enter juvenile case facts",
    description: "Structured intake captures jurisdiction, offense, prior record, and legal questions.",
  },
  {
    step: 2,
    title: "Retrieve relevant laws and provisions",
    description: "Vector search matches statutes and constitutional protections to your fact pattern.",
  },
  {
    step: 3,
    title: "Match top 10 similar cases",
    description: "Ranked precedents with similarity scores, outcomes, and relevance explanations.",
  },
  {
    step: 4,
    title: "Generate legal research report",
    description: "AI synthesizes findings into an export-ready research memo with citations.",
  },
] as const;

export const METRICS = [
  { value: "10,000+", label: "Searchable case records" },
  { value: "Top 10", label: "Semantic case retrieval" },
  { value: "70%", label: "Reduction in simulated research time" },
  { value: "3", label: "Jurisdiction comparison" },
] as const;
