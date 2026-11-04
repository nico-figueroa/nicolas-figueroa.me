// Fit assessment utility functions for evaluating candidate skills, experience, and educational background against job requirements

import profile from "../content/profile.json" with { type: "json" };
import projects from "../content/projects.json" with { type: "json" };
import evidence from "../content/evidence.json" with { type: "json" };
import {
  assessDuration,
  candidateSources,
  canonicalRequirementKey,
  normalizeCapabilities,
  validateAssessment,
} from "./fit-requirements.mjs";

// Additional skill signals to consider beyond documented skills, such as cloud platforms, programming languages, and infrastructure tools
const additionalSkillSignals = [
  "AWS",
  "Kubernetes",
  "Terraform",
  "Java",
  "C#",
  "Go",
  "GraphQL",
  "MongoDB",
  "Redis",
  "Kafka",
  "GCP",
  "Azure",
  "DevOps",
  "Cybersecurity",
  "CI/CD",
  "Infrastructure as Code",
  "Automation"
];

// Combine documented skills with additional skill signals
const candidateSkills = [...new Set([
  ...Object.values(profile.skills).flat(),
  ...projects.flatMap((project) => project.technologies),
])];

// Normalize candidate skills to lowercase for consistent comparison
const documentedSkills = new Set(candidateSkills.map((skill) => skill.toLowerCase()));

// Map skill relationships to lowercase for consistent comparison
const skillRelationships = [
  { skill: "JavaScript", aliases: ["JS", "ECMAScript", "JavaScript language", "JavaScript framework", "JavaScript library"] },
  { skill: "Node.js", aliases: ["NodeJS", "Node JS", "Node.js runtime", "Node.js environment", "Node.js platform", "Node.js framework"] },
  { skill: "React", aliases: ["React.js", "ReactJS", "React library", "React framework", "React component", "React hooks"] },
  { skill: "PostgreSQL", aliases: ["Postgres", "PostgreSQL database", "PostgreSQL server", "PostgreSQL DB"] },
  { skill: "REST APIs", aliases: ["RESTful APIs", "RESTful API development", "REST API design", "REST API implementation"] },
  { skill: "Retrieval-augmented generation and embeddings", aliases: ["RAG", "retrieval augmented generation", "embeddings", "retrieval-augmented generation", "vector databases"] },
  { skill: "Full-stack application development", aliases: ["full stack development", "full-stack development", "full stack application development"] },
  { skill: "Cross-functional team leadership", aliases: ["cross functional leadership", "cross-functional collaboration", "cross-functional management"] },
  { skill: "ISO 9001, ISO 13485, and ISO 22716", aliases: ["ISO 9001", "ISO 13485", "ISO 22716", "ISO standards", "ISO compliance", "ISO certification"] },
  { skill: "React", aliases: ["Vue", "Vue.js", "Angular"], adjacent: true },
  { skill: "Azure", aliases: ["AWS", "GCP", "cloud platforms", "cloud computing", "cloud services", "cloud infrastructure", "cloud environment", "Azure platform", "Azure cloud", "Azure"], adjacent: true },
  { skill: "AWS", aliases: ["Azure", "GCP", "cloud platforms", "cloud computing", "cloud services", "cloud infrastructure", "cloud environment", "AWS platform", "AWS cloud", "AWS"], adjacent: true },
  { skill: "GCP", aliases: ["Azure", "AWS", "cloud platforms", "cloud computing", "cloud services", "cloud infrastructure", "cloud environment", "GCP platform", "GCP cloud", "GCP"], adjacent: true },
  { skill: "Cloud computing", aliases: ["Azure", "AWS", "GCP", "cloud platforms", "cloud services", "cloud infrastructure", "cloud environment", "cloud computing"], adjacent: true },
  { skill: "DevOps", aliases: ["CI/CD", "continuous integration", "continuous delivery", "continuous deployment", "infrastructure as code", "automation", "DevOps practices"], adjacent: true },
  { skill: "Cybersecurity", aliases: ["information security", "network security", "application security", "cyber defense", "cyber threats", "cyber attacks"], adjacent: true }
];

// Define degree levels for educational background assessment
const degreeLevels = [
  { rank: 3, name: "doctorate", pattern: /\b(?:ph\.?d\.?|doctorate|doctoral degree)\b/i },
  { rank: 2, name: "master", pattern: /\b(?:master(?:['’]s)?(?: of (?:science|arts))?(?: degree)?|m\.?s\.?c?\.?|m\.?a\.?)\b/i },
  { rank: 1, name: "bachelor", pattern: /\b(?:bachelor(?:['’]s)?(?: of (?:science|arts))?(?: degree)?|b\.?s\.?c?\.?|b\.?a\.?)\b/i },
];

// Define technical fields relevant to the candidate's background and expertise
const technicalFields = [
  "electrical engineering", "information management", "computer science",
  "computer engineering", "software engineering", "information systems",
  "information technology", "data science", "machine learning", "artificial intelligence", 
  "deep learning", "natural language processing", "computer vision",
  "reinforcement learning", "graph neural networks", "generative models",
  "computer graphics", "optimization",
  "cybersecurity", "networking", "cloud computing", 
  "human-computer interaction", "software architecture", "database systems",
  "process engineering", "quality engineering", "product engineering", "systems engineering",
  "mechanical engineering", "chemical engineering", "biomedical engineering",
  "industrial engineering", "materials science", "biotechnology", "nanotechnology",
  "risk management", "statistics", "probability", "data analysis", "mathematical modeling",
  "linear algebra", "calculus", "numerical methods", "lean manufacturing", "six sigma", 
  "project management", "agile methodologies", "scrum", "kanban", "waterfall", "risk assessment", "stakeholder management",
  "change management", "business analysis", "requirements engineering", "stakeholder analysis"
];

// Aggregate all candidate evidence into a single lowercase string for analysis
const candidateEvidence = [
  profile.summary,
  profile.experience.focus,
  ...profile.experience.positions.flatMap((position) => [
    position.title,
    position.organization,
    ...position.highlights,
  ]),
  ...profile.experience.industries,
  ...profile.education.flatMap((item) => [item.name, item.detail]),
  ...profile.achievements.flatMap((item) => [item.title, item.description]),
  ...profile.certifications.map((item) => item.name),
  ...candidateSkills,
  ...projects.flatMap((project) => [project.name, project.description]),
  ...evidence.flatMap((item) => [item.title, item.knowledge]),
].join(" ").toLowerCase();

// Define self-reported evidence for candidate claims
const selfReportedEvidence = [
  {
    id: "systems-engineering",
    claim: "Hands-on systems engineering background",
    matches: ["systems engineering background", "systems engineer", "systems engineering"],
    evidence: "Product quality engineering experience at Philips since 2018.",
  },
  {
    id: "practical-ml-systems",
    claim: "Practical experience in at least one listed ML-systems area",
    matches: [
      "practical experience in at least one of the following areas",
      "practical experience in at least one ml systems area",
    ],
    evidence: "AI_Engineering repository in GitHub, demonstrating practical experience in ML-systems areas.",
  },
  {
    id: "production-ml-framework",
    claim: "Production experience with PyTorch",
    matches: [
      "production experience with pytorch",
      "production experience with jax and/or pytorch",
      "production experience with jax or pytorch",
    ],
    evidence: "AI_Engineering repository in GitHub, demonstrating production experience with PyTorch.",
  },
  {
    id: "career-progression",
    claim: "Demonstrable career progression",
    matches: ["career progression", "career growth", "progressive experience"],
    evidence: "Supported by the documented progression through engineering and leadership roles.",
  },
  {
    id: "written-communication",
    claim: "Strong written communication",
    matches: ["written communication", "written communication skills"],
    evidence: "20+ years of professional experience in multiple roles requiring strong written communication.",
  },
  {
    id: "technical-explanation",
    claim: "Ability to explain complex technical decisions",
    matches: ["explain complex technical decisions", "explain complex technical", "technical decisions clearly"],
    evidence: "Demonstrated ability to explain complex technical decisions in professional settings.",
  },
];

// Define requirement patterns for role-specific and technical skills
const requirementPatterns = [
  {
    id: "mlops",
    label: "MLOps engineering",
    aliases: ["mlops"],
    category: "Role-specific practice",
    adjacent: ["AI applications", "Machine learning", "LLM and RAG pipelines", "technical operations"],
  },
  {
    id: "llm-performance",
    label: "LLM performance engineering",
    aliases: ["llm performance", "large language model performance"],
    category: "Role-specific practice",
    adjacent: ["LLM and RAG pipelines", "AI applications", "Machine learning"],
  },
  {
    id: "training-data",
    label: "ML-systems training-data design and evaluation",
    aliases: ["training data", "training and evaluation data", "ml systems tasks"],
    category: "Role-specific practice",
  },
  {
    id: "accelerator-kernels",
    label: "Accelerator-kernel development or optimization",
    aliases: ["accelerator kernels", "custom kernel development", "kernel optimization", "kernel development"],
    category: "ML systems",
  },
  {
    id: "performance-profiling",
    label: "Performance profiling and trace analysis",
    aliases: ["performance profiling", "profiling and trace analysis", "trace analysis", "profiler interpretation"],
    category: "ML systems",
  },
  {
    id: "distributed-debugging",
    label: "Distributed or accelerator-bound workload debugging",
    aliases: ["distributed workload debugging", "debugging distributed", "accelerator-bound workloads"],
    category: "ML systems",
  },
  {
    id: "llm-serving",
    label: "High-throughput LLM inference serving",
    aliases: ["high-throughput inference serving", "large-scale llm serving", "llm inference serving"],
    category: "ML systems",
  },
  {
    id: "jax-pytorch-production",
    label: "Production experience with JAX or PyTorch",
    aliases: ["production experience with jax and/or pytorch", "production experience with jax or pytorch", "production experience with jax", "production experience with pytorch"],
    category: "Production ML frameworks",
    evidenceId: "production-ml-framework",
  },
  {
    id: "practical-ml-systems",
    label: "Practical experience in at least one listed ML-systems area",
    aliases: [
      "practical experience in at least one of the following areas",
      "practical experience in at least one ml systems area",
    ],
    category: "ML systems experience",
    evidenceId: "practical-ml-systems",
  },
  {
    id: "multiple-ml-systems-areas",
    label: "Practical experience across multiple ML-systems areas (preferred)",
    aliases: ["experience across multiple areas", "experience across multiple ml systems areas"],
    category: "Preferred ML systems depth",
    weight: 0.5,
  },
  {
    id: "advanced-ml-systems",
    label: "Advanced ML systems: custom operators, sharding, distributed training, or compilers",
    aliases: ["custom operators", "sharding", "distributed training", "compiler and graph-level", "compiler work"],
    category: "Preferred ML systems depth",
    weight: 0.5,
  },
  {
    id: "accelerators",
    label: "Accelerator hardware and throughput, latency, or memory trade-offs",
    aliases: ["experience with accelerators", "throughput, latency, and memory trade-offs", "throughput, latency, and memory"],
    category: "Preferred hardware experience",
    weight: 0.5,
  },
  {
    id: "systems-background",
    label: "Hands-on systems engineering background",
    aliases: ["hands-on systems engineering background", "systems engineering background"],
    category: "Systems engineering",
    evidenceId: "systems-engineering",
  },
  {
    id: "career-progression",
    label: "Demonstrable career progression",
    aliases: ["career progression", "demonstrable career progression"],
    category: "Professional experience",
    evidenceId: "career-progression",
  },
  {
    id: "written-communication",
    label: "Strong written communication",
    aliases: ["strong written communication", "written communication"],
    category: "Communication",
    evidenceId: "written-communication",
  },
  {
    id: "technical-explanation",
    label: "Explain complex technical decisions clearly",
    aliases: ["explain complex technical decisions", "explain complex technical", "technical decisions clearly"],
    category: "Communication",
    evidenceId: "technical-explanation",
  },
  {
    id: "doctor-license",
    label: "Medical degree or physician qualification",
    aliases: ["physician", "medical doctor", "doctor of medicine", "m.d.", "m.d,", "m.d "],
    category: "Professional qualification",
  },
  {
    id: "medical-license",
    label: "Current medical license",
    aliases: ["medical license", "medical licensure", "licensed physician", "licensed doctor"],
    category: "Professional license",
  },
  {
    id: "board-certification",
    label: "Professional board certification",
    aliases: ["board-certified", "board certified", "board certification"],
    category: "Professional qualification",
  },
  {
    id: "clinical-practice",
    label: "Clinical practice or patient-care experience",
    aliases: ["clinical experience", "clinical practice", "patient care", "patient-care experience"],
    category: "Domain experience",
  },
  {
    id: "juris-doctor",
    label: "Juris Doctor or equivalent legal education",
    aliases: ["juris doctor", "j.d.", "law degree", "legal education"],
    category: "Professional qualification",
  },
  {
    id: "bar-admission",
    label: "Bar admission or legal-practice license",
    aliases: ["bar admission", "admission to the bar", "admitted to the bar", "bar license", "licensed attorney", "law license"],
    category: "Professional license",
  },
  {
    id: "legal-practice",
    label: "Legal practice, litigation, or contract work",
    aliases: ["legal practice", "litigation", "legal counsel", "contract drafting", "legal advice"],
    category: "Domain experience",
  },
];

// Aggregate all skill signals into a unique set for consistent comparison
const skillSignals = [...new Set([
  ...candidateSkills,
  ...additionalSkillSignals,
  "MLOps",
  "LLM",
  "JAX",
  "XLA",
  "TPU",
  "Pallas",
  "Triton",
  "CUDA",
  "CUTLASS",
  "Kineto",
  "torch.profiler",
  "Nsight",
  "vLLM",
  "SGLang",
  "TensorRT-LLM",
  "JetStream",
  "KV cache",
  "paged attention",
  "continuous batching",
  "pjit",
  "shard_map",
  "FSDP",
  "Megatron",
  "MaxText",
  "StableHLO",
  "torch.compile",
  "MLIR",
  "H100",
  "B200",
  "Trainium",
  "MI300",
  "Triton",
  "Python",
  "JavaScript",
  "SQL",
  "React",
  "Node.js",
  "PostgreSQL",
  "medical license",
  "Juris Doctor",
  "bar admission",
  "clinical experience",
])];

// Alternative tool signals for case-insensitive matching
const alternativeToolSignals = new Set([
  "mlops",
  "llm",
  "jax",
  "xla",
  "tpu",
  "pallas",
  "triton",
  "cuda",
  "cutlass",
  "kineto",
  "torch.profiler",
  "nsight",
  "vllm",
  "sglang",
  "tensorrt-llm",
  "jetstream",
  "kv cache",
  "paged attention",
  "continuous batching",
  "pjit",
  "shard_map",
  "fsdp",
  "megatron",
  "maxtext",
  "stablehlo",
  "torch.compile",
  "mlir",
  "h100",
  "b200",
  "trainium",
  "mi300",
  "azure",
  "devops",
  "cybersecurity",
  "ci/cd",
  "infrastructure as code",
  "automation"
]);

// Qualification and role duty cues for parsing job descriptions
const qualificationCues = /\b(?:must|minimum|at least|required|requirement|qualification|experience|experienced|proficiency|proficient|expertise|expert|knowledge|ability|able to|degree|license|licen[cs]e|certification|certified|skill|skilled|background|strong|excellent|demonstrable|demonstrated|familiar|familiarity)\b/i;
const roleDutyCues = /\b(?:lead|manage|design|develop|build|deliver|provide|ensure|implement|maintain|analy[sz]e|support|create|perform|debug|optimi[sz]e|own)\b/i;
const sectionHeading = /^(?:#{1,4}\s*)?(?:(?:(?:required|preferred|minimum|basic|desired) )?(?:requirements|qualifications|experience|skills)|about the (?:role|job)|role overview|key responsibilities|responsibilities|what you(?:'|’)ll do|what you will do|what you bring|essential functions|duties)\s*:?$/i;
const criteriaHeading = /^(?:#{1,4}\s*)?(?:(?:(?:required|preferred|minimum|basic|desired) )?(?:requirements|qualifications|experience|skills)|key responsibilities|responsibilities|what you(?:'|’)ll do|what you will do|what you bring|essential functions|duties)\s*:?$/i;
const nonCriteriaHeading = /^(?:#{1,4}\s*)?(?:benefits(?: and perks)?|perks(?: and benefits)?|compensation(?: and benefits)?|salary(?: and benefits)?|total rewards|what we offer|what you(?:'|’)ll (?:get|receive)|about (?:us|the company)|equal (?:employment )?opportunity(?: employer)?|how to apply|application process)(?:\s*:.*|\s*)$/i;
const benefitStatement = /\b(?:we (?:offer|provide)|you(?:'|’)ll (?:receive|enjoy)|benefits? include|benefits? package|compensation (?:package|range)|salary range)\b|^(?:paid (?:time off|holidays?|parental leave)|401\s*\(?k\)?|health (?:insurance|coverage)|dental (?:insurance|coverage)|vision (?:insurance|coverage)|tuition reimbursement|employee (?:benefits|discounts)|stock options)\b/i;
const employerCommentary = /^(?:we (?:value|believe|celebrate|are committed to|(?:do not|don't|don’t) (?:evaluate|measure|judge))|our (?:mission|vision|values|culture)|(?:equal (?:employment )?opportunity|all qualified applicants)\b)/i;
const inlineHeading = /(^|[\n.!?;]|\s)(?:(?:#{1,4}|\*\*)\s*)?((?:(?:required|preferred|minimum|basic|desired) )?(?:requirements|qualifications|skills)|about the (?:job|role)|key responsibilities|responsibilities|what you(?:'|’)ll do|what you will do|what you bring|essential functions|duties|benefits(?: and perks)?|perks(?: and benefits)?|compensation(?: and benefits)?|salary(?: and benefits)?|total rewards|what we offer|about (?:us|the company)|how to apply|application process)\s*(?:\*\*)?:\s*/gi;

// Extract role criteria text from job description
function roleCriteriaText(description) {
  let excluded = false;
  const lines = [];
  const normalized = description.replace(/\*\*/g, "")
    .replace(inlineHeading, "$1\n$2:\n")
    .replace(/([.!?;])(?=[A-Z][a-z])/g, "$1\n");
  for (const rawLine of normalized.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^[-*•]\s+/, "").replace(/\*\*/g, "");
    if (sectionHeading.test(line)) excluded = false;
    else if (nonCriteriaHeading.test(line)) { excluded = true; continue; }
    if (!excluded) {
      lines.push(line.split(/(?<=[.!?;])\s+/)
        .filter((sentence) => !benefitStatement.test(sentence) && !employerCommentary.test(sentence))
        .join(" "));
    }
  }
  return lines.join("\n");
}

// Escape special characters in a string for use in a regular expression
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Check if a text contains a specific phrase, ignoring case and word boundaries
function hasPhrase(text, phrase) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegex(phrase.toLowerCase())}([^a-z0-9]|$)`, "i")
    .test(text);
}

// Build a requirement object with default values and optional overrides
function buildRequirement(id, label, category, sourceText, {
  weight = 1,
  status = "gap",
  evidence = "",
  matchType = "none",
  evidenceId = "",
  normalizedKey = id,
  sources = [],
  confidence,
} = {}) {
  return { id, normalizedKey, label, category, sourceText, weight, status, evidence, matchType, evidenceId, sources, confidence };
}

// Extract the role title from a job description, if present and not generic
function roleTitle(description) {
  const firstLine = description.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
  if (/[.!?]/.test(firstLine) || /^(?:seeking|looking for|we are|you will)\b/i.test(firstLine)) return "";
  const title = firstLine
    .replace(/^#{1,6}\s*/, "")
    .replace(/^(?:job title|position|role)\s*:\s*/i, "")
    .split(/\s+(?:at|@)\s+/i)[0]
    .replace(/\s+\|\s+.*/, "")
    .replace(/[.!?].*$/, "")
    .trim();
  const wordCount = title.split(/\s+/).filter(Boolean).length;
  return title.length <= 120 && wordCount <= 12 ? title : "";
}

// Determine if a role title is generic or non-specific
function isGenericRoleTitle(title) {
  return !title
    || degreeLevels.some((level) => level.pattern.test(title))
    || sectionHeading.test(title)
    || nonCriteriaHeading.test(title)
    || /^(?:role overview|job description|about the (?:role|job)|key responsibilities|responsibilities|qualifications|requirements)$/i
      .test(title.replace(/:$/, ""));
}

// Extract qualification clauses from a job description, considering headings and cues
function extractQualificationClauses(description) {
  const lines = description.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const qualificationLines = [];
  let hasCriteriaHeading = false;
  let inQualifications = false;
  for (const line of lines) {
    if (sectionHeading.test(line)) {
      inQualifications = criteriaHeading.test(line);
      hasCriteriaHeading ||= inQualifications;
      continue;
    }
    if (inQualifications) qualificationLines.push(line);
  }
  const source = (qualificationLines.length ? qualificationLines : lines)
    .map((line) => line.replace(/\b(?:[BM]\.(?:Sc?|A)\.|Ph\.D\.)/gi, (degree) => degree.replaceAll(".", "")))
    .join("; ")
    .replace(/(?:^|\s)[•*-]\s+/g, ". ");
  return source
    .split(/(?<=[.!?;])\s+|\s*;\s*/)
    .map((clause) => clause.trim().replace(/^[,•*-]\s*/, ""))
    .filter((clause) =>
      clause.length >= 8
      && clause.length <= 500
      && (qualificationCues.test(clause)
        || degreeLevels.some((level) => level.pattern.test(clause))
        || roleDutyCues.test(clause)
        || (hasCriteriaHeading && clause.length >= 8)),
    );
}

// Extract education requirement details from a qualification clause
function educationRequirement(clause) {
  const levels = degreeLevels.filter((level) => level.pattern.test(clause));
  if (!levels.length && !/\bdegree\b/i.test(clause)) return null;
  if (/\b(?:juris|medical|medicine|law degree)\b/i.test(clause)) return null;
  const level = levels.sort((a, b) => a.rank - b.rank)[0] || degreeLevels[2];
  const degreeMatch = clause.match(level.pattern) || clause.match(/\bdegree\b/i);
  const afterDegree = clause.slice(degreeMatch ? degreeMatch.index + degreeMatch[0].length : 0)
    .replace(/^[.\s]+/, "");
  const fieldText = afterDegree.split(/\b(?:required|preferred|with)\b/i)[0];
  const explicitField = fieldText.match(/\bin\s+(.+)/i);
  const field = (explicitField ? explicitField[1] : fieldText)
    .replace(/^(?:degree\s+)?(?:in\s+)?/i, "")
    .split(/[,;]|\b(?:is|are|required|preferred|with|or (?:a )?related|or (?:equivalent|higher|above)|and (?:at least|minimum|\d|experience|proficiency|knowledge))\b/i)[0]
    .trim()
    .replace(/[.!?]+$/, "");
  return {
    level,
    field: /^(?:degree|education|any (?:field|discipline))?$/i.test(field) ? "" : field,
    relatedAllowed: /\b(?:related (?:field|discipline)|equivalent)\b/i.test(clause),
    exactLevel: /\b(?:exactly|only)\b/i.test(clause),
  };
}

// Match a candidate's education against a job requirement, considering level and field
function matchEducation(requirement) {
  const requested = educationRequirement(requirement.sourceText);
  if (!requested) return null;
  const degrees = profile.education
    .filter((item) => !/\b(?:partial|incomplete|studies)\b/i.test(`${item.name} ${item.detail}`))
    .map((item) => ({
      item,
      level: degreeLevels.find((level) => level.pattern.test(item.name)),
      field: item.name.split(/\bin\b/i).slice(1).join("in").trim().toLowerCase(),
    }))
    .filter((entry) => entry.level);
  const field = requested.field.toLowerCase();
  const candidates = degrees.map((entry) => {
    const direct = !field || field.includes(entry.field);
    const broader = field.split(/\s+(?:or|and)\s+/).some((part) =>
      /^(?:a |an )?engineering$/i.test(part)
        ? entry.field.includes("engineering")
        : /^(?:a |an )?(?:stem|technical field|science|scientific field)$/i.test(part)
          && technicalFields.includes(entry.field),
    );
    const related = technicalFields.some((name) => field.includes(name))
      && technicalFields.includes(entry.field);
    const fieldMatches = direct || broader || (related && requested.relatedAllowed);
    const levelMatches = requested.exactLevel
      ? entry.level.rank === requested.level.rank
      : entry.level.rank >= requested.level.rank;
    const status = fieldMatches && levelMatches ? "matched"
      : (direct || broader || related) ? "partial" : "gap";
    const matchType = status !== "matched" ? status === "partial" ? "adjacent" : "none"
      : entry.level.rank > requested.level.rank ? "exceeds"
        : direct ? "direct" : "equivalent";
    return { ...entry, status, matchType, fieldMatches, levelMatches };
  }).sort((a, b) =>
    ({ matched: 2, partial: 1, gap: 0 }[b.status] - { matched: 2, partial: 1, gap: 0 }[a.status])
    || b.level.rank - a.level.rank,
  );
  const best = candidates[0];
  if (!best) return null;
  const qualification = `${best.item.name} at ${best.item.institution}`;
  const reason = best.status === "matched"
    ? `${best.matchType === "exceeds" ? "Exceeds the minimum degree level" : "Meets the degree level"}; ${field ? `the documented field ${best.field} ${requested.relatedAllowed ? "satisfies the stated field or related-field allowance" : "supports the requested field"}` : "no specific field was required"}.`
    : best.status === "partial"
      ? `Related academic evidence, but ${!best.levelMatches ? "the requested degree level is not documented" : "the exact requested field is not documented and related fields were not explicitly accepted"}.`
      : "The documented degrees do not establish the requested field; a higher degree in another field is not automatically equivalent.";
  return {
    status: best.status, matchType: best.matchType, evidence: `${qualification}. ${reason}`,
    normalizedKey: `education-${requested.level.rank}-${requested.field.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${requested.relatedAllowed}`,
    sources: [{
      title: qualification, text: best.item.detail, url: profile.source, kind: "Completed education",
    }],
  };
}

// Check if a requirement has an alias that matches the given text
function requirementHasAlias(text, requirement) {
  return (requirement.aliases || []).some((alias) =>
    alias.includes(" ") || /[./-]/.test(alias)
      ? text.toLowerCase().includes(alias.toLowerCase())
      : hasPhrase(text, alias),
  );
}

// Match a job requirement against the candidate's profile, considering education, skills, and experience
function matchRequirement(requirement, jobText) {
  if (requirement.category === "Education") return matchEducation(requirement);
  const relationship = skillRelationships.find((item) =>
    item.aliases.some((alias) => alias.toLowerCase() === requirement.sourceText.toLowerCase())
    && documentedSkills.has(item.skill.toLowerCase()),
  );
  if (relationship) {
    return {
      status: relationship.adjacent ? "partial" : "matched",
      matchType: relationship.adjacent ? "adjacent" : "equivalent",
      sources: candidateSources.filter((source) => source.title === relationship.skill),
      evidence: relationship.adjacent
        ? `Documented ${relationship.skill} experience provides transferable concepts for ${requirement.label}, but does not establish experience with that specific technology.`
        : `${requirement.label} is supported by the documented ${relationship.skill} skill; the wording is equivalent or names a covered capability.`,
    };
  }
  if (requirement.evidenceId) {
    const report = selfReportedEvidence.find((item) => item.id === requirement.evidenceId);
    if (report && requirementHasAlias(requirement.sourceText, { aliases: report.matches })) {
      return {
        status: "matched",
        matchType: "direct",
        evidence: report.evidence,
        sources: [{ title: report.claim, text: report.evidence, url: "/journey/", kind: "Candidate-confirmed evidence" }],
      };
    }
  }

  // Compile candidate profile text for matching against job requirements
  const candidateText = `${candidateSkills.join(" ")} ${profile.experience.industries.join(" ")} ${profile.experience.positions.map((position) => position.title).join(" ")}`;
  const exactDocumentedSkill = candidateSkills.some((skill) =>
    skill.toLowerCase() === requirement.sourceText.toLowerCase()
      || skill.toLowerCase() === requirement.label.toLowerCase(),
  );

  // Check if the candidate has documented experience matching the requirement's source text or label
  const matchingExperience = [
    ...profile.experience.industries,
    ...profile.experience.positions.map((position) => position.title),
  ].some((item) =>
    matchesPhrase(item, requirement.sourceText) || matchesPhrase(item, requirement.label),
  );
  if (exactDocumentedSkill || matchingExperience) {
    return {
      status: "matched",
      matchType: "direct",
      evidence: "Supported by the LinkedIn-sourced profile or project record.",
      sources: candidateSources.filter((source) =>
        hasPhrase(`${source.title} ${source.text}`, requirement.sourceText),
      ).slice(0, 3),
    };
  }

  if (requirement.id === "mlops" || requirement.id === "llm-performance") {
    if (
      profile.skills.aiAndMachineLearning.some((item) =>
        requirement.label.toLowerCase().includes(item.toLowerCase()))
      || profile.skills.practices.some((item) =>
        requirement.label.toLowerCase().includes(item.toLowerCase()))
    ) {
      return {
        status: "partial",
        matchType: "adjacent",
        evidence: "AI/ML study and portfolio projects are documented; this specific production practice is not established by those sources.",
      };
    }
    if (requirement.adjacent?.some((skill) => documentedSkills.has(skill.toLowerCase()))) {
      return {
        status: "partial",
        matchType: "adjacent",
        evidence: "Related skills and projects are documented; this specific production practice is not established by those sources.",
      };
    }
  }

  if (requirement.id === "role-title") {
    if (/^(?:(?:junior|senior|lead|principal|staff|full.stack|backend|frontend)\s+)*(?:software|application)\s+(?:engineer|developer)/i.test(requirement.sourceText)) {
      return {
        status: "matched", matchType: "equivalent",
        evidence: "Deployed full-stack applications and software engineering repositories demonstrate the generic role capability; an identical employment title is not required.",
        sources: candidateSources.filter((source) => /Deployed portfolio project/.test(source.kind)).slice(0, 3),
      };
    }
    if (/engineer|engineering|mlops|systems/i.test(requirement.label)
      && /engineering|software|systems|technical/i.test(candidateEvidence)) {
      return {
        status: "partial",
        matchType: "adjacent",
        evidence: "The profile documents engineering and technical operations experience, but not this exact role title.",
      };
    }
  }

  return null;
}

// Add a requirement to the list if it is not already present, using the match result from matchRequirement
function addRequirement(requirements, requirement, jobText) {
  if (requirements.some((item) => item.id === requirement.id)) return;
  const match = matchRequirement(requirement, jobText);
  requirements.push(buildRequirement(
    requirement.id,
    requirement.label,
    requirement.category,
    requirement.sourceText,
    {
      weight: requirement.weight,
      evidenceId: requirement.evidenceId,
      ...match,
    },
  ));
}

// Extract and normalize requirements from a job description, including education, experience, and role-specific criteria
function extractRequirements(jobDescription) {
  jobDescription = roleCriteriaText(jobDescription);
  const requirements = [];
  const title = roleTitle(jobDescription);
  const clauses = extractQualificationClauses(jobDescription);
  const jobText = jobDescription.toLowerCase();
  requirements.push(...normalizeCapabilities([...clauses, title]));

  const academicClauses = clauses.flatMap((clause) =>
    clause.split(/\band\s+(?=(?:a\s+)?(?:bachelor|master|doctorate|doctoral|phd|bs|ms|ba|ma)\b)/i),
  );
  for (const [index, clause] of academicClauses.entries()) {
    if (!educationRequirement(clause)) continue;
    const academicClause = clause.split(/\band (?=(?:at least |a minimum of )?\d|\b(?:experience|proficiency|knowledge|expertise)\b)/i)[0].trim();
    addRequirement(requirements, {
      id: `education-${index}`,
      label: academicClause.replace(/[.!?;]+$/, ""),
      category: "Education",
      sourceText: academicClause,
    }, jobText);
  }

  const durations = clauses.flatMap((clause) =>
    [...clause.matchAll(/\b\d+(?:\s*[-–]\s*\d+)?\+?\s*(?:years?|yrs?)\b[^.;\n]*/gi)],
  );
  for (const [index, match] of durations.entries()) {
    requirements.push(buildRequirement(
      `experience-duration-${index}`,
      match[0].trim(),
      "Experience duration",
      match[0].trim(),
      assessDuration(match[0].trim()),
    ));
  }

  if (!isGenericRoleTitle(title)) {
    addRequirement(requirements, {
      id: "role-title",
      label: `Role-specific experience: ${title}`,
      category: "Role alignment",
      sourceText: title,
      weight: 1.5,
    }, jobText);
  }

  const confirmsOneMlSystemsArea = selfReportedEvidence
    .find((item) => item.id === "practical-ml-systems")
    ?.matches.some((phrase) => jobText.includes(phrase));
  const alternativeAreaIds = new Set([
    "accelerator-kernels",
    "performance-profiling",
    "distributed-debugging",
    "llm-serving",
    "advanced-ml-systems",
    "accelerators",
  ]);
  for (const pattern of requirementPatterns) {
    if (!requirementHasAlias(jobText, pattern)) continue;
    if (confirmsOneMlSystemsArea && alternativeAreaIds.has(pattern.id)) continue;
    addRequirement(requirements, {
      ...pattern,
      sourceText: pattern.aliases.find((alias) => jobText.includes(alias.toLowerCase())) || pattern.label,
    }, jobText);
  }

  const mentionedSignals = [...new Set([...skillSignals, ...skillRelationships.flatMap((item) => item.aliases)])]
    .filter((skill) => hasPhrase(jobText, skill));
  const signals = mentionedSignals.filter((skill) =>
    !mentionedSignals.some((longer) => longer.length > skill.length && hasPhrase(longer, skill)),
  )
    .sort((a, b) => b.length - a.length);
  for (const skill of signals) {
    if (normalizeCapabilities([skill]).some((item) => item.category === "Interpersonal and transferable capability")) continue;
    const key = skill.toLowerCase();
    if (alternativeToolSignals.has(key)) continue;
    const equivalent = skillRelationships.find((item) =>
      !item.adjacent && item.aliases.some((alias) => alias.toLowerCase() === key),
    );
    const canonicalKey = equivalent ? equivalent.skill.toLowerCase()
      : documentedSkills.has(key) ? key : key.replace(/\.js$/, "");
    const id = `skill-${canonicalKey.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    const existing = requirements.find((item) => item.id === id);
    if (existing) {
      existing.sourceTexts = [...new Set([...(existing.sourceTexts || [existing.sourceText]), skill])];
      continue;
    }
    const semanticKey = canonicalRequirementKey({ id, sourceText: skill });
    if (requirements.some((item) => item.category === "Engineering capability"
      && (item.normalizedKey === semanticKey || item.normalizedKey.startsWith(`${semanticKey}-`)))) continue;
    if (candidateSkills.some((item) => item.toLowerCase() === key)) {
      addRequirement(requirements, {
        id,
        label: skill,
        category: "Documented skill",
        sourceText: skill,
      }, jobText);
    } else {
      addRequirement(requirements, {
        id,
        label: skill,
        category: /license|doctor|juris|bar admission|clinical/i.test(skill)
          ? "Professional qualification"
          : "Role-specific skill",
        sourceText: skill,
      }, jobText);
    }
  }

  for (const report of selfReportedEvidence) {
    if (!report.matches.some((phrase) => jobText.includes(phrase))) continue;
    if (requirements.some((item) => item.id === report.id || item.evidenceId === report.id)) continue;
    addRequirement(requirements, {
      id: report.id,
      label: report.claim,
      category: "Candidate-confirmed experience",
      sourceText: report.matches.find((phrase) => jobText.includes(phrase)) || report.claim,
      evidenceId: report.id,
    }, jobText);
  }

  for (const clause of clauses) {
    const fragments = clause.split(/,\s*|\s+(?:and|with)\s+/i);
    if (normalizeCapabilities([clause]).length || fragments.length > 1) {
      for (const fragment of fragments) {
        if (normalizeCapabilities([fragment]).length || fragment.trim().length < 8) continue;
        if (educationRequirement(fragment)) continue;
        if (requirements.some((item) =>
          !["Engineering capability", "Industry domain", "Interpersonal and transferable capability"].includes(item.category)
          && (item.sourceTexts || [item.sourceText]).some((source) =>
            fragment.toLowerCase().includes(source.toLowerCase())
            || source.toLowerCase().includes(fragment.toLowerCase())),
        )) continue;
        if (!qualificationCues.test(fragment)
          && !/\b(?:endorsement|clearance|certificat|licen[cs]|experience|expert|proficien|knowledge|required)\b/i.test(fragment)) continue;
        const key = fragment.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        requirements.push(buildRequirement(`qualification-${key}`, fragment.trim(), "Other stated qualification", fragment.trim()));
      }
      continue;
    }
    const alreadyRepresented = requirements.some((item) =>
      (item.sourceTexts || [item.sourceText]).some((source) =>
        clause.toLowerCase().includes(source.toLowerCase())
        || source.toLowerCase().includes(clause.toLowerCase())),
    );
    if (alreadyRepresented) continue;

    const relevantPattern = requirementPatterns.find((item) =>
      item.aliases.some((alias) => clause.toLowerCase().includes(alias.toLowerCase())),
    );
    if (relevantPattern || [...selfReportedEvidence].some((item) =>
      item.matches.some((phrase) => clause.toLowerCase().includes(phrase)),
    )) continue;

    const key = clause.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
    if (requirements.some((item) => item.id === `qualification-${key}`)) continue;
    requirements.push(buildRequirement(
      `qualification-${key}`,
      clause.replace(/^[A-Z][^:]{0,40}:\s*/, "").replace(/[.!?;]+$/, ""),
      "Other stated qualification",
      clause,
    ));
  }

  return requirements;
}

// Create a growth projection for potential skill gaps, estimating the time required to reach proficiency levels
function matchesPhrase(text, phrase) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegex(phrase)}([^a-z0-9]|$)`, "i").test(text);
}

// Check if a text contains a specific phrase, considering word boundaries and ignoring case
function createGrowthProjection(potentialGaps) {
  const proficiencyTimelines = {
    beginner: { standard: [1, 2], cloud: [2, 3], infrastructure: [2, 4], professional: [12, 24] },
    intermediate: { standard: [4, 6], cloud: [6, 9], infrastructure: [6, 12], professional: [36, 60] },
    advanced: { standard: [12, 18], cloud: [18, 30], infrastructure: [18, 36], professional: [60, 120] },
  };
  const levels = [
    { key: "beginner", label: "Beginner", target: "Foundational working familiarity" },
    { key: "intermediate", label: "Intermediate", target: "Independent implementation and troubleshooting" },
    { key: "advanced", label: "Advanced", target: "Design, optimization, and mentoring-level depth" },
  ].map(({ key, label, target }) => {
    const skills = potentialGaps.map((requirement) => {
      const months = /license|licensed|board certification|juris doctor|medical degree|clinical practice|legal practice|professional qualification/i
        .test(requirement)
        ? proficiencyTimelines[key].professional
        : /aws|gcp|cloud|tpu|accelerator|hardware/i.test(requirement)
          ? proficiencyTimelines[key].cloud
          : /distributed|kernel|ml systems|compiler|sharding|serving/i.test(requirement)
            ? proficiencyTimelines[key].infrastructure
            : proficiencyTimelines[key].standard;
      return { skill: requirement, months };
    });
    const total = skills.reduce(
      ([minimum, maximum], item) => [
        minimum + item.months[0],
        maximum + item.months[1],
      ],
      [0, 0],
    );
    const format = ([minimum, maximum]) =>
      minimum === maximum ? `${minimum} month${minimum === 1 ? "" : "s"}` : `${minimum}–${maximum} months`;
    return {
      label,
      target,
      skills: skills.map((item) => ({ ...item, time: format(item.months) })),
      overall: {
        months: total,
        time: skills.length
        ? `${format(total)} if studied one skill at a time`
          : "No identified skill gaps",
      },
    };
  });

  return {
    label: "Illustrative learning estimate — not a guarantee",
    basis: "Ranges assume consistent part-time study of roughly 6–8 focused study hours per week and an existing technical foundation. Historical context includes the Full-Stack Engineer Career Path in about 3 months, the AI Engineer Career Path in about 1 month, and completion of an MS in Information Management while working full-time; that pace does not guarantee equivalent timelines for different skills. These estimates are not a basis for representing that someone holds a required professional license, degree, or certification; regulated qualifications require the appropriate formal education, examinations, and authorization. Actual progress varies with prior experience, practice, and the scope of each requirement. Overall totals assume sequential study.",
    levels,
  };
}

// Extract evidence from the candidate's profile that matches the job description, including skills, experience, and projects
function extractEvidence(jobDescription) {
  const text = roleCriteriaText(jobDescription).toLowerCase();
  const recognizedSkills = [...new Set([
    ...candidateSkills,
    ...additionalSkillSignals,
  ])].filter((skill) => matchesPhrase(text, skill));
  const relevantSkills = recognizedSkills.filter((skill) => documentedSkills.has(skill.toLowerCase())
    && !normalizeCapabilities([skill]).some((item) => item.category === "Interpersonal and transferable capability"));
  const relevantExperience = [
    ...new Set([
      ...profile.experience.organizations,
      ...profile.experience.industries,
      ...profile.experience.positions.flatMap((position) => [position.title, ...position.highlights]),
    ]
      .filter((item) => matchesPhrase(text, item))
      .map((item) => {
        const position = profile.experience.positions.find((entry) =>
          entry.title === item || entry.highlights.includes(item),
        );
        return position
          ? `${position.title} — ${position.organization} (${position.period})`
          : item;
      })),
  ];
  const relevantProjects = projects
    .map((project) => {
      const searchableText = `${project.name} ${project.description} ${project.technologies.join(" ")}`;
      const matches = recognizedSkills.filter((skill) => matchesPhrase(searchableText, skill));
      return { project, matches };
    })
    .filter((item) => item.matches.length > 0)
    .sort((left, right) => right.matches.length - left.matches.length)
    .slice(0, 5)
    .map(({ project, matches }) => ({
      name: project.name,
      reason: `Shares documented terms: ${matches.join(", ")}.`,
      source: project.source,
    }));

  return { recognizedSkills, relevantSkills, relevantExperience, relevantProjects };
}

// Analyze the fit between the job description and the candidate's profile, returning a structured report
export function analyzeFit(jobDescription) {
  const requirements = validateAssessment(extractRequirements(jobDescription));
  const evidence = extractEvidence(jobDescription);
  return buildFitReport(requirements, evidence);
}

// Build a comprehensive fit report based on the analyzed requirements and evidence, optionally using an LLM model for grounding
export function buildFitReport(requirements, evidence, {
  summary = "",
  excludedContent = [],
  model,
} = {}) {
  const relevantRequirements = requirements.filter((item) => item.status === "matched");
  const partialRequirements = requirements.filter((item) => item.status === "partial");
  const potentialGaps = requirements
    .filter((item) => item.status === "gap" && item.category !== "Industry domain")
    .map((item) => item.label);
  const domainGaps = requirements.filter((item) => item.status === "gap" && item.category === "Industry domain");
  const totalWeight = requirements.reduce((total, item) => total + item.weight, 0);
  const coveredWeight = requirements.reduce((total, item) =>
    total + (item.status === "matched" ? item.weight : item.status === "partial" ? item.weight * 0.35 : 0),
  0);
  const matchScore = totalWeight
    ? Math.round((coveredWeight / totalWeight) * 100)
    : 0;
  const growthProjection = createGrowthProjection(requirements
    .filter((item) => item.status === "gap"
      && (model
        ? ["Technical skill", "Engineering capability"].includes(item.category)
        : !["Industry domain", "Interpersonal and transferable capability"].includes(item.category)))
    .map((item) => item.label));

  return {
    assessmentMode: model ? "llm-grounded" : "rules-based",
    summary,
    excludedContent,
    matchScore,
    scoreExplanation: requirements.length
      ? `Evidence coverage = ${relevantRequirements.length} supported requirement(s), including direct, equivalent, or exceeding qualifications${partialRequirements.length ? ` plus ${partialRequirements.length} adjacent or partially supported requirement(s)` : ""}, weighted against ${requirements.length} extracted role requirement(s). Supported equivalents and higher qualifications receive full credit; adjacent evidence receives 35% credit.${model ? " Required criteria have weight 2; preferred criteria have weight 1. OpenAI classifies and assesses requirements against supplied portfolio records; code verifies quotations, evidence identifiers and result structure and calculates this score. These checks do not guarantee semantic accuracy, and AI judgments can be wrong." : ""} Degree level and field are evaluated separately. This is a transparent evidence estimate, not a hiring probability; unsupported credentials and experience are not assumed to be met.`
      : "No role requirements could be extracted from the submitted description, so this score is provisional rather than evidence of no fit.",
    requirements,
    validation: {
      passed: true,
      checks: model
        ? ["Original job passages attached by code", "Unique normalized requirements", "One assessment per requirement", "Verified evidence identifiers with source-owned excerpts", "Consistent result and evidence states", "Code-calculated score"]
        : ["Canonical requirement deduplication", "Consistent satisfied and gap results", "Degree level and field comparison", "Semantic capability evidence", "Separate industry-domain findings"],
    },
    supportedRequirements: relevantRequirements.map(({ label, evidence, matchType }) => ({
      label, evidence, matchType,
    })),
    relevantSkills: [...new Set([
      ...evidence.relevantSkills,
      ...relevantRequirements.filter((item) =>
        model ? ["Technical skill", "Engineering capability"].includes(item.category)
          : !["Interpersonal and transferable capability", "Education", "Experience duration", "Industry domain", "Role alignment"].includes(item.category),
      ).map((item) => item.label),
    ])],
    transferableCapabilities: requirements.filter((item) =>
      item.category === "Interpersonal and transferable capability"),
    partiallySupportedRequirements: partialRequirements.map(({ label, evidence }) => ({
      label,
      evidence,
    })),
    relevantExperience: evidence.relevantExperience,
    relevantProjects: evidence.relevantProjects,
    potentialGaps,
    domainGaps,
    growthProjection,
    source: profile.source,
    recommendedContent: evidence.relevantProjects.length
      ? evidence.relevantProjects.map(({ name, source }) => ({ title: name, url: source }))
      : [{ title: "Projects", url: "/projects/" }, { title: "Journey", url: "/journey/" }],
  };
}
