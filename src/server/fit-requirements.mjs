import profile from "../content/profile.json" with { type: "json" };
import projects from "../content/projects.json" with { type: "json" };

const portfolioSource = "https://github.com/nico-figueroa/nicolas-figueroa.me";

export const candidateSources = [
  ...Object.entries(profile.skills).flatMap(([group, skills]) => skills.map((skill) => ({
    title: skill, text: skill, url: profile.source, kind: `Profile: ${group}`,
  }))),
  ...profile.experience.positions.map((position) => ({
    title: position.title,
    text: `${position.title}. ${position.highlights.join(" ")}`,
    url: profile.source,
    kind: "Professional experience",
  })),
  ...projects.map((project) => ({
    title: project.name,
    text: `${project.description} ${project.technologies.join(", ")}${project.productionLinks?.length ? " Production deployment." : ""}`,
    url: project.source,
    kind: project.productionLinks?.length ? "Deployed portfolio project" : "Repository or academic project",
  })),
  ...profile.certifications.map((certificate) => ({
    title: certificate.name,
    text: certificate.name,
    url: certificate.credentialUrl || certificate.source,
    kind: "Certification or training",
  })),
  {
    title: "Portfolio architecture",
    text: "Astro components, separate content collections, stateless backend functions, and shared server helpers implement modular design and separation of concerns.",
    url: `${portfolioSource}/blob/main/docs/ARCHITECTURE.md`,
    kind: "Architecture documentation",
  },
  {
    title: "Portfolio product requirements",
    text: "Documented recruiter and hiring-manager needs are translated into Resume, project, Guide, and Fit features.",
    url: `${portfolioSource}/blob/main/docs/PRODUCT_REQUIREMENTS.md`,
    kind: "Requirements documentation",
  },
  {
    title: "Portfolio build and deployment",
    text: "Netlify runs npm run build and publishes dist on GitHub push; build configuration defines the deployment pipeline.",
    url: `${portfolioSource}/blob/main/netlify.toml`,
    kind: "Build and deployment configuration",
  },
  {
    title: "Portfolio API safeguards",
    text: "Backend API validation, bounded requests, rate limiting, environment-based secrets, HTTPS URL validation, and Content Security Policy.",
    url: `${portfolioSource}/blob/main/src/server/http.mjs`,
    kind: "Implemented API security practices",
  },
];

const canonicalSkillKeys = new Map([
  ["systems architecture, design, and implementation", "capability-software-architecture"],
  ["software architecture", "capability-software-architecture"],
  ["systems integration", "capability-system-integration"],
  ["rest api design and integration", "capability-system-integration"],
  ["application troubleshooting and technical support", "capability-debugging"],
  ["root-cause analysis", "capability-debugging"],
  ["docker", "capability-containerization"],
  ["application security", "capability-cybersecurity"],
  ["github oauth", "capability-cybersecurity"],
]);

export function canonicalRequirementKey(requirement) {
  const key = canonicalSkillKeys.get(requirement.sourceText.toLowerCase());
  return key || requirement.normalizedKey || requirement.id;
}

