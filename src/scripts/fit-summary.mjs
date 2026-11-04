export function summarizeFit(payload) {
  const { requirements, growthProjection } = payload;
  const supported = requirements.filter((item) => item.status === "matched");
  const partial = requirements.filter((item) => item.status === "partial");
  const gaps = requirements.filter((item) => item.status === "gap");
  const domainGaps = gaps.filter((item) => item.category === "Industry domain");
  const estimatedSkills = new Set(growthProjection.levels.flatMap((level) => level.skills.map((item) => item.skill)));
  const unestimatedGaps = gaps.filter((item) => !estimatedSkills.has(item.label));
  const learningTime = growthProjection.levels
    .map((level) => `${level.label}: ${level.overall.time}`)
    .join("; ");
  const highlights = supported.slice(0, 3).map((item) => item.label).join(", ");
  const missing = gaps.slice(0, 3).map((item) => item.label).join(", ");
  const paragraph = requirements.length
    ? `${payload.matchScore}% evidence coverage across ${requirements.length} assessed requirements: ${supported.length} fully supported, ${partial.length} partially supported, and ${gaps.length} gaps.${highlights ? ` Supported strengths include ${highlights}.` : ""}${missing ? ` Key gaps include ${missing}.` : " No unsupported requirements were identified."}${domainGaps.length ? ` ${domainGaps.length} gap(s) concern industry-domain experience, independently of engineering capability.` : ""}${partial.length ? " Partially supported requirements still require confirmation." : ""} Learning estimates are illustrative, assume sequential part-time study, and do not establish professional credentials, specialist tenure, or industry experience. This is not a hiring probability.`
    : "No requirements could be extracted. The provisional score and zero extracted gaps do not establish fit or a gap-closure timeline; provide a more detailed job description.";
  return {
    gapCount: gaps.length,
    learningTime: !requirements.length ? "Not estimable without role requirements"
      : gaps.length === unestimatedGaps.length && gaps.length
        ? "Not estimable from study time: gaps concern industry-domain experience, human capabilities, credentials or other nontechnical requirements"
        : gaps.length ? `${learningTime}${unestimatedGaps.length ? "; excludes gaps in domains, human capabilities, credentials and other nontechnical requirements" : ""}` : "No unsupported requirements to estimate",
    paragraph: payload.summary ? `${paragraph} ${payload.summary}` : paragraph,
  };
}
