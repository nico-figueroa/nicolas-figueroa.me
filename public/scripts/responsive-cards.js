// responsive-cards.js - Handles the initialization and responsive behavior of collapsible cards on the page.

const desktopCards = window.matchMedia("(min-width: 64rem)");
const initializedCards = new WeakSet();

// Initialize and manage the responsive behavior of collapsible cards based on the viewport width.
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

// Listen for changes in the viewport width and update the state of the cards accordingly.
initializeCards();
desktopCards.addEventListener("change", () => {
  document.querySelectorAll("details[data-responsive-card]").forEach((card) => {
    card.open = desktopCards.matches;
  });
});
new MutationObserver(initializeCards).observe(document.body, { childList: true, subtree: true });
