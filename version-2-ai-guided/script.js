// Optional public content; the personal introduction remains intentionally blank.
const portfolio = { introduction: "", contacts: [] };
document.querySelectorAll("[data-year]").forEach(node => { node.textContent = new Date().getFullYear(); });
if (portfolio.introduction.trim()) {
  const intro = document.getElementById("personal-introduction");
  intro.textContent = portfolio.introduction;
  intro.hidden = false;
}
function safeUrl(value) {
  try { const url = new URL(value); return ["https:", "http:", "mailto:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}
const contacts = portfolio.contacts.filter(contact => safeUrl(contact.url));
if (contacts.length) {
  document.getElementById("contact-links").replaceChildren(...contacts.map(contact => {
    const link = document.createElement("a");
    link.href = safeUrl(contact.url);
    const label = document.createElement("span");
    label.textContent = contact.label;
    const arrow = document.createElement("span");
    arrow.textContent = "↗";
    arrow.setAttribute("aria-hidden", "true");
    link.append(label, arrow);
    return link;
  }));
}

// Scroll position drives the explorer's current section indicator.
const sections = Array.from(document.querySelectorAll("main > section[id]"));
const navLinks = Array.from(document.querySelectorAll("#navigation a"));
let scheduled = false;
function updateNavigation() {
  let current = "home";
  const offset = document.querySelector(".topbar").offsetHeight + 75;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= offset) current = section.id;
  }
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3) current = "contact";
  for (const link of navLinks) {
    if (link.hash === `#${current}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
  scheduled = false;
}
window.addEventListener("scroll", () => {
  if (!scheduled) { scheduled = true; window.requestAnimationFrame(updateNavigation); }
}, { passive: true });
window.addEventListener("resize", updateNavigation);
updateNavigation();

// Local navigation only. No shell commands, external search, or network requests.
const palette = document.getElementById("command-palette");
const trigger = document.getElementById("command-trigger");
const search = document.getElementById("command-search");
const paletteLinks = Array.from(palette.querySelectorAll(".command-results a"));
if (typeof palette.showModal === "function") {
  trigger.hidden = false;
  document.getElementById("shortcut-label").textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";
  function filterLinks() {
    const query = search.value.trim().toLowerCase();
    for (const link of paletteLinks) link.hidden = !link.textContent.toLowerCase().includes(query);
    document.getElementById("command-empty").hidden = paletteLinks.some(link => !link.hidden);
  }
  function openPalette() {
    if (palette.open) return;
    search.value = "";
    filterLinks();
    palette.showModal();
    search.focus();
  }
  trigger.addEventListener("click", openPalette);
  document.getElementById("command-close").addEventListener("click", () => palette.close());
  search.addEventListener("input", filterLinks);
  document.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (palette.open) palette.close(); else openPalette();
    }
  });
  palette.addEventListener("click", event => {
    if (event.target === palette) {
      const rect = palette.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) palette.close();
    }
  });
  palette.addEventListener("keydown", event => {
    const visible = paletteLinks.filter(link => !link.hidden);
    if (!visible.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const current = visible.indexOf(document.activeElement);
      const next = current === -1 ? (event.key === "ArrowDown" ? 0 : visible.length - 1) : (current + (event.key === "ArrowDown" ? 1 : -1) + visible.length) % visible.length;
      visible[next].focus();
    } else if (event.key === "Enter" && event.target === search) {
      event.preventDefault();
      visible[0].click();
    }
  });
  for (const link of paletteLinks) {
    link.addEventListener("click", () => {
      palette.close();
      const target = document.querySelector(link.hash);
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
      }
    });
  }
}
