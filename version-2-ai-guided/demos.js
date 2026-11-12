/* Conceptual, browser-local demonstrations. No live partner requests or production schema. */
(() => {
  "use strict";
  const cards = Object.freeze({
    overview: { name: "Overview", title: "Sample hotel", detail: "Place information · Sample POI", visual: true },
    rooms: { name: "Rooms", title: "Rooms & booking", detail: "Room options and booking providers" },
    reviews: { name: "Reviews", title: "What people say", detail: "Community reviews and experiences" },
    highlights: { name: "Highlights", title: "A closer look", detail: "Local ambience · Facilities · Highlights" },
    offers: { name: "Offers", title: "Available packages", detail: "A business card added through data" }
  });
  const initialLayout = () => ["overview", "rooms", "reviews"];
  function updateLayout(layout, action, id, delta = 0) {
    const next = [...layout];
    if (!(id in cards)) return next;
    const index = next.indexOf(id);
    if (action === "add" && index === -1) next.push(id);
    if (action === "remove" && index !== -1 && next.length > 1) next.splice(index, 1);
    if (action === "move" && index !== -1 && [-1, 1].includes(delta)) {
      const target = index + delta;
      if (target >= 0 && target < next.length) [next[index], next[target]] = [next[target], next[index]];
    }
    return next;
  }
  function checkAccess(policy) {
    if (policy.deny) return { allowed: false, reason: "Blacklist match: access denied." };
    if (!policy.allow) return { allowed: false, reason: "Not on the whitelist: access denied." };
    return { allowed: true, reason: "Whitelist match; no blacklist match." };
  }
  // Pure model is also used by local verification, independent of animation timing.
  globalThis.PortfolioDemoModel = Object.freeze({ initialLayout, updateLayout, checkAccess });
  if (typeof document === "undefined") return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function animate(node, frames, options) {
    if (!reducedMotion.matches && typeof node.animate === "function") node.animate(frames, options);
  }
  function createSlash(root) {
    const list = root.querySelector("[data-components]");
    const phone = root.querySelector("[data-phone]");
    const select = root.querySelector("[data-add-select]");
    const playButton = root.querySelector('[data-action="play"]');
    const status = root.querySelector("[data-status]");
    let layout = initialLayout(), revision = 1, step = 0, running = false, paused = false;
    let timer = null, pulseTimer = null;
    const phoneNodes = new Map();
    const state = { interacted: false };
    function controls() {
      playButton.textContent = running ? "Ⅱ Pause" : paused ? "▶ Resume" : step === 3 ? "↻ Replay walkthrough" : "▶ Play walkthrough";
      playButton.setAttribute("aria-pressed", String(running));
      list.querySelectorAll("button").forEach(button => {
        const index = layout.indexOf(button.dataset.id);
        button.disabled = running || (button.dataset.edit === "remove" && layout.length === 1) || (button.dataset.delta === "-1" && index === 0) || (button.dataset.delta === "1" && index === layout.length - 1);
      });
      select.disabled = running || select.options.length === 0;
      root.querySelector('[data-action="add"]').disabled = running || select.options.length === 0;
    }
    function render(message, motion = true) {
      const focus = document.activeElement && list.contains(document.activeElement) ? { ...document.activeElement.dataset } : null;
      const positions = new Map(Array.from(phoneNodes, ([id, node]) => [id, node.getBoundingClientRect()]));
      list.replaceChildren(...layout.map((id, index) => {
        const row = el("li");
        row.append(el("code", "", `"${id}"${index < layout.length - 1 ? "," : ""}`));
        const actions = el("span", "td-row-actions");
        for (const [action, delta, symbol, label] of [["move", -1, "↑", "up"], ["move", 1, "↓", "down"], ["remove", 0, "×", "remove"]]) {
          const button = el("button", "", symbol);
          button.type = "button";
          Object.assign(button.dataset, { edit: action, delta: String(delta), id });
          const title = action === "remove" ? `Remove ${cards[id].name}` : `Move ${cards[id].name} ${label}`;
          button.setAttribute("aria-label", title);
          button.title = title;
          actions.append(button);
        }
        row.append(actions);
        return row;
      }));
      const priorSelection = select.value;
      select.replaceChildren(...Object.keys(cards).filter(id => !layout.includes(id)).map(id => {
        const option = el("option", "", cards[id].name); option.value = id; return option;
      }));
      if (Array.from(select.options).some(option => option.value === priorSelection)) select.value = priorSelection;
      for (const [id, node] of phoneNodes) {
        if (!layout.includes(id)) { node.remove(); phoneNodes.delete(id); }
      }
      phone.querySelector(".td-static-preview")?.remove();
      for (const id of layout) {
        let node = phoneNodes.get(id);
        if (!node) {
          const card = cards[id];
          node = el("div", "td-ui-card");
          node.dataset.card = id;
          if (card.visual) { const visual = el("div", "td-card-visual"); visual.setAttribute("aria-hidden", "true"); node.append(visual); }
          node.append(el("p", "td-card-caption", card.name), el("strong", "", card.title), el("p", "", card.detail));
          phoneNodes.set(id, node);
        }
        node.getAnimations?.().forEach(animation => animation.cancel());
        phone.append(node);
      }
      for (const id of layout) {
        const node = phoneNodes.get(id), before = positions.get(id), after = node.getBoundingClientRect();
        if (motion && before && Math.abs(before.top - after.top) > 1) animate(node, [{ transform: `translateY(${before.top - after.top}px)` }, { transform: "translateY(0)" }], { duration: 480, easing: "cubic-bezier(.2,.8,.2,1)" });
        else if (motion && !before) animate(node, [{ opacity: 0, transform: "translateY(12px) scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 450, easing: "ease-out" });
      }
      root.querySelector("[data-revision]").textContent = `revision ${String(revision).padStart(2, "0")}`;
      root.querySelectorAll("[data-step]").forEach(node => node.classList.toggle("is-active", Number(node.dataset.step) === step));
      status.textContent = message;
      controls();
      if (focus && !running) {
        const matching = Array.from(list.querySelectorAll("button")).find(button => button.dataset.id === focus.id && button.dataset.edit === focus.edit && button.dataset.delta === focus.delta && !button.disabled);
        (matching || list.querySelector("button:not(:disabled)") || playButton).focus({ preventScroll: true });
      }
    }
    function pulse() {
      clearTimeout(pulseTimer);
      root.querySelectorAll("[data-flow]").forEach(node => node.classList.add("is-active"));
      pulseTimer = setTimeout(() => root.querySelectorAll("[data-flow]").forEach(node => node.classList.remove("is-active")), 900);
    }
    function apply(action, id, delta, message) {
      const next = updateLayout(layout, action, id, delta);
      if (next.join() === layout.join()) return;
      layout = next; revision++;
      pulse(); render(message);
    }
    function pause(message) {
      if (!running) return;
      clearTimeout(timer); running = false; paused = true;
      controls();
      status.textContent = message || "Walkthrough paused. Resume or edit the component list.";
    }
    function reset() {
      clearTimeout(timer); clearTimeout(pulseTimer);
      running = false; paused = false; layout = initialLayout(); revision = 1; step = 0;
      root.querySelectorAll("[data-flow]").forEach(node => node.classList.remove("is-active"));
      render("Initial layout: Overview → Rooms → Reviews. The app build stays the same.");
    }
    function advance() {
      if (!running) return;
      step++;
      if (step === 1) apply("add", "highlights", 0, "Add: Highlights appears through a protocol update. No app release.");
      if (step === 2) {
        layout = updateLayout(layout, "move", "highlights", -1);
        apply("move", "highlights", -1, "Reorder: Highlights moves below Overview. The UI follows the data order.");
      }
      if (step === 3) {
        apply("remove", "reviews", 0, "Remove: Reviews disappears. Three layout changes, the same app build.");
        running = false; paused = false; controls(); return;
      }
      timer = setTimeout(advance, 1900);
    }
    function start() {
      if (!paused) reset();
      running = true; paused = false; controls();
      status.textContent = "Playing: watch the data sequence and the page change together.";
      timer = setTimeout(advance, 1300);
    }
    root.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button || button.disabled) return;
      state.interacted = true;
      if (button.dataset.action === "play") { if (running) pause(); else start(); }
      else if (button.dataset.action === "reset") reset();
      else if (button.dataset.action === "add") { paused = false; step = 0; apply("add", select.value, 0, `Added ${cards[select.value].name} through the data protocol. No app release.`); }
      else if (button.dataset.edit) {
        paused = false; step = 0;
        const { edit, id, delta } = button.dataset;
        apply(edit, id, Number(delta), `${edit === "remove" ? "Removed" : "Reordered"} ${cards[id].name}. The page follows the component sequence.`);
      }
    });
    select.addEventListener("change", () => { state.interacted = true; });
    render("Initial layout: Overview → Rooms → Reviews. The app build stays the same.", false);
    root.querySelectorAll("[data-controls]").forEach(node => { node.hidden = false; });
    return { state, start, stop: () => pause("Paused while the demo is out of view. Select Resume to continue.") };
  }
  function createQwen(root) {
    const partners = {
      eastern: { name: "China Eastern", mark: "CE", title: "Flight services", detail: "Flight search and booking · Illustrative service view" },
      kfc: { name: "KFC", mark: "KFC", title: "Food ordering", detail: "Menu and ordering · Illustrative service view" },
      luckin: { name: "Luckin Coffee", mark: "LK", title: "Coffee services", detail: "Coffee selection and ordering · Illustrative service view" }
    };
    const policyFor = () => Object.fromEntries(Object.keys(partners).map(id => [id, { allow: true, deny: false }]));
    let policies = policyFor(), selected = "kfc", running = false, timer = null, generation = 0;
    const state = { interacted: false };
    const trace = root.querySelector("[data-trace]");
    const service = root.querySelector("[data-service]");
    const resultTag = root.querySelector("[data-result-tag]");
    const status = root.querySelector("[data-status]");
    const runButton = root.querySelector('[data-action="run"]');
    const stages = Array.from(root.querySelectorAll("[data-stage]"));
    function drawService(kind, title, detail, symbol) {
      service.className = `td-service ${kind === "allowed" ? "is-allowed" : kind === "blocked" ? "is-blocked" : ""}`;
      const icon = el("span", "td-service-symbol", symbol); icon.setAttribute("aria-hidden", "true");
      service.replaceChildren(icon, el("strong", "", title), el("p", "", detail));
      resultTag.dataset.outcome = kind;
      resultTag.textContent = kind.toUpperCase();
    }
    function controls() {
      root.querySelectorAll("[data-partner], [data-scenario], [data-policy]").forEach(node => { node.disabled = running; });
      runButton.textContent = running ? "■ Cancel request" : "▶ Run request";
      runButton.setAttribute("aria-pressed", String(running));
      root.querySelectorAll("[data-partner]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.partner === selected)));
      root.querySelector('[data-policy="allow"]').checked = policies[selected].allow;
      root.querySelector('[data-policy="deny"]').checked = policies[selected].deny;
      root.querySelector("[data-partner-name]").textContent = partners[selected].name;
    }
    function clearFlow() {
      stages.forEach(node => node.classList.remove("is-current", "is-done", "is-blocked", "is-skipped"));
    }
    function log(message, error = false) { trace.append(el("li", error ? "is-error" : "", message)); }
    function idle(message) {
      clearTimeout(timer); generation++; running = false; clearFlow();
      trace.replaceChildren(el("li", "", "Ready to demonstrate a third-party request."));
      drawService("ready", "Waiting for a request", "Only an authorized platform reaches this view.", "◇");
      status.textContent = message || "Choose a platform and run a request to follow its path.";
      controls();
    }
    function run() {
      clearTimeout(timer); const token = ++generation;
      running = true; clearFlow(); trace.replaceChildren(); controls();
      const partner = partners[selected], decision = checkAccess(policies[selected]);
      drawService("checking", "Request in progress", "The service remains closed until access is approved.", "···");
      status.textContent = `Following ${partner.name} through the SDK and access check.`;
      let stageIndex = 0;
      function next() {
        if (token !== generation || !running) return;
        stages.forEach(node => node.classList.remove("is-current"));
        const node = stages[stageIndex]; node.classList.add("is-current");
        if (stageIndex === 0) log(`${partner.name}: start a platform request.`);
        if (stageIndex === 1) { stages[0].classList.add("is-done"); log("Standard SDK: use the shared integration contract."); }
        if (stageIndex === 2) {
          stages[1].classList.add("is-done"); log(`Access policy: ${decision.reason}`, !decision.allowed);
          if (!decision.allowed) {
            node.classList.remove("is-current"); node.classList.add("is-blocked"); stages[3].classList.add("is-skipped");
            log("Web container: service content is not opened.", true);
            drawService("blocked", "Access denied", decision.reason, "×");
            status.textContent = `${partner.name} blocked in this simulation. ${decision.reason}`;
            running = false; controls(); return;
          }
        }
        if (stageIndex === 3) {
          stages[2].classList.add("is-done"); node.classList.add("is-done"); node.classList.remove("is-current");
          log("Web container: open the authorized service.");
          drawService("allowed", `${partner.name} / ${partner.title}`, partner.detail, partner.mark);
          animate(service, [{ opacity: .2, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 400, easing: "ease-out" });
          status.textContent = `${partner.name} allowed in this simulation. Standard SDK, shared container, controlled access.`;
          running = false; controls(); return;
        }
        stageIndex++;
        timer = setTimeout(next, reducedMotion.matches ? 100 : 850);
      }
      next();
    }
    root.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button || button.disabled) return;
      state.interacted = true;
      if (button.dataset.partner) { selected = button.dataset.partner; idle(`Selected ${partners[selected].name}. Configure its demo access or run a request.`); }
      else if (button.dataset.action === "run") { if (running) idle("Request cancelled. No service content was opened."); else run(); }
      else if (button.dataset.action === "reset") { policies = policyFor(); selected = "kfc"; idle(); }
      else if (button.dataset.scenario) {
        const scenario = button.dataset.scenario;
        policies[selected] = { allow: scenario !== "unlisted", deny: scenario === "blocked" };
        controls(); run();
      }
    });
    root.addEventListener("change", event => {
      if (!event.target.dataset.policy) return;
      state.interacted = true;
      policies[selected][event.target.dataset.policy] = event.target.checked;
      idle("Demo policy updated. Run a request to evaluate the new access settings.");
    });
    idle();
    root.querySelectorAll("[data-controls]").forEach(node => { node.hidden = false; });
    return { state, start: run, stop: () => { if (running) idle("Request paused while out of view. Run it again to replay the flow."); } };
  }
  const controllers = [];
  document.querySelectorAll("[data-demo]").forEach(root => {
    const controller = root.dataset.demo === "slash" ? createSlash(root) : createQwen(root);
    controllers.push(controller);
    // One automatic pass when the demo heading is visible; never restart after user input.
    let seen = false;
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seen && !document.hidden && !reducedMotion.matches) {
            seen = true;
            if (!controller.state.interacted) controller.start();
          }
        }
      }, { threshold: .8 });
      observer.observe(root.querySelector(".td-heading"));
      const visibility = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) controller.stop();
      }, { threshold: 0 });
      visibility.observe(root);
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) controllers.forEach(controller => controller.stop());
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) controllers.forEach(controller => controller.stop());
  });
})();