const capabilities = [
  {
    id: "software-design", label: "Software design",
    requested: /\b(?:software design|design(?:ing)? (?:software|applications?|systems?)|design(?=,| and development))\b/i,
    evidence: /\b(?:systems architecture, design|application design|full.stack engineer|architecture documentation)\b/i,
  },
  {
    id: "software-development", label: "Software development",
    requested: /\b(?:software (?:development|engineering lifecycle)|application development|development lifecycle|sdlc|develop(?:ing)? (?:software|applications?)|implementation)\b/i,
    evidence: /\b(?:full.stack|frontend, backend|React.*Node\.js|application development)\b/i,
  },
  {
    id: "software-testing", label: "Software testing",
    requested: /\b(?:software testing|testing|verification and validation)\b/i,
    evidence: /\b(?:testing|software validation|application validation)\b/i,
  },
  {
    id: "system-integration", label: "System integration",
    requested: /\b(?:(?:system|software|api|database|microservice|backend.frontend) integration|integration|integrat(?:e|ing) (?:software|systems?|apis?))\b/i,
    evidence: /\b(?:API design and integration|systems integration|REST API|tool calling|frontend, backend, APIs, databases)\b/i,
  },
  {
    id: "software-deployment", label: "Software deployment",
    requested: /\b(?:software deployment|deploy(?:ment|ing)?(?: software| applications?)?)\b/i,
    evidence: /\b(?:production deployment|deployed separately|Netlify runs)\b/i,
  },
  {
    id: "software-maintenance", label: "Software maintenance",
    requested: /\b(?:software maintenance|maintenance|maintain(?:ing)? (?:software|applications?|systems?))\b/i,
    evidence: /\b(?:application troubleshooting|Tier 2 support|support for proprietary company software|supported and improved software validation systems)\b/i,
  },
  {
    id: "software-architecture", label: "Software architecture",
    requested: /\b(?:(?:software|system|systems|solution|application) architecture|architecture documentation)\b/i,
    evidence: /\b(?:systems architecture|Astro components, separate content|architecture documentation)\b/i,
  },
  {
    id: "requirements-analysis", label: "Requirements analysis",
    requested: /\b(?:requirements analysis|(?:customer|stakeholder|business|software) requirements|feature planning|translat(?:e|ing) business requirements)\b/i,
    evidence: /\b(?:needs are translated|requirements analysis|stakeholder requirements)\b/i,
  },
  {
    id: "debugging", label: "Debugging and troubleshooting",
    requested: /\b(?:debugging|troubleshooting|root.cause analysis|defect resolution|issue investigation)\b/i,
    evidence: /\b(?:troubleshooting|root.cause analysis|remediat(?:e|ion).*security issues)\b/i,
  },
  {
    id: "cybersecurity", label: "Software security practices",
    requested: /\b(?:cybersecurity|secure coding|authentication|authorization|secrets management|api security|https|security practices)\b/i,
    evidence: /\b(?:authentication|OAuth|Application Security|environment.based secrets|API validation)\b/i,
  },
  {
    id: "containerization", label: "Containerization",
    requested: /\b(?:containerization|containerisation|Docker|container (?:workflows?|deployments?))\b/i,
    evidence: /\bDocker\b/i,
  },
  {
    id: "build-pipelines", label: "Build and deployment pipelines",
    requested: /\b(?:build pipelines?|ci\/cd|continuous integration|continuous delivery|deployment pipelines?|automated builds?)\b/i,
    evidence: /\bNetlify runs npm run build\b/i,
  },
  {
    id: "architecture-principles", label: "Architecture principles",
    requested: /\b(?:architecture principles|design patterns|modular design|separation of concerns|layered architecture)\b/i,
    evidence: /\b(?:modular design|separation of concerns)\b/i,
  },
];

const domains = [
  { id: "defense", label: "Defense mission-planning domain", requested: /\b(?:weapons?[- ]planning|defen[cs]e|military|mission[- ]planning)\b/i, evidence: /\b(?:defense|military|weapon|mission.planning)\b/i },
  { id: "medical-devices", label: "Medical-device domain", requested: /\bmedical.devices?\b/i, evidence: /\bmedical.device\b/i },
];

