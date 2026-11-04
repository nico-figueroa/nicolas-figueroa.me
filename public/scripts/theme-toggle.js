// theme-toggle.js - Manages the theme toggle functionality, allowing users to switch between light and dark themes.
// Updates the document's theme attribute and the toggle button's label and text accordingly.

const toggle = document.querySelector("[data-theme-toggle]");

toggle?.addEventListener("click", () => {
  const root = document.documentElement;
  const isDark = root.dataset.theme !== "light";
  root.dataset.theme = isDark ? "light" : "dark";
  toggle.setAttribute("aria-label", `Switch to ${isDark ? "dark" : "light"} theme`);
  toggle.textContent = `${isDark ? "Dark" : "Light"} theme`;
});
