export function startNetworkTraining(connectionCount, update, random = Math.random) {
  let step = 0;
  let weights = Array(connectionCount).fill(0.5);
  update({ phase: "forward", weights });
  const timer = setInterval(() => {
    step = (step + 1) % 8;
    const phase = step < 4 ? "forward" : "backward";
    if (phase === "backward") {
      weights = weights.map((weight) => Math.min(0.95, Math.max(0.15, weight + (random() - 0.5) * 0.5)));
    }
    update({ phase, weights });
  }, 1500);
  return () => clearInterval(timer);
}
