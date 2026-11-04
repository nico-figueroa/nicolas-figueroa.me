const desktopCards = window.matchMedia("(min-width: 64rem)");
const initializedCards = new WeakSet();

function initializeCards() {
  document.querySelectorAll("details[data-responsive-card]").forEach((card) => {
    if (initializedCards.has(card)) return;
    initializedCards.add(card);
    card.open = desktopCards.matches;
    card.querySelector("summary")?.addEventListener("click", (event) => {
      if (desktopCards.matches) event.preventDefault();
    });
  });
}

initializeCards();
desktopCards.addEventListener("change", () => {
  document.querySelectorAll("details[data-responsive-card]").forEach((card) => {
    card.open = desktopCards.matches;
  });
});
new MutationObserver(initializeCards).observe(document.body, { childList: true, subtree: true });