const humanSkills = [
  {
    id: "delivery", label: "Making progress and delivering outcomes",
    requested: /\b(?:make|making|drive|driving)\s+(?:meaningful\s+|steady\s+)?progress\b|\b(?:results.oriented|deliver(?:ing)? (?:results|outcomes)|get things done|execution skills)\b/i,
    evidence: /\b(?:stabilized priority|supported remediation workstreams|implemented|improved|operational continuity)\b/i,
  },
  {
    id: "collaboration", label: "Collaboration and interpersonal skills",
    requested: /\b(?:collaborat\w*|teamwork|team player|interpersonal|work(?:ing)? (?:well )?with (?:others|teams|stakeholders)|cross.functional (?:teams?|partners?|collaboration))\b/i,
    evidence: /\b(?:cross.functional partners|cross.functional team|core team|supervised|led.*(?:teams?|departments|groups))\b/i,
  },
  {
    id: "communication", label: "Communication and stakeholder interaction",
    requested: /\b(?:communication|communicat\w*|stakeholder (?:engagement|management)|presentations?|presenting|active listening)\b/i,
    evidence: /\b(?:stakeholder and executive communication|transferred critical operational knowledge|supported and trained|mentoring, training|taught)\b/i,
  },
  {
    id: "problem-solving", label: "Problem-solving and analytical judgment",
    requested: /\b(?:problem.solv\w*|critical thinking|analytical (?:skills|thinking)|resolv(?:e|ing) (?:issues|problems)|sound judgment)\b/i,
    evidence: /\b(?:troubleshooting|root.cause analysis|resolved agent accounting problems|remediation workstreams)\b/i,
  },
  {
    id: "leadership", label: "Leadership and mentoring",
    requested: /\b(?:leadership|mentor\w*|coach(?:ing)?|lead(?:ing)? (?:a |cross.functional )?teams?)\b/i,
    evidence: /\b(?:supervised|led|mentoring|managed.*(?:teams?|department|engineers))\b/i,
  },
  {
    id: "adaptability", label: "Adaptability and navigating change",
    requested: /\b(?:adaptab\w*|adapt(?:ing)? to change|ambiguity|changing priorities|learn quickly|continuous learning|self.directed|work independently|independent(?:ly)? work)\b/i,
    evidence: /\b(?:leadership transition|remediation|operational continuity|organizational remediation and transition)\b/i,
  },
];

function normalizeHumanSkills(clause, sources) {
  return humanSkills.filter((rule) => rule.requested.test(clause)).map((rule) => {
    const found = sourceMatches(rule.evidence, sources).filter((source) => /Professional experience|Profile: leadership/.test(source.kind));
    const specialized = /\b(?:clinical|therap(?:y|ist)|hostage|crisis negotiation|native.level|public speaking championship)\b/i.test(clause);
    const partial = found.length && specialized;
    return {
      id: `human-${rule.id}${specialized ? "-specialized" : ""}`,
      normalizedKey: `human-${rule.id}${specialized ? "-specialized" : ""}`,
      label: `${rule.label}${specialized ? " — specialized context" : ""}`,
      category: "Interpersonal and transferable capability", sourceText: clause, weight: 1,
      status: !found.length ? "gap" : partial ? "partial" : "matched",
      matchType: !found.length ? "none" : partial ? "adjacent" : "equivalent",
      evidence: !found.length ? "No supporting responsibilities or outcomes were found in the documented professional evidence."
        : `${found.slice(0, 3).map((source) => `${source.title}: ${source.text}`).join(" ")} These responsibilities and outcomes reasonably support the transferable capability; this is an evidence-based inference, not a claim about personality.${partial ? " The specialized context requires additional confirmation." : ""}`,
      sources: found.slice(0, 3), confidence: !found.length ? 0.6 : partial ? 0.65 : 0.8,
    };
  });
}

function sourceMatches(pattern, sources) {
  return sources.filter((source) => pattern.test(`${source.title} ${source.text}`));
}

