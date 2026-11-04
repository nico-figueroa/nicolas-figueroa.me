const menuToggle = document.querySelector("[data-navigation-toggle]");
document.documentElement.dataset.navigationEnhanced = "true";

function setMenuOpen(isOpen) {
  if (!(menuToggle instanceof HTMLButtonElement)) return;
  document.body.dataset.menuOpen = String(isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

menuToggle?.addEventListener("click", () => {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

document.querySelectorAll("#site-navigation a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") {
    setMenuOpen(false);
    menuToggle.focus();
  }
});

window.matchMedia("(min-width: 64rem)").addEventListener("change", (event) => {
  if (event.matches) setMenuOpen(false);
});
