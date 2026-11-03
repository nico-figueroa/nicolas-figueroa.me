import profile from "../content/profile.json" with { type: "json" };
import projects from "../content/projects.json" with { type: "json" };

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
];

const candidateSkills = [...new Set([
  ...Object.values(profile.skills).flat(),
  ...projects.flatMap((project) => project.technologies),
])];
const documentedSkills = new Set(candidateSkills.map((skill) => skill.toLowerCase()));
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
  ...profile.certifications.map((item) => item.name),
  ...candidateSkills,
  ...projects.flatMap((project) => [project.name, project.description]),
].join(" ").toLowerCase();

const selfReportedEvidence = [
  {
    id: "systems-engineering",
    claim: "Hands-on systems engineering background",
    matches: ["systems engineering background", "systems engineer", "systems engineering"],
    evidence: "Explicitly confirmed by Nicolas in the job-fit feedback.",
  },
  {
    id: "practical-ml-systems",
    claim: "Practical experience in at least one listed ML-systems area",
    matches: [
      "practical experience in at least one of the following areas",
      "practical experience in at least one ml systems area",
    ],
    evidence: "Explicitly confirmed by Nicolas; the specific area and tools were not identified.",
  },
  {
    id: "production-ml-framework",
    claim: "Production experience with JAX or PyTorch",
    matches: ["production experience with jax and/or pytorch", "production experience with jax", "production experience with pytorch"],
    evidence: "Explicitly confirmed by Nicolas; the specific framework was not identified.",
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
    evidence: "Explicitly confirmed by Nicolas in the job-fit feedback.",
  },
  {
    id: "technical-explanation",
    claim: "Ability to explain complex technical decisions",
    matches: ["explain complex technical decisions", "explain complex technical", "technical decisions clearly"],
    evidence: "Explicitly confirmed by Nicolas in the job-fit feedback.",
  },
];

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
    aliases: ["production experience with jax and/or pytorch", "production experience with jax", "production experience with pytorch"],
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
]);

const qualificationCues = /\b(?:must|minimum|at least|required|requirement|qualification|experience|experienced|proficiency|proficient|expertise|expert|knowledge|ability|able to|degree|license|licen[cs]e|certification|certified|skill|skilled|background|strong|excellent|demonstrable|demonstrated|familiar|familiarity)\b/i;
const roleDutyCues = /\b(?:lead|manage|design|develop|build|deliver|provide|ensure|implement|maintain|analy[sz]e|support|create|perform|debug|optimi[sz]e|own)\b/i;
const sectionHeading = /^(?:#{1,4}\s*)?(?:requirements|qualifications|experience|skills|about the role|role overview|key responsibilities|responsibilities|what you(?:'|’)ll do|what you will do|what you bring|essential functions|duties)\s*:?$/i;
const criteriaHeading = /^(?:#{1,4}\s*)?(?:requirements|qualifications|experience|skills|key responsibilities|responsibilities|what you(?:'|’)ll do|what you will do|what you bring|essential functions|duties)\s*:?$/i;

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasPhrase(text, phrase) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegex(phrase.toLowerCase())}([^a-z0-9]|$)`, "i")
    .test(text);
}

function buildRequirement(id, label, category, sourceText, {
  weight = 1,
  status = "gap",
  evidence = "",
  matchType = "none",
  evidenceId = "",
} = {}) {
  return { id, label, category, sourceText, weight, status, evidence, matchType, evidenceId };
}

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

function isGenericRoleTitle(title) {
  return !title
    || /^(?:role overview|job description|about the role|key responsibilities|responsibilities|qualifications|requirements)$/i
      .test(title);
}

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
    .join(" ")
    .replace(/(?:^|\s)[•*-]\s+/g, ". ");
  return source
    .split(/(?<=[.!?;])\s+|\s*;\s*/)
    .map((clause) => clause.trim().replace(/^[,•*-]\s*/, ""))
    .filter((clause) =>
      clause.length >= 20
      && clause.length <= 500
      && (qualificationCues.test(clause) || (hasCriteriaHeading && roleDutyCues.test(clause))),
    );
}

function requirementHasAlias(text, requirement) {
  return (requirement.aliases || []).some((alias) =>
    alias.includes(" ") || /[./-]/.test(alias)
      ? text.toLowerCase().includes(alias.toLowerCase())
      : hasPhrase(text, alias),
  );
}

function matchRequirement(requirement, jobText) {
  if (requirement.evidenceId) {
    const report = selfReportedEvidence.find((item) => item.id === requirement.evidenceId);
    if (report && requirementHasAlias(jobText, requirement)) {
      return {
        status: "matched",
        matchType: "direct",
        evidence: report.evidence,
      };
    }
  }

  const candidateText = `${candidateSkills.join(" ")} ${profile.experience.industries.join(" ")} ${profile.experience.positions.map((position) => position.title).join(" ")}`;
  const exactDocumentedSkill = candidateSkills.some((skill) =>
    skill.toLowerCase() === requirement.sourceText.toLowerCase()
      || skill.toLowerCase() === requirement.label.toLowerCase(),
  );
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

function extractRequirements(jobDescription) {
  const jobText = jobDescription.toLowerCase();
  const requirements = [];
  const title = roleTitle(jobDescription);

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

  for (const skill of skillSignals) {
    if (!hasPhrase(jobText, skill)) continue;
    const key = skill.toLowerCase();
    if (alternativeToolSignals.has(key)) continue;
    const id = `skill-${key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    if (requirements.some((item) => item.id === id)) continue;
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

  for (const clause of extractQualificationClauses(jobDescription)) {
    const alreadyRepresented = requirements.some((item) =>
      clause.toLowerCase().includes(item.sourceText.toLowerCase())
      || item.sourceText.toLowerCase().includes(clause.toLowerCase()),
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

function matchesPhrase(text, phrase) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegex(phrase)}([^a-z0-9]|$)`, "i").test(text);
}

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

function extractEvidence(jobDescription) {
  const text = jobDescription.toLowerCase();
  const recognizedSkills = [...new Set([
    ...candidateSkills,
    ...additionalSkillSignals,
  ])].filter((skill) => matchesPhrase(text, skill));
  const relevantSkills = recognizedSkills.filter((skill) => documentedSkills.has(skill.toLowerCase()));
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

export function analyzeFit(jobDescription) {
  const requirements = extractRequirements(jobDescription);
  const evidence = extractEvidence(jobDescription);
  const relevantRequirements = requirements.filter((item) => item.status === "matched");
  const partialRequirements = requirements.filter((item) => item.status === "partial");
  const potentialGaps = requirements
    .filter((item) => item.status === "gap")
    .map((item) => item.label);
  const totalWeight = requirements.reduce((total, item) => total + item.weight, 0);
  const coveredWeight = requirements.reduce((total, item) =>
    total + (item.status === "matched" ? item.weight : item.status === "partial" ? item.weight * 0.35 : 0),
  0);
  const matchScore = totalWeight
    ? Math.round((coveredWeight / totalWeight) * 100)
    : 0;
  const growthProjection = createGrowthProjection(potentialGaps);

  return {
    matchScore,
    scoreExplanation: requirements.length
      ? `Evidence coverage = ${relevantRequirements.length} directly supported requirement(s)${partialRequirements.length ? ` plus ${partialRequirements.length} partially supported requirement(s)` : ""}, weighted against ${requirements.length} extracted role requirement(s). Partial evidence receives 35% credit. This is a transparent evidence estimate, not a hiring probability; requirements absent from the source profile are not assumed to be met.`
      : "No role requirements could be extracted from the submitted description, so this score is provisional rather than evidence of no fit.",
    requirements,
    relevantSkills: [
      ...evidence.relevantSkills,
      ...relevantRequirements.map((item) => item.label),
    ],
    partiallySupportedRequirements: partialRequirements.map(({ label, evidence }) => ({
      label,
      evidence,
    })),
    relevantExperience: evidence.relevantExperience,
    relevantProjects: evidence.relevantProjects,
    potentialGaps,
    growthProjection,
    source: profile.source,
    recommendedContent: evidence.relevantProjects.length
      ? evidence.relevantProjects.map(({ name, source }) => ({ title: name, url: source }))
      : [{ title: "Projects", url: "/projects/" }, { title: "Journey", url: "/journey/" }],
  };
}
