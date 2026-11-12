/* Automatic local SVG loops; pause off screen and respect reduced motion. */
(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cards = Array.from(document.querySelectorAll("[data-sport]"));
  const visible = new Set();
  function update() {
    for (const card of cards) {
      card.classList.toggle("is-playing", !reduced.matches);
      card.classList.toggle("is-paused", document.hidden || !visible.has(card));
    }
  }
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      update();
    }, { threshold: 0 });
    cards.forEach(card => observer.observe(card));
  } else cards.forEach(card => visible.add(card));
  document.addEventListener("visibilitychange", update);
  reduced.addEventListener("change", update);
  update();
})();