function capabilityAssessment(rule, clause, sources) {
  const found = sourceMatches(rule.evidence, sources);
  const advanced = /\b(?:expert|advanced|large.scale|production.grade|specialist|deep expertise)\b/i.test(clause);
  const limited = /\b(?:certification|training|academic|coursework)\b/i;
  const onlyLearning = found.length && found.every((source) =>
    limited.test(source.kind) || /course repository|coursework|learning projects/i.test(source.text),
  );
  const specialized = /\b(?:zero.trust|penetration testing|cryptography|kubernetes|distributed systems|safety.critical|formal verification)\b/i.test(clause);
  const partial = found.length && ((advanced && onlyLearning) || specialized);
  const scope = partial ? `-${clause.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : "";
  return {
    id: `capability-${rule.id}${scope}`,
    normalizedKey: `capability-${rule.id}${scope}`,
    label: `${rule.label}${partial ? " — specialized or advanced scope" : ""}`,
    category: "Engineering capability",
    sourceText: clause,
    weight: 1,
    status: !found.length ? "gap" : partial ? "partial" : "matched",
    matchType: !found.length ? "none" : partial ? "adjacent" : "equivalent",
    evidence: !found.length
      ? "No supporting capability evidence was found in the documented sources."
      : `${found.map((source) => `${source.title}: ${source.text}`).slice(0, 3).join(" ")}${partial ? " This supports the basic capability, but not the requested specialized or advanced scope." : " This demonstrates the normalized capability; employment-only or identical wording is not required."}`,
    sources: found.slice(0, 3),
    confidence: !found.length ? 0.65 : partial ? 0.7 : 0.9,
  };
}

export function normalizeCapabilities(clauses, sources = candidateSources) {
  const requirements = [];
  for (const clause of clauses) {
    requirements.push(...normalizeHumanSkills(clause, sources));
    const lifecycle = /\b(?:software|applications?|engineering|development|design)\b/i.test(clause);
    for (const rule of capabilities) {
      const lifecycleList = lifecycle
        && (clause.match(/\b(?:design|development|testing|integration|maintenance)\b/gi) || []).length > 1
        && !/\bdesign patterns\b/i.test(clause);
      const listed = lifecycleList && ({
        "software-design": /\bdesign\b/i,
        "software-development": /\bdevelopment\b/i,
      }[rule.id]?.test(clause));
      if (!rule.requested.test(clause) && !listed) continue;
      requirements.push(capabilityAssessment(rule, clause, sources));
    }
    for (const domain of domains) {
      if (!domain.requested.test(clause)) continue;
      const found = sourceMatches(domain.evidence, sources);
      requirements.push({
        id: `domain-${domain.id}`, normalizedKey: `domain-${domain.id}`,
        label: domain.label, category: "Industry domain", sourceText: clause, weight: 1,
        status: found.length ? "matched" : "gap", matchType: found.length ? "direct" : "none",
        evidence: found.length ? found.map((source) => source.text).slice(0, 2).join(" ")
          : `${domain.label} experience is not demonstrated. This is separate from the engineering capabilities evaluated above.`,
        sources: found.slice(0, 2), confidence: 0.85,
      });
    }
  }
  return requirements;
}

function periodMonths(period) {
  const months = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 };
  const ends = [...period.matchAll(/(?:(January|February|March|April|May|June|July|August|September|October|November|December)\s+)?(\d{4})/gi)];
  if (ends.length !== 2) return null;
  return ends.map((end, index) => Number(end[2]) * 12 + (end[1] ? months[end[1].toLowerCase()] : index ? 11 : 0) + index);
}

function mergedYears(positions) {
  const ranges = positions.map((position) => periodMonths(position.period)).filter(Boolean).sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of ranges) {
    const previous = merged.at(-1);
    if (previous && start <= previous[1]) previous[1] = Math.max(previous[1], end);
    else merged.push([start, end]);
  }
  return Math.floor(merged.reduce((total, [start, end]) => total + end - start, 0) / 12);
}

export function assessDuration(text) {
  const minimum = Number(text.match(/\d+/)?.[0]);
  const scope = text.replace(/^\d+(?:\s*[-–]\s*\d+)?\+?\s*(?:years?|yrs?)\s*(?:of\s+)?/i, "")
    .replace(/\b(?:required|preferred|minimum|at least)\b[.!]*/gi, "").trim();
  const generic = /^(?:(?:relevant|related|professional|work|total|overall|industry)\s+)*(?:experience)?[.!]?$/i.test(scope);
  const engineering = /^(?:(?:professional|relevant)\s+)?engineering experience[.!]?$/i.test(scope);
  const positions = profile.experience.positions.filter((position) => generic
    || (engineering && /engineer|engineering/i.test(position.title)));
  const years = mergedYears(positions);
  const sources = positions.map((position) => ({
    title: `${position.title} (${position.period})`,
    text: position.highlights.join(" "), url: profile.source, kind: "Dated professional experience",
  }));
  const related = generic || engineering || /\b(?:software|systems|technical|quality|leadership|management)\b/i.test(scope);
  return {
    normalizedKey: `duration-${minimum}-${generic ? "professional" : scope.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    status: years >= minimum ? "matched" : related ? "partial" : "gap",
    matchType: years > minimum ? "exceeds" : years >= minimum ? "direct" : related ? "adjacent" : "none",
    evidence: years >= minimum
      ? `Dated ${generic ? "professional" : "engineering"} roles establish at least ${years} completed years after merging overlapping periods, satisfying the ${minimum}-year minimum.`
      : years ? `Dated roles establish ${years} completed years in this scope; the ${minimum}-year minimum is not established.`
        : related ? "Related capabilities are documented, but dated evidence does not establish the requested number of years in this specific practice."
          : "No dated evidence establishes the requested duration in this specific practice; general seniority does not prove specialist tenure.",
    sources, confidence: years >= minimum ? 0.95 : 0.75,
  };
}

const statusRank = { gap: 0, partial: 1, matched: 2 };
const matchRank = { none: 0, adjacent: 1, equivalent: 2, direct: 3, exceeds: 4 };

export function validateAssessment(requirements) {
  const normalized = new Map();
  for (const original of requirements) {
    const key = original.category === "Engineering capability"
      ? original.normalizedKey : canonicalRequirementKey(original);
    const previous = normalized.get(key);
    if (!previous) {
      normalized.set(key, { ...original, normalizedKey: key });
      continue;
    }
    const better = statusRank[original.status] > statusRank[previous.status]
      || (original.status === previous.status && matchRank[original.matchType] > matchRank[previous.matchType]);
    const winner = better ? original : previous;
    normalized.set(key, {
      ...winner, normalizedKey: key, label: previous.label,
      sourceTexts: [...new Set([...(previous.sourceTexts || [previous.sourceText]), ...(original.sourceTexts || [original.sourceText])])],
      sources: [...new Map([...(previous.sources || []), ...(original.sources || [])].map((source) => [`${source.url}|${source.title}`, source])).values()],
    });
  }
  const result = [...normalized.values()].map((item) => {
    const matched = item.status === "matched";
    if (!(item.status in statusRank) || !(item.matchType in matchRank)
      || (matched && !["direct", "equivalent", "exceeds"].includes(item.matchType))
      || (!matched && ["direct", "equivalent", "exceeds"].includes(item.matchType))) {
      throw new Error(`Fit assessment has inconsistent evidence for ${item.id}.`);
    }
    if (matched && !item.evidence.trim()) {
      throw new Error(`Fit assessment has no supporting justification for ${item.id}.`);
    }
    const evidence = item.evidence || "No reasonable supporting evidence was found in the documented profile, project, training, or architecture records.";
    return {
      ...item, evidence,
      evidenceType: ({ direct: "DIRECT", equivalent: "EQUIVALENT", exceeds: "EXCEEDS", adjacent: "ADJACENT", none: "NONE" })[item.matchType],
      confidence: item.confidence ?? (matched ? 0.9 : item.status === "partial" ? 0.65 : 0.6),
      result: matched ? item.matchType === "exceeds" ? "Exceeds" : "Meets" : item.status === "partial" ? "Partially Meets" : "Gap",
      sources: item.sources || [],
    };
  });
  if (new Set(result.map((item) => item.normalizedKey)).size !== result.length
    || result.some((item) => item.result === "Gap" && item.status !== "gap")) {
    throw new Error("Fit assessment failed its final consistency audit.");
  }
  return result;
}
