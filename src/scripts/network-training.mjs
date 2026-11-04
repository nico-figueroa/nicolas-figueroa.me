// Utility function for simulating network training with forward and backward phases
// Calls the provided update function with the current phase and connection weights at regular intervals
// Returns a function to stop the training simulation

export function startNetworkTraining(connectionCount, update, random = Math.random) {
  let step = 0;
  let weights = Array(connectionCount).fill(0.5); // Initialize connection weights to 0.5
  update({ phase: "forward", weights });
  const timer = setInterval(() => {
    step = (step + 1) % 8; // Cycle through 8 steps, 4 forward and 4 backward to simulate training phases
    const phase = step < 4 ? "forward" : "backward";
    if (phase === "backward") {
      weights = weights.map((weight) => Math.min(0.95, Math.max(0.15, weight + (random() - 0.5) * 0.5))); // Adjust weights with random variation, clamped between 0.15 and 0.95
    }
    update({ phase, weights });
  }, 1500);
  return () => clearInterval(timer);
}
