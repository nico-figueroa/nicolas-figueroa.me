# Check Nico's Fit

## Purpose

Evaluate alignment between Nicolas and a job description.

---

# Inputs

Plain text job description.

---

# Outputs

Match Score

Strengths

Relevant Experience

Relevant Projects

Potential Gaps

Growth Projection

Recommended Reading

---

# Growth Projection Engine

The projection must estimate time to learn the skills identified as potential
gaps; it must not substitute a list of existing credentials for a timeline.
Each exact gap item must appear in all three proficiency levels:

- Beginner: foundational working familiarity.
- Intermediate: independent implementation and troubleshooting.
- Advanced: design, optimization, and mentoring-level depth.

Show an individual estimate for each skill at each level, plus a combined
estimate for reaching that level across all identified gaps. The combined
estimate assumes sequential learning.

Historical calibration may use:

- MSIM completion while working full-time, with a 4.0 GPA.
- Full Stack certification completed in approximately 3 months.
- AI Engineering certification completed in approximately 1 month.
- Career progression and documented learning milestones.

Assume consistent part-time study of roughly 6–8 focused hours per week and an
existing technical foundation. Explain that prior learning pace does not
guarantee equivalent timelines for a different skill. Estimates are
illustrative, not predictions or guarantees.

---

# Transparency

Projections must be described as estimates.

Never guarantees.

Always explain reasoning.

## Requirement extraction and evidence

The analyzer must retain requirements that are not in its documented skill
catalog. It combines known skill/role signals with qualification clauses from
the submitted description, so an unfamiliar profession or technology is shown
as an unsupported requirement rather than silently removed from the analysis.

Each extracted criterion is classified as directly supported, partially
supported by adjacent evidence, or an unverified gap. The score is a weighted
evidence-coverage estimate, not a hiring probability; partially supported
criteria receive less credit than direct evidence. The response exposes the
criteria and the evidence behind the classification. Partial matches must be
shown separately from potential gaps; only unverified gaps receive learning
timelines.

Candidate-confirmed qualifications may supplement published profile evidence,
but must be identified as self-reported. A statement that experience exists in
at least one of several alternative areas does not establish which area or
which named tools/frameworks; the analysis must preserve that uncertainty and
must not claim every example in the posting.

The candidate-confirmed PyTorch production claim supports PyTorch and
JAX-or-PyTorch alternatives, but not a JAX-only requirement. Its evidence must
remain labeled as candidate-confirmed rather than independently verified.

Requirements for regulated work, including medical and legal roles, must remain
visible when no matching qualification is documented. Learning-time estimates
do not confer a degree, license, board certification, or legal authorization.