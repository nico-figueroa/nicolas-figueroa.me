// Utility functions for managing and displaying fit assessment progress messages

// Messages displayed during the fit assessment process to indicate progress and context
export const FIT_PROGRESS_MESSAGES = [
  "Putting the job description under the evidence microscope.",
  "Looking beyond keywords. Context deserves a seat at the table.",
  "Keeping the perks in the perks lane.",
  "Connecting career chapters to the role ahead.",
  "Giving transferable skills their moment in the spotlight.",
  "Checking the receipts: portfolio evidence matters.",
  "Separating must-haves from nice-to-haves.",
  "Making room for equivalent experience, not just identical wording.",
  "Keeping higher qualifications from getting lost in translation.",
  "Letting the projects do some of the talking.",
  "Giving technical skills and people skills their own lanes.",
  "Keeping industry experience distinct from engineering capability.",
  "Reading between the lines, without inventing new ones.",
  "Trading keyword bingo for an evidence-based conversation.",
  "Keeping the assessment grounded, even when the job title aims high.",
  "Looking for the story behind the skill list.",
  "Leaving the crystal ball out of the hiring conversation.",
  "Checking where experience connects and where questions remain.",
  "Making sure the benefits package does not become a qualification.",
  "Giving practical problem-solving its due.",
  "Looking for substance beneath the buzzwords.",
  "Keeping the confidence in the evidence, not in guesswork.",
  "Taking a thoughtful look. Good comparisons deserve a little patience.",
  "Still working on the assessment. Thanks for giving the evidence some airtime.",
];

// Starts the fit assessment progress updates, calling the provided update function with messages at regular intervals
// Returns a function to stop the progress updates
export function startFitProgress(update, initialMessage) {
  update(initialMessage);
  let index = 0;
  const timer = setInterval(() => {
    update(FIT_PROGRESS_MESSAGES[index]);
    index = (index + 1) % FIT_PROGRESS_MESSAGES.length;
  }, 3000);
  return () => clearInterval(timer);
}
