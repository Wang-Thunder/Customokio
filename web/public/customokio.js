(function () {
  const STORAGE_KEY = "customokio:layout:v3";
  const USAGE_STORAGE_KEY = "customokio:usage:v1";
  const PREFS_STORAGE_KEY = "customokio:prefs:v1";
  const LEGACY_KEYS = ["customokio:layout:v2", "customokio:layout:v1"];
  const HOME_CATEGORY_ID = "cat-home";
  const DEFAULT_CATEGORY_COLOR = "#6b7280";
  const DEFAULT_CATEGORY_ICON = "\uD83D\uDCC1";
  const HOME_CATEGORY_ICON = "\uD83C\uDFE0";
  const EMOJIS = ["\uD83D\uDCC1", "\uD83D\uDCC2", "\uD83D\uDCC4", "\uD83C\uDFA8", "\uD83C\uDFA5", "\uD83D\uDD0A", "\uD83E\uDDE0", "\uD83E\uDDF0", "\uD83D\uDEE0\uFE0F", "\uD83D\uDCDA", "\uD83D\uDCA1", "\uD83D\uDE80", "\u2B50", "\uD83D\uDD16", "\uD83E\uDDEA", "\uD83D\uDDBC\uFE0F"];
  const COLORS = ["#6b7280", "#4b5563", "#1f2937", "#2563eb", "#0f766e", "#15803d", "#b45309", "#b91c1c", "#7c3aed", "#db2777"];

  function resolvePendingState(isReady) {
    document.documentElement.classList.remove("customokio-pending");
    document.documentElement.classList.toggle("customokio-ready", Boolean(isReady));
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function makeId(prefix) { return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }
  function normalizeColor(value) {
    const v = String(value || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v;
    if (/^#[0-9a-f]{3}$/i.test(v)) return "#" + v.slice(1).split("").map((c) => c + c).join("");
    return DEFAULT_CATEGORY_COLOR;
  }
  function looksLikeMojibake(value) {
    const text = typeof value === "string" ? value.trim() : "";
    return !text || text.length > 16 || /(?:\u00C3|\u00E2|\u00F0)/.test(text);
  }
  function normalizeCategoryIcon(value, fallback) {
    const text = typeof value === "string" ? value.trim() : "";
    return looksLikeMojibake(text) ? fallback : text.slice(0, 4);
  }
  function createCategory(name, overrides) {
    const category = Object.assign({ id: makeId("cat"), name: name || "New Category", icon: DEFAULT_CATEGORY_ICON, color: DEFAULT_CATEGORY_COLOR, collapsed: false, sortMode: "manual", itemLayout: "list", children: [] }, overrides || {});
    category.icon = normalizeCategoryIcon(category.icon, DEFAULT_CATEGORY_ICON);
    return category;
  }
  function createDefaultState(cardRefs) {
    const refs = Array.from(cardRefs);
    return {
      version: 3,
      layoutMode: "stack",
      customColors: [],
      root: refs.length ? [HOME_CATEGORY_ID] : [],
      categories: refs.length ? {
        [HOME_CATEGORY_ID]: createCategory("Home", { id: HOME_CATEGORY_ID, icon: HOME_CATEGORY_ICON, color: "#374151", children: refs })
      } : {}
    };
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || LEGACY_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Failed to load Customokio state", e);
      return null;
    }
  }
  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  }
  function loadUsageState() {
    try {
      const raw = localStorage.getItem(USAGE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error("Failed to load Customokio usage state", e);
      return {};
    }
  }
  function saveUsageState(usage) {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  }
  function loadPrefsState() {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error("Failed to load Customokio prefs state", e);
      return {};
    }
  }
  function savePrefsState(prefs) {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  }
  function collectCards() {
    const cards = [];
    const seen = new Set();
    [".running-apps > .line", ".not-running-apps > .line"].forEach((selector) => {
      document.querySelectorAll(selector).forEach((card) => {
        const ref = card.getAttribute("data-uri") || card.getAttribute("data-path") || card.getAttribute("data-browser-url") || card.querySelector(".line-main-link")?.getAttribute("href");
        if (!ref || seen.has(ref)) return;
        seen.add(ref);
        cards.push({ ref: ref, card: card, name: card.getAttribute("data-name") || ref });
      });
    });
    return cards;
  }
  function sanitizeState(rawState, cardRefs) {
    const source = rawState && typeof rawState === "object" ? rawState : {};
    const sourceCategories = source.categories && typeof source.categories === "object" ? source.categories : {};
    const safeLayoutMode = source.layoutMode === "folder" || source.layoutMode === "flow" ? source.layoutMode : "stack";
    const safe = { version: 3, layoutMode: safeLayoutMode, customColors: Array.isArray(source.customColors) ? source.customColors.map(normalizeColor).slice(0, 24) : [], root: [], categories: {} };
    const visited = new Set();
    function walk(refs) {
      const output = [];
      if (!Array.isArray(refs)) return output;
      refs.forEach((ref) => {
        if (typeof ref !== "string" || visited.has(ref)) return;
        if (ref.startsWith("cat-")) {
          const category = sourceCategories[ref];
          if (!category || typeof category !== "object") return;
          visited.add(ref);
          safe.categories[ref] = createCategory(category.name, {
            id: ref,
            icon: normalizeCategoryIcon(category.icon, DEFAULT_CATEGORY_ICON),
            color: normalizeColor(category.color),
            collapsed: Boolean(category.collapsed),
            sortMode: normalizeSortMode(category.sortMode || "manual"),
            itemLayout: category.itemLayout === "grid" ? "grid" : "list",
            children: walk(category.children)
          });
          output.push(ref);
          return;
        }
        if (cardRefs.has(ref)) {
          visited.add(ref);
          output.push(ref);
        }
      });
      return output;
    }
    safe.root = walk(source.root);
    cardRefs.forEach((ref) => { if (!visited.has(ref)) safe.root.push(ref); });
    return cardRefs.size && !safe.root.some((ref) => ref.startsWith("cat-")) ? createDefaultState(cardRefs) : safe;
  }
  function parseCardMeta(card, fallbackName) {
    const launchCount = Number.parseInt(card.getAttribute("data-customokio-launch-count") || card.getAttribute("data-launch-count-total") || "0", 10);
    const customLastLaunch = Number(card.getAttribute("data-customokio-last-launch") || "0");
    const lastLaunchRaw = card.getAttribute("data-last-launch-at") || "";
    const index = Number.parseInt(card.getAttribute("data-index") || String(Number.MAX_SAFE_INTEGER), 10);
    const name = (
      card.getAttribute("data-name") ||
      card.querySelector(".name")?.textContent ||
      card.querySelector(".title")?.textContent ||
      fallbackName ||
      card.textContent ||
      ""
    ).trim().toLowerCase();
    return {
      starred: card.getAttribute("data-starred") === "1" ? 1 : 0,
      launchCount: Number.isFinite(launchCount) ? launchCount : 0,
      lastLaunch: customLastLaunch > 0 ? customLastLaunch : (lastLaunchRaw ? (Date.parse(lastLaunchRaw) || 0) : 0),
      index: Number.isFinite(index) ? index : Number.MAX_SAFE_INTEGER,
      name: name
    };
  }
  function compareCards(a, b, sortMode, fallbackNameA, fallbackNameB) {
    const aa = parseCardMeta(a, fallbackNameA);
    const bb = parseCardMeta(b, fallbackNameB);
    if (aa.starred !== bb.starred) return bb.starred - aa.starred;
    if (sortMode === "last_opened") {
      if (aa.lastLaunch !== bb.lastLaunch) return bb.lastLaunch - aa.lastLaunch;
      if (aa.launchCount !== bb.launchCount) return bb.launchCount - aa.launchCount;
      const byName = aa.name.localeCompare(bb.name);
      if (byName !== 0) return byName;
    } else if (sortMode === "az" || sortMode === "category_az") {
      const byName = aa.name.localeCompare(bb.name);
      if (byName !== 0) return byName;
    } else {
      if (aa.launchCount !== bb.launchCount) return bb.launchCount - aa.launchCount;
      if (aa.lastLaunch !== bb.lastLaunch) return bb.lastLaunch - aa.lastLaunch;
      const byName = aa.name.localeCompare(bb.name);
      if (byName !== 0) return byName;
    }
    if (aa.index !== bb.index) return aa.index - bb.index;
    return aa.name.localeCompare(bb.name);
  }
  function normalizeSortMode(value) {
    const mode = String(value || "").trim().toLowerCase();
    return ["last_opened", "az", "manual", "most_used"].includes(mode) ? mode : "most_used";
  }

  function setup() {
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.get("mode") === "terminals") { resolvePendingState(false); return; }
    const searchForm = document.querySelector(".home-search-form");
    const actionsHost = document.querySelector(".home-apps-header-main-actions");
    const sortWrap = document.querySelector(".home-apps-sort");
    const sortSelect = document.querySelector("#home-apps-sort-select");
    const runningContainer = document.querySelector(".running-apps");
    const notRunningContainer = document.querySelector(".not-running-apps");
    const anchorContainer = runningContainer || notRunningContainer;
    if (!searchForm || !actionsHost || !sortWrap || !sortSelect || !anchorContainer) { resolvePendingState(false); return; }

    const cardEntries = collectCards();
    if (!cardEntries.length) { resolvePendingState(false); return; }
    const cardMap = new Map(cardEntries.map((entry) => [entry.ref, entry]));
    const cardRefs = new Set(cardEntries.map((entry) => entry.ref));
    let state = sanitizeState(loadState(), cardRefs);
    let activeFilter = "all";
    let floatingPanel = null;
    let textPrompt = null;
    let sortables = [];
    let sortablePromise = null;
    let usageState = loadUsageState();
    let prefsState = loadPrefsState();

    const groupHost = document.createElement("section");
    groupHost.className = "customokio-group-host";
    anchorContainer.parentNode.insertBefore(groupHost, anchorContainer);

    const controls = document.createElement("div");
    controls.className = "customokio-control-strip";
    const toolbar = document.createElement("div");
    toolbar.className = "customokio-toolbar";
    toolbar.innerHTML = '<button type="button" class="btn" data-action="new"><i class="fa-solid fa-folder-plus"></i> New category</button><button type="button" class="btn" data-action="collapse-all"><i class="fa-solid fa-angles-up"></i> Collapse all</button><button type="button" class="btn" data-action="expand-all"><i class="fa-solid fa-angles-down"></i> Expand all</button><button type="button" class="btn" data-action="layout"><i class="fa-solid fa-table-cells-large"></i> Layout</button><button type="button" class="btn" data-action="items-all"><i class="fa-solid fa-table-cells"></i> Items</button><button type="button" class="btn" data-action="export"><i class="fa-solid fa-file-export"></i> Export</button><button type="button" class="btn" data-action="import"><i class="fa-solid fa-file-import"></i> Import</button><button type="button" class="btn" data-action="reset"><i class="fa-solid fa-arrow-rotate-left"></i> Reset layout</button>';
    const filterWrap = document.createElement("div");
    filterWrap.className = "customokio-filter";
    filterWrap.innerHTML = '<i class="fa-solid fa-filter" aria-hidden="true"></i><label for="customokio-category-filter">Category</label><select id="customokio-category-filter" aria-label="Filter by category"><option value="all">All categories</option></select><i class="fa-solid fa-chevron-down customokio-filter-caret" aria-hidden="true"></i>';
    const supportLink = document.createElement("a");
    supportLink.className = "customokio-support-link";
    supportLink.href = "https://ko-fi.com/wangthunder";
    supportLink.target = "_blank";
    supportLink.rel = "noopener noreferrer";
    supportLink.innerHTML = 'Like Customokio? Support this project on Ko-fi <span class="customokio-support-heart" aria-hidden="true"><i class="fa-solid fa-heart"></i></span>';
    searchForm.classList.add("customokio-search-support");
    const searchInput = searchForm.querySelector("input[type='search'].flexible");
    if (searchInput) {
      searchInput.classList.add("customokio-search-input");
      searchForm.appendChild(supportLink);
    }
    controls.appendChild(toolbar);
    controls.appendChild(sortWrap);
    controls.appendChild(filterWrap);
    actionsHost.appendChild(controls);
    const filterSelect = filterWrap.querySelector("select");

    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = "application/json";
    importInput.hidden = true;
    document.body.appendChild(importInput);

    let domObserver = null;
    let reinitTimer = 0;
    function queueReinitialize() {
      if (reinitTimer) return;
      if (domObserver) {
        domObserver.disconnect();
        domObserver = null;
      }
      reinitTimer = window.setTimeout(function () {
        reinitTimer = 0;
        destroySortables();
        closeFloatingPanel();
        if (textPrompt) closeTextPrompt(null);
        if (groupHost.isConnected) groupHost.remove();
        if (controls.isConnected) controls.remove();
        if (supportLink.isConnected) supportLink.remove();
        if (importInput.isConnected) importInput.remove();
        if (searchForm.classList.contains("customokio-search-support")) searchForm.classList.remove("customokio-search-support");
        if (searchInput && searchInput.classList.contains("customokio-search-input")) searchInput.classList.remove("customokio-search-input");
        didInitialize = false;
        document.documentElement.classList.remove("customokio-ready");
        document.documentElement.classList.add("customokio-pending");
        window.requestAnimationFrame(initOnce);
      }, 80);
    }
    function shouldReinitializeFromDom() {
      const liveRunning = document.querySelector(".running-apps");
      const liveNotRunning = document.querySelector(".not-running-apps");
      if (!groupHost.isConnected || !controls.isConnected || !supportLink.isConnected) return true;
      if (liveRunning !== runningContainer || liveNotRunning !== notRunningContainer) return true;
      if (liveRunning && liveRunning.style.display !== "none") return true;
      if (liveNotRunning && liveNotRunning.style.display !== "none") return true;
      if (cardEntries.some((entry) => !entry.card.isConnected)) return true;
      return false;
    }

    function persistState() { state = sanitizeState(state, cardRefs); saveState(state); }
    function persistUsageState() { saveUsageState(usageState); }
    function persistPrefsState() { savePrefsState(prefsState); }
    function recordUsage(ref) {
      if (!ref) return;
      const current = usageState[ref] && typeof usageState[ref] === "object" ? usageState[ref] : {};
      usageState[ref] = {
        launchCount: Number(current.launchCount || 0) + 1,
        lastLaunch: Date.now()
      };
      persistUsageState();
    }
    function applyStarState(line, starred) {
      if (!line) return;
      const starValue = starred ? "1" : "0";
      line.setAttribute("data-starred", starValue);
      const button = line.querySelector(".toggle-star");
      if (!button) return;
      button.setAttribute("data-starred", starValue);
      button.classList.toggle("is-starred", starred);
      const icon = button.querySelector("i");
      if (icon) icon.className = starred ? "fa-solid fa-star" : "fa-regular fa-star";
      const label = button.querySelector("span");
      if (label) label.textContent = starred ? "Starred" : "Star";
      button.title = starred ? "Unstar app" : "Star app";
    }
    function closeFloatingPanel() { if (floatingPanel) { floatingPanel.remove(); floatingPanel = null; } }
    function openFloatingPanel(anchor, className) {
      closeFloatingPanel();
      const panel = document.createElement("div");
      panel.className = "customokio-floating-panel" + (className ? " " + className : "");
      document.body.appendChild(panel);
      const rect = anchor.getBoundingClientRect();
      panel.style.left = Math.max(12, rect.left) + "px";
      panel.style.top = Math.min(window.innerHeight - 12, rect.bottom + 8) + "px";
      floatingPanel = panel;
      return panel;
    }
    function closeTextPrompt(value) {
      if (!textPrompt) return;
      const current = textPrompt;
      textPrompt = null;
      current.overlay.remove();
      current.resolve(value);
    }
    function openTextPrompt(options) {
      closeFloatingPanel();
      if (textPrompt) closeTextPrompt(null);
      options = options || {};
      return new Promise(function (resolve) {
        const overlay = document.createElement("div");
        overlay.className = "customokio-modal-backdrop";
        const dialog = document.createElement("div");
        dialog.className = "customokio-modal";
        const title = document.createElement("div");
        title.className = "customokio-modal-title";
        title.textContent = options.title || "Enter a name";
        const input = document.createElement("input");
        input.type = "text";
        input.className = "customokio-panel-input customokio-modal-input";
        input.value = options.value || "";
        input.placeholder = options.placeholder || "";
        input.autocomplete = "off";
        const actions = document.createElement("div");
        actions.className = "customokio-modal-actions";
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "btn";
        cancel.textContent = "Cancel";
        const confirm = document.createElement("button");
        confirm.type = "button";
        confirm.className = "btn";
        confirm.textContent = options.confirmText || "OK";
        function submit() {
          const value = input.value.trim();
          if (!value) {
            input.focus();
            return;
          }
          closeTextPrompt(value);
        }
        cancel.addEventListener("click", function () { closeTextPrompt(null); });
        confirm.addEventListener("click", submit);
        overlay.addEventListener("click", function (event) {
          if (event.target === overlay) closeTextPrompt(null);
        });
        input.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            closeTextPrompt(null);
          }
        });
        actions.appendChild(cancel);
        actions.appendChild(confirm);
        dialog.appendChild(title);
        dialog.appendChild(input);
        dialog.appendChild(actions);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        textPrompt = { overlay: overlay, resolve: resolve };
        window.requestAnimationFrame(function () {
          input.focus();
          input.select();
        });
      });
    }
    function ensureSortable() {
      if (window.Sortable) return Promise.resolve(window.Sortable);
      if (sortablePromise) return sortablePromise;
      sortablePromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/sortable.min.js";
        script.onload = function () { resolve(window.Sortable); };
        script.onerror = function () { reject(new Error("Failed to load SortableJS")); };
        document.head.appendChild(script);
      });
      return sortablePromise;
    }
    function getSortMode() { return sortSelect.tomselect ? normalizeSortMode(sortSelect.tomselect.getValue()) : normalizeSortMode(sortSelect.value); }
    function getChildren(parentId) { return parentId ? (state.categories[parentId] ? state.categories[parentId].children : []) : state.root; }
    function findParentId(ref) {
      if (state.root.includes(ref)) return null;
      for (const categoryId of Object.keys(state.categories)) if (state.categories[categoryId].children.includes(ref)) return categoryId;
      return null;
    }
    function removeRef(ref, refs) {
      const index = refs.indexOf(ref);
      if (index >= 0) { refs.splice(index, 1); return true; }
      for (const categoryId of Object.keys(state.categories)) if (removeRef(ref, state.categories[categoryId].children)) return true;
      return false;
    }
    function addRef(parentId, ref, position) {
      const refs = getChildren(parentId);
      if (refs.includes(ref)) return;
      position === "prepend" ? refs.unshift(ref) : refs.push(ref);
    }
    function isDescendant(categoryId, maybeDescendantId) {
      if (!categoryId || !maybeDescendantId) return false;
      const category = state.categories[categoryId];
      if (!category) return false;
      for (const childRef of category.children) {
        if (childRef === maybeDescendantId) return true;
        if (childRef.startsWith("cat-") && isDescendant(childRef, maybeDescendantId)) return true;
      }
      return false;
    }
    function categoryContainsRef(categoryId, ref) {
      const category = state.categories[categoryId];
      if (!category) return false;
      for (const childRef of category.children) {
        if (childRef === ref) return true;
        if (childRef.startsWith("cat-") && categoryContainsRef(childRef, ref)) return true;
      }
      return false;
    }
    function setAllCategoriesCollapsed(collapsed) {
      Object.keys(state.categories).forEach((categoryId) => {
        state.categories[categoryId].collapsed = collapsed;
      });
    }
    function setAllCategoryItemLayout(itemLayout) {
      const nextLayout = itemLayout === "grid" ? "grid" : "list";
      Object.keys(state.categories).forEach((categoryId) => {
        state.categories[categoryId].itemLayout = nextLayout;
      });
    }
    function collectCategoryCardRefs(categoryId) {
      const refs = [];
      const category = state.categories[categoryId];
      if (!category) return refs;
      category.children.forEach((childRef) => {
        if (childRef.startsWith("cat-")) {
          refs.push.apply(refs, collectCategoryCardRefs(childRef));
        } else {
          refs.push(childRef);
        }
      });
      return refs;
    }
    function showToast(message) {
      const toast = document.createElement("div");
      toast.className = "customokio-toast";
      toast.textContent = message;
      document.body.appendChild(toast);
      window.setTimeout(function () { toast.remove(); }, 2200);
    }
    async function toggleStar(button) {
      if (!button || button.dataset.pending === "1") return;
      const appId = button.getAttribute("data-app-id");
      if (!appId) return;
      const currentlyStarred = button.getAttribute("data-starred") === "1";
      const nextStarred = !currentlyStarred;
      button.dataset.pending = "1";
      try {
        const response = await fetch("/apps/preferences/" + encodeURIComponent(appId), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ starred: nextStarred })
        });
        const payload = await response.json().catch(function () { return {}; });
        if (response.status === 404) {
          throw new Error("CUSTOMOKIO_LOCAL_STAR_FALLBACK");
        }
        if (!response.ok || !payload || !payload.preference) {
          throw new Error(payload && payload.error ? payload.error : "Failed to update app star");
        }
        const starred = payload.preference.starred ? "1" : "0";
        const line = button.closest(".line");
        if (line) {
          applyStarState(line, payload.preference.starred);
          line.setAttribute("data-launch-count-total", String(payload.preference.launch_count_total || 0));
          line.setAttribute("data-last-launch-at", payload.preference.last_launch_at || "");
        }
        render();
      } catch (error) {
        if (error && error.message === "CUSTOMOKIO_LOCAL_STAR_FALLBACK") {
          prefsState[appId] = Object.assign({}, prefsState[appId] || {}, { starred: nextStarred });
          persistPrefsState();
          const line = button.closest(".line");
          if (line) applyStarState(line, nextStarred);
          render();
          showToast("Star saved locally.");
        } else {
          alert(error && error.message ? error.message : "Failed to update app star");
        }
      } finally {
        delete button.dataset.pending;
      }
    }
    function canMoveRefToParent(ref, parentId) {
      if (!ref || ref === parentId) return false;
      if (ref.startsWith("cat-") && isDescendant(ref, parentId)) return false;
      return true;
    }
    function destroySortables() {
      sortables.forEach((instance) => {
        try { instance.destroy(); } catch (error) {}
      });
      sortables = [];
    }
    function rebuildStateFromDom() {
      const next = {
        version: 3,
        layoutMode: state.layoutMode,
        customColors: (state.customColors || []).slice(),
        root: [],
        categories: {}
      };
      function readList(list) {
        const refs = [];
        Array.from(list.children).forEach((child) => {
          const ref = child.getAttribute("data-ref");
          if (!ref) return;
          refs.push(ref);
          if (ref.startsWith("cat-")) {
            const prev = state.categories[ref] || createCategory("Category", { id: ref });
            const category = createCategory(prev.name, {
              id: ref,
              icon: prev.icon,
              color: prev.color,
              collapsed: prev.collapsed,
              sortMode: normalizeSortMode(prev.sortMode || "manual"),
              itemLayout: prev.itemLayout === "grid" ? "grid" : "list",
              children: []
            });
            const nestedList = child.querySelector(":scope > .customokio-category-dropzone > .customokio-list");
            category.children = nestedList ? readList(nestedList) : [];
            next.categories[ref] = category;
          }
        });
        return refs;
      }
      if (state.layoutMode === "flow") {
        const flowColumns = Array.from(groupHost.querySelectorAll(":scope > .customokio-root-dropzone > .customokio-root-items-flow > .customokio-flow-column.customokio-root-categories"));
        const flowRows = flowColumns.map(readList);
        const mergedFlowRefs = [];
        let rowIndex = 0;
        while (true) {
          let added = false;
          flowRows.forEach((refs) => {
            if (rowIndex < refs.length) {
              mergedFlowRefs.push(refs[rowIndex]);
              added = true;
            }
          });
          if (!added) break;
          rowIndex += 1;
        }
        const rootCardLists = Array.from(groupHost.querySelectorAll(":scope > .customokio-root-dropzone > .customokio-list.customokio-root-uncategorized"));
        next.root = mergedFlowRefs.concat(rootCardLists.flatMap(readList));
      } else {
        const rootLists = Array.from(groupHost.querySelectorAll(":scope > .customokio-root-dropzone > .customokio-list"));
        next.root = rootLists.flatMap(readList);
      }
      state = sanitizeState(next, cardRefs);
      persistState();
      render();
    }
    function initSortables() {
      destroySortables();
      ensureSortable().then((Sortable) => {
        groupHost.querySelectorAll(".customokio-list").forEach((list) => {
          const isFlowCategoryList = list.classList.contains("customokio-root-categories");
          const isRootUncategorizedList = list.classList.contains("customokio-root-uncategorized");
          const instance = new Sortable(list, {
            group: isFlowCategoryList ? {
              name: "customokio",
              put: function (_to, _from, dragged) {
                return Boolean(dragged && dragged.classList.contains("customokio-category-shell"));
              }
            } : isRootUncategorizedList ? {
              name: "customokio",
              put: function (_to, _from, dragged) {
                return Boolean(dragged && dragged.classList.contains("line"));
              }
            } : "customokio",
            animation: 150,
            forceFallback: true,
            fallbackOnBody: true,
            fallbackTolerance: 3,
            emptyInsertThreshold: 20,
            swapThreshold: 0.65,
            draggable: isFlowCategoryList ? ".customokio-category-shell" : isRootUncategorizedList ? ".line" : ".line, .customokio-category-shell",
            handle: ".customokio-category-header, .line",
            filter: ".customokio-category-actions, .customokio-category-actions *, .btn, .btn *",
            preventOnFilter: false,
            onStart: function (event) {
              document.body.classList.add("customokio-dragging");
              if (event.item) event.item.classList.add("customokio-is-dragging");
            },
            onMove: function (event) {
              const ref = event.dragged && event.dragged.getAttribute("data-ref");
              const parentId = event.to && event.to.getAttribute("data-parent-id") || null;
              if (canMoveRefToParent(ref, parentId)) return true;
              if (ref && ref.startsWith("cat-") && isDescendant(ref, parentId)) {
                showToast("You cannot place a category inside one of its descendants.");
              }
              return false;
            },
            onEnd: function () {
              document.body.classList.remove("customokio-dragging");
              document.querySelectorAll(".customokio-is-dragging").forEach((node) => node.classList.remove("customokio-is-dragging"));
              rebuildStateFromDom();
            }
          });
          sortables.push(instance);
        });
      }).catch((error) => {
        console.error(error);
        showToast("Drag and drop failed to initialize.");
      });
    }
    function refreshFilterOptions() {
      const options = [{ value: "all", label: "All categories" }];
      state.root.forEach((ref) => { if (ref.startsWith("cat-") && state.categories[ref]) options.push({ value: ref, label: state.categories[ref].name }); });
      const nextFilter = options.some((option) => option.value === activeFilter) ? activeFilter : "all";
      filterSelect.innerHTML = "";
      options.forEach((option) => {
        const node = document.createElement("option");
        node.value = option.value;
        node.textContent = option.label;
        if (option.value === nextFilter) node.selected = true;
        filterSelect.appendChild(node);
      });
      activeFilter = nextFilter;
      if (filterSelect.tomselect) {
        filterSelect.tomselect.clearOptions();
        options.forEach((option) => filterSelect.tomselect.addOption({ value: option.value, text: option.label }));
        filterSelect.tomselect.setValue(activeFilter, true);
        filterSelect.tomselect.refreshOptions(false);
      }
    }
    function getEffectiveSortMode(parentId) {
      const globalMode = getSortMode();
      if (parentId && state.categories[parentId]) {
        if (globalMode === "manual") return normalizeSortMode(state.categories[parentId].sortMode || "manual");
      }
      return globalMode;
    }
    function getSortedRefs(refs, parentId) {
      const mode = getEffectiveSortMode(parentId);
      if (mode === "manual") return refs.slice();
      const categories = refs.filter((ref) => ref.startsWith("cat-"));
      const cards = refs.filter((ref) => !ref.startsWith("cat-"));
      if (mode === "az") categories.sort((a, b) => state.categories[a].name.localeCompare(state.categories[b].name));
      cards.sort((a, b) => {
        const cardA = cardMap.get(a);
        const cardB = cardMap.get(b);
        if (!cardA || !cardB) return 0;
        const serverA = parseCardMeta(cardA.card, cardA.name);
        const serverB = parseCardMeta(cardB.card, cardB.name);
        const localA = usageState[a] || {};
        const localB = usageState[b] || {};
        cardA.card.dataset.customokioLaunchCount = String(Math.max(serverA.launchCount || 0, Number(localA.launchCount || 0)));
        cardB.card.dataset.customokioLaunchCount = String(Math.max(serverB.launchCount || 0, Number(localB.launchCount || 0)));
        cardA.card.dataset.customokioLastLaunch = String(Math.max(serverA.lastLaunch || 0, Number(localA.lastLaunch || 0)));
        cardB.card.dataset.customokioLastLaunch = String(Math.max(serverB.lastLaunch || 0, Number(localB.lastLaunch || 0)));
        return compareCards(cardA.card, cardB.card, mode, cardA.name, cardB.name);
      });
      return categories.concat(cards);
    }
    function getFlowColumnCount() {
      const availableWidth = Math.max(0, Math.round(groupHost.getBoundingClientRect().width || groupHost.clientWidth || 0));
      const minColumnWidth = 280;
      const gap = 14;
      return Math.max(1, Math.floor((availableWidth + gap) / (minColumnWidth + gap)));
    }
    function renderFlowColumns(root, refs, query) {
      const flowShell = document.createElement("div");
      flowShell.className = "customokio-root-items-flow";
      root.appendChild(flowShell);

      const visibleCategories = [];
      refs.forEach((ref) => {
        if (activeFilter !== "all" && ref !== activeFilter && !categoryContainsRef(ref, activeFilter)) return;
        const category = renderCategory(ref, 0, query);
        if (!category) return;
        const visible = matchesSearch(ref, query) || category.dataset.hasVisibleChildren;
        if (!visible) return;
        visibleCategories.push(category);
      });
      if (!visibleCategories.length) return;

      const columnCount = Math.min(visibleCategories.length, getFlowColumnCount());
      const columns = Array.from({ length: columnCount }, function () {
        const column = document.createElement("div");
        column.className = "customokio-list customokio-flow-column customokio-root-categories";
        column.dataset.parentId = "";
        flowShell.appendChild(column);
        return column;
      });

      visibleCategories.forEach((category, index) => {
        const targetColumn = index < columns.length ? columns[index] : columns.reduce((shortest, column) => {
          return column.getBoundingClientRect().height < shortest.getBoundingClientRect().height ? column : shortest;
        }, columns[0]);
        targetColumn.appendChild(category);
      });
    }
    function matchesSearch(ref, query) {
      if (!query) return true;
      if (ref.startsWith("cat-")) return String(state.categories[ref].name || "").toLowerCase().includes(query);
      const entry = cardMap.get(ref);
      if (!entry) return false;
      return String(entry.name || "").toLowerCase().includes(query) || String(entry.card.getAttribute("data-description") || "").toLowerCase().includes(query);
    }
    function ensureCard(ref) { return cardMap.has(ref) ? cardMap.get(ref).card : null; }

    function openColorPanel(button, category) {
      const panel = openFloatingPanel(button, "customokio-color-panel");
      panel.addEventListener("click", function (event) { event.stopPropagation(); });
      function applyColorLive(nextColor, persist) {
        category.color = nextColor;
        const shell = document.querySelector('[data-category-id="' + category.id + '"]');
        if (shell) {
          shell.style.setProperty("--customokio-category-color", nextColor);
        }
        if (persist) {
          persistState();
          render();
          window.setTimeout(function () {
            const nextButton = document.querySelector('[data-category-id="' + category.id + '"] .customokio-category-actions [data-action="color"]');
            if (nextButton) openColorPanel(nextButton, state.categories[category.id]);
          }, 0);
        }
      }
      const grid = document.createElement("div");
      grid.className = "customokio-color-grid";
      COLORS.concat(state.customColors || []).forEach((color, index) => {
        const wrap = document.createElement("div");
        wrap.className = "customokio-color-swatch-wrap";
        const swatch = document.createElement("button");
        swatch.type = "button";
        swatch.className = "customokio-color-swatch";
        swatch.style.background = color;
        swatch.addEventListener("click", function () {
          applyColorLive(color, true);
        });
        wrap.appendChild(swatch);
        if (index >= COLORS.length) {
          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "customokio-color-remove";
          remove.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
          remove.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            state.customColors = (state.customColors || []).filter((value) => value !== color);
            persistState();
            render();
            window.setTimeout(function () {
              const nextButton = document.querySelector('[data-category-id="' + category.id + '"] .customokio-category-actions [data-action="color"]');
              if (nextButton) openColorPanel(nextButton, state.categories[category.id]);
            }, 0);
          });
          wrap.appendChild(remove);
        }
        grid.appendChild(wrap);
      });
      const custom = document.createElement("label");
      custom.className = "customokio-color-swatch customokio-color-custom";
      custom.innerHTML = '<i class="fa-solid fa-plus"></i><input type="color" class="customokio-color-native" value="' + normalizeColor(category.color) + '">';
      custom.querySelector("input").addEventListener("input", function (event) {
        const nextColor = normalizeColor(event.target.value);
        applyColorLive(nextColor, false);
      });
      custom.querySelector("input").addEventListener("change", function (event) {
        const nextColor = normalizeColor(event.target.value);
        if (!(state.customColors || []).includes(nextColor)) {
          state.customColors = [nextColor].concat(state.customColors || []).slice(0, 24);
        }
        applyColorLive(nextColor, true);
      });
      panel.appendChild(grid);
      panel.appendChild(custom);
    }

    function openIconPanel(button, category) {
      const panel = openFloatingPanel(button, "customokio-icon-panel");
      const grid = document.createElement("div");
      grid.className = "customokio-emoji-grid";
      EMOJIS.forEach((emoji) => {
        const emojiButton = document.createElement("button");
        emojiButton.type = "button";
        emojiButton.className = "btn";
        emojiButton.textContent = emoji;
        emojiButton.addEventListener("click", function () {
          category.icon = emoji;
          persistState();
          render();
          closeFloatingPanel();
        });
        grid.appendChild(emojiButton);
      });
      const input = document.createElement("input");
      input.type = "text";
      input.className = "customokio-panel-input";
      input.maxLength = 4;
      input.value = normalizeCategoryIcon(category.icon, DEFAULT_CATEGORY_ICON);
      const save = document.createElement("button");
      save.type = "button";
      save.className = "btn";
      save.textContent = "Save";
      save.addEventListener("click", function () {
        const value = String(input.value || "").trim();
        if (!value) return;
        category.icon = normalizeCategoryIcon(value, DEFAULT_CATEGORY_ICON);
        persistState();
        render();
        closeFloatingPanel();
      });
      panel.appendChild(grid);
      panel.appendChild(input);
      panel.appendChild(save);
      input.focus();
    }

    function renderCategory(ref, depth, query) {
      const category = state.categories[ref];
      if (!category) return null;
      const topLevelCompact = state.layoutMode !== "stack" && depth === 0;
      const shellLayoutClass = topLevelCompact ? "layout-" + state.layoutMode : "layout-stack";
      const shell = document.createElement("section");
      shell.className = "customokio-category-shell depth-" + depth + " " + shellLayoutClass + (category.collapsed && !query ? " collapsed" : "");
      shell.dataset.categoryId = ref;
      shell.dataset.ref = ref;
      shell.style.setProperty("--customokio-category-color", category.color || DEFAULT_CATEGORY_COLOR);

      const header = document.createElement("div");
      header.className = "customokio-category-header";
      header.addEventListener("dblclick", function (event) {
        if (event.target.closest(".customokio-category-actions")) return;
        category.collapsed = !category.collapsed;
        persistState();
        render();
      });

      const title = document.createElement("div");
      title.className = "customokio-category-title-row";
      title.innerHTML = '<span class="customokio-category-icon"></span><span class="customokio-category-title"></span><span class="customokio-category-meta"></span>';
      title.querySelector(".customokio-category-icon").textContent = normalizeCategoryIcon(category.icon, DEFAULT_CATEGORY_ICON);
      title.querySelector(".customokio-category-title").textContent = category.name;
      title.querySelector(".customokio-category-meta").textContent = String(category.children.length);
      header.appendChild(title);

      const actions = document.createElement("div");
      actions.className = "customokio-category-actions";
      actions.innerHTML = '<button type="button" class="btn" data-action="subgroup" title="Add subgroup"><i class="fa-solid fa-folder-plus"></i></button><button type="button" class="btn" data-action="sort" title="Sort category"><i class="fa-solid fa-arrow-down-a-z"></i></button><button type="button" class="btn" data-action="items" title="Category view"><i class="fa-solid fa-table-cells"></i></button><button type="button" class="btn" data-action="color" title="Set color"><i class="fa-solid fa-palette"></i></button><button type="button" class="btn" data-action="icon" title="Set icon"><i class="fa-regular fa-image"></i></button><button type="button" class="btn" data-action="rename" title="Rename"><i class="fa-solid fa-pen"></i></button><button type="button" class="btn" data-action="delete" title="Delete"><i class="fa-regular fa-trash-can"></i></button>';
      actions.addEventListener("click", async function (event) {
        const button = event.target.closest("button");
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        const action = button.getAttribute("data-action");
        if (action === "subgroup") {
          const name = await openTextPrompt({
            title: "Subcategory name",
            placeholder: "New subcategory",
            confirmText: "Create"
          });
          if (!name) return;
          const next = createCategory(name, { collapsed: false });
          state.categories[next.id] = next;
          addRef(ref, next.id, "prepend");
          persistState();
          render();
        } else if (action === "sort") {
          const panel = openFloatingPanel(button, "customokio-sort-panel");
          [
            { value: "manual", label: "Manual order" },
            { value: "most_used", label: "Most used" },
            { value: "last_opened", label: "Last opened" },
            { value: "az", label: "A-Z" }
          ].forEach((option) => {
            const sortButton = document.createElement("button");
            sortButton.type = "button";
            sortButton.className = "btn";
            sortButton.textContent = option.label + (category.sortMode === option.value ? " \u2713" : "");
            sortButton.addEventListener("click", function () {
              category.sortMode = option.value;
              persistState();
              render();
              closeFloatingPanel();
            });
            panel.appendChild(sortButton);
          });
          const resetButton = document.createElement("button");
          resetButton.type = "button";
          resetButton.className = "btn";
          resetButton.textContent = "Reset usage";
          resetButton.addEventListener("click", function () {
            collectCategoryCardRefs(ref).forEach((cardRef) => {
              delete usageState[cardRef];
              const cardEntry = cardMap.get(cardRef);
              if (cardEntry && cardEntry.card) {
                cardEntry.card.removeAttribute("data-customokio-launch-count");
                cardEntry.card.removeAttribute("data-customokio-last-launch");
              }
            });
            persistUsageState();
            render();
            closeFloatingPanel();
            showToast("Category usage reset.");
          });
          panel.appendChild(resetButton);
        } else if (action === "items") {
          const panel = openFloatingPanel(button, "customokio-items-panel");
          [
            { value: "list", label: "List view" },
            { value: "grid", label: "Grid view" }
          ].forEach((option) => {
            const layoutButton = document.createElement("button");
            layoutButton.type = "button";
            layoutButton.className = "btn";
            layoutButton.textContent = option.label + (category.itemLayout === option.value ? " *" : "");
            layoutButton.addEventListener("click", function () {
              category.itemLayout = option.value;
              persistState();
              render();
              closeFloatingPanel();
            });
            panel.appendChild(layoutButton);
          });
        } else if (action === "rename") {
          const nextName = await openTextPrompt({
            title: "Rename category",
            value: category.name,
            confirmText: "Save"
          });
          if (!nextName) return;
          category.name = nextName;
          persistState();
          render();
        } else if (action === "delete") {
          const parentId = findParentId(ref);
          const siblings = getChildren(parentId);
          const index = siblings.indexOf(ref);
          if (index < 0) return;
          siblings.splice(index, 1, ...category.children);
          delete state.categories[ref];
          persistState();
          render();
        } else if (action === "color") {
          openColorPanel(button, category);
        } else if (action === "icon") {
          openIconPanel(button, category);
        }
      });
      header.appendChild(actions);
      shell.appendChild(header);

      const dropzone = document.createElement("div");
      dropzone.className = "customokio-category-dropzone";
      shell.appendChild(dropzone);
      const list = document.createElement("div");
      list.className = "customokio-list customokio-items-" + (category.itemLayout === "grid" ? "grid" : "list");
      list.dataset.parentId = ref;
      dropzone.appendChild(list);
      const empty = document.createElement("div");
      empty.className = "customokio-empty-dropzone";
      empty.textContent = "Drop apps or categories here.";
      dropzone.appendChild(empty);

      let visibleChildren = 0;
      getSortedRefs(category.children, ref).forEach((childRef) => {
        if (activeFilter !== "all" && ref !== activeFilter && !categoryContainsRef(ref, activeFilter)) return;
        if (childRef.startsWith("cat-")) {
          const nested = renderCategory(childRef, depth + 1, query);
          if (!nested) return;
          if (!matchesSearch(childRef, query) && !nested.dataset.hasVisibleChildren) nested.style.display = "none"; else visibleChildren += 1;
          list.appendChild(nested);
          return;
        }
        const card = ensureCard(childRef);
        if (!card) return;
        const visible = matchesSearch(childRef, query);
        card.style.display = visible ? "" : "none";
        card.dataset.ref = childRef;
        list.appendChild(card);
        if (visible) visibleChildren += 1;
      });
      empty.hidden = list.children.length > 0;
      if (visibleChildren > 0) shell.dataset.hasVisibleChildren = "1";
      return shell;
    }

    function render() {
      destroySortables();
      refreshFilterOptions();
      const query = String(searchForm.querySelector("input[type='search']")?.value || "").trim().toLowerCase();
      groupHost.innerHTML = "";
      groupHost.classList.toggle("folder-mode", state.layoutMode === "folder");
      groupHost.classList.toggle("flow-mode", state.layoutMode === "flow");
      if (runningContainer) runningContainer.style.display = "none";
      if (notRunningContainer) notRunningContainer.style.display = "none";

      const root = document.createElement("div");
      root.className = "customokio-root-dropzone";
      groupHost.appendChild(root);
      const sortedRootRefs = getSortedRefs(state.root, null);

      if (state.layoutMode === "flow") {
        const categoryRefs = sortedRootRefs.filter((ref) => ref.startsWith("cat-"));
        const cardRefsAtRoot = sortedRootRefs.filter((ref) => !ref.startsWith("cat-"));

        renderFlowColumns(root, categoryRefs, query);

        if (cardRefsAtRoot.length) {
          const uncategorizedList = document.createElement("div");
          uncategorizedList.className = "customokio-list customokio-root-items-list customokio-root-uncategorized";
          uncategorizedList.dataset.parentId = "";
          root.appendChild(uncategorizedList);

          cardRefsAtRoot.forEach((ref) => {
            if (activeFilter !== "all" && ref !== activeFilter && !categoryContainsRef(ref, activeFilter)) return;
            const card = ensureCard(ref);
            if (!card) return;
            card.style.display = matchesSearch(ref, query) ? "" : "none";
            card.dataset.ref = ref;
            uncategorizedList.appendChild(card);
          });
        }
      } else {
        const rootList = document.createElement("div");
        rootList.className = "customokio-list customokio-root-items-" + (state.layoutMode === "folder" ? "grid" : "list");
        rootList.dataset.parentId = "";
        root.appendChild(rootList);

        sortedRootRefs.forEach((ref) => {
          if (activeFilter !== "all" && ref !== activeFilter && !categoryContainsRef(ref, activeFilter)) return;
          if (ref.startsWith("cat-")) {
            const category = renderCategory(ref, 0, query);
            if (!category) return;
            if (!matchesSearch(ref, query) && !category.dataset.hasVisibleChildren) category.style.display = "none";
            rootList.appendChild(category);
            return;
          }
          const card = ensureCard(ref);
          if (!card) return;
          card.style.display = matchesSearch(ref, query) ? "" : "none";
          card.dataset.ref = ref;
          rootList.appendChild(card);
        });
      }
      initSortables();
    }

    Array.from(sortSelect.options).forEach((option) => {
      if (option.value === "category_az") option.remove();
    });
    if (!Array.from(sortSelect.options).some((entry) => entry.value === "manual")) {
      const manualOption = document.createElement("option");
      manualOption.value = "manual";
      manualOption.textContent = "Manual";
      sortSelect.appendChild(manualOption);
    }
    sortSelect.value = "manual";
    if (sortSelect.tomselect) {
      if (sortSelect.tomselect.options["category_az"]) {
        sortSelect.tomselect.removeOption("category_az");
      }
      if (!sortSelect.tomselect.options.manual) {
        sortSelect.tomselect.addOption({ value: "manual", text: "Manual" });
      }
      sortSelect.tomselect.setValue("manual", true);
      sortSelect.tomselect.refreshOptions(false);
      sortSelect.tomselect.sync();
    }

    cardEntries.forEach((entry) => {
      const localPrefs = prefsState[entry.ref];
      if (localPrefs && typeof localPrefs.starred === "boolean") {
        applyStarState(entry.card, localPrefs.starred);
      }
      const openMenuButton = entry.card.querySelector(".open-menu");
      if (openMenuButton && !openMenuButton.dataset.customokioMenuBound) {
        openMenuButton.dataset.customokioMenuBound = "1";
        openMenuButton.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
          const contextMenu = openMenuButton.closest(".col")?.querySelector(".context-menu");
          if (!contextMenu) return;

          document.querySelectorAll('.context-menu[popover]').forEach((menuEl) => {
            if (menuEl !== contextMenu && menuEl.matches(':popover-open') && typeof menuEl.hidePopover === 'function') {
              menuEl.hidePopover();
            }
          });
          document.querySelectorAll('.context-menu[data-open="true"]').forEach((menuEl) => {
            if (menuEl !== contextMenu) {
              menuEl.style.display = 'none';
              menuEl.dataset.open = 'false';
            }
          });

          const hasNativePopover = typeof contextMenu.showPopover === "function";
          const isOpen = hasNativePopover ? contextMenu.matches(':popover-open') : contextMenu.dataset.open === 'true';
          if (isOpen) {
            if (hasNativePopover) {
              contextMenu.hidePopover();
            } else {
              contextMenu.style.display = 'none';
              contextMenu.dataset.open = 'false';
            }
            return;
          }

          let width = parseFloat(contextMenu.dataset.cachedWidth || '0');
          let height = parseFloat(contextMenu.dataset.cachedHeight || '0');
          if (!width || !height) {
            const prev = {
              visibility: contextMenu.style.visibility,
              display: contextMenu.style.display,
              position: contextMenu.style.position,
              top: contextMenu.style.top,
              left: contextMenu.style.left,
            };
            contextMenu.style.visibility = 'hidden';
            contextMenu.style.display = 'block';
            contextMenu.style.position = 'fixed';
            contextMenu.style.top = '0';
            contextMenu.style.left = '0';
            width = contextMenu.offsetWidth;
            height = contextMenu.offsetHeight;
            if (width) contextMenu.dataset.cachedWidth = String(width);
            if (height) contextMenu.dataset.cachedHeight = String(height);
            contextMenu.style.visibility = prev.visibility;
            contextMenu.style.display = prev.display;
            contextMenu.style.position = prev.position;
            contextMenu.style.top = prev.top;
            contextMenu.style.left = prev.left;
          }

          const buttonRect = openMenuButton.getBoundingClientRect();
          const viewportPadding = 12;
          let left = Math.min(buttonRect.left, window.innerWidth - width - viewportPadding);
          left = Math.max(viewportPadding, left);
          let top = buttonRect.bottom + 6;
          if (top + height + viewportPadding > window.innerHeight) {
            top = buttonRect.top - height - 6;
          }
          const maxTop = Math.max(viewportPadding, window.innerHeight - height - viewportPadding);
          top = Math.min(Math.max(viewportPadding, top), maxTop);

          if (hasNativePopover) {
            contextMenu.style.position = 'fixed';
            contextMenu.style.left = left + 'px';
            contextMenu.style.top = top + 'px';
            contextMenu.style.right = 'auto';
            contextMenu.style.bottom = 'auto';
            contextMenu.showPopover();
          } else {
            const btnContainer = openMenuButton.closest('.menu-btns');
            if (!btnContainer) return;
            const containerRect = btnContainer.getBoundingClientRect();
            contextMenu.style.left = Math.max(0, left - containerRect.left) + 'px';
            contextMenu.style.top = top - containerRect.top + 'px';
            contextMenu.style.right = 'auto';
            contextMenu.style.bottom = 'auto';
            contextMenu.style.display = 'block';
            contextMenu.dataset.open = 'true';
          }
        }, true);
      }

      const closeInlineContextMenu = (button) => {
        const contextMenu = button ? button.closest(".context-menu") : null;
        if (!contextMenu) return;
        try {
          if (typeof contextMenu.hidePopover === "function" && contextMenu.matches(":popover-open")) {
            contextMenu.hidePopover();
          }
        } catch (_) {}
        contextMenu.style.display = "none";
        contextMenu.dataset.open = "false";
      };

      const bindMenuAction = (selector, handler) => {
        entry.card.querySelectorAll(selector).forEach((button) => {
          if (!button || button.dataset.customokioActionBound === "1") return;
          button.dataset.customokioActionBound = "1";
          button.addEventListener("click", async function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
            try {
              await handler(button);
            } catch (error) {
              console.error("Customokio menu action failed", error);
              alert(error && error.message ? error.message : String(error));
            }
          }, true);
        });
      };

      const buildEditorOptions = (button, extra = {}) => {
        const line = button.closest(".line");
        if (!line) {
          throw new Error("App card context is missing.");
        }
        const disableMessage = button.getAttribute("data-disable");
        if (disableMessage && disableMessage.length > 0) {
          alert(disableMessage);
          return null;
        }
        return Object.assign({
          title: line.getAttribute("data-title"),
          description: line.getAttribute("data-description"),
          old_path: line.getAttribute("data-path"),
          icon: line.getAttribute("data-icon"),
          iconpath: line.getAttribute("data-iconpath"),
          edit: true,
          redirect: function () { return location.href; }
        }, extra);
      };

      bindMenuAction(".browse", async function (button) {
        const src = button.getAttribute("data-src");
        closeInlineContextMenu(button);
        if (!src) return;
        if (window.PinokioHomeGuardNavigate) {
          window.PinokioHomeGuardNavigate(src);
        } else {
          location.href = src;
        }
      });

      bindMenuAction(".edit-menu", async function (button) {
        if (typeof FSEditor !== "function") {
          throw new Error("FSEditor is unavailable.");
        }
        const options = buildEditorOptions(button);
        if (!options) return;
        closeInlineContextMenu(button);
        await FSEditor(options);
      });

      bindMenuAction(".copy-menu", async function (button) {
        if (typeof FSEditor !== "function") {
          throw new Error("FSEditor is unavailable.");
        }
        const options = buildEditorOptions(button, { copy: true });
        if (!options) return;
        closeInlineContextMenu(button);
        await FSEditor(options);
      });

      bindMenuAction(".move-menu", async function (button) {
        if (typeof FSEditor !== "function") {
          throw new Error("FSEditor is unavailable.");
        }
        const options = buildEditorOptions(button, { move: true });
        if (!options) return;
        closeInlineContextMenu(button);
        await FSEditor(options);
      });

      bindMenuAction(".del", async function (button) {
        const disableMessage = button.getAttribute("data-disable");
        if (disableMessage && disableMessage.length > 0) {
          alert(disableMessage);
          return;
        }
        closeInlineContextMenu(button);
        const safeResetUri = button.getAttribute("data-safe-reset-uri");
        const confirmMessage = safeResetUri
          ? "Customokio changes Pinokio's home files. Safe Delete will restore the default home first, then delete the Customokio folder. Continue?"
          : "Are you sure you want to delete the folder? All files in the folder will be gone.";
        if (!confirm(confirmMessage)) {
          return;
        }
        const itemEl = button.closest(".line[data-uri]");
        if (!itemEl) {
          throw new Error("App card context is missing.");
        }
        const name = itemEl.getAttribute("data-uri");
        try {
          if (safeResetUri) {
            Swal.fire({
              html: '<i class="fa-solid fa-circle-notch fa-spin"></i> Restoring default Pinokio home',
              customClass: {
                container: "loader-container",
                popup: "loader-popup",
                htmlContainer: "loader-dialog",
                footer: "hidden",
                actions: "hidden"
              }
            });
            await runScriptRpc(safeResetUri);
            Swal.update({
              html: '<i class="fa-solid fa-circle-notch fa-spin"></i> Deleting Customokio'
            });
          } else {
            Swal.fire({
              html: '<i class="fa-solid fa-circle-notch fa-spin"></i> Deleting',
              customClass: {
                container: "loader-container",
                popup: "loader-popup",
                htmlContainer: "loader-dialog",
                footer: "hidden",
                actions: "hidden"
              }
            });
          }
          const res = await deleteHomeApp(name);
          Swal.close();
          if (res && res.success) {
            location.href = "/home";
            return;
          }
          if (res && res.error) {
            throw new Error(res.error);
          }
        } catch (error) {
          try { Swal.close(); } catch (_) {}
          if (safeResetUri) {
            throw new Error("Customokio safe delete could not finish.\n\n" + formatRpcError(error && error.message ? error.message : error));
          }
          throw error;
        }
      });

      entry.card.setAttribute("draggable", "false");
      entry.card.querySelectorAll("img, svg").forEach((node) => node.setAttribute("draggable", "false"));
      entry.card.addEventListener("dragstart", function (event) {
        event.preventDefault();
      });
      entry.card.addEventListener("mousedown", function () {
        if (document.activeElement && typeof document.activeElement.blur === "function") document.activeElement.blur();
      });
      entry.card.addEventListener("click", function (event) {
        const ignored = event.target.closest(".toggle-star, .open-menu, .edit-menu, .copy-menu, .move-menu, .browse, .del, .shutdown, [data-filepath], .menu-btn, .menu-btns, .btns, .context-menu");
        if (ignored) return;
        const href = entry.card.getAttribute("data-browser-url");
        if (!href) return;
        recordUsage(entry.ref);
        if (window.PinokioHomeGuardNavigate) {
          window.PinokioHomeGuardNavigate(href);
        } else {
          location.href = href;
        }
      });
    });

    if (typeof window.TomSelect === "function" && !filterSelect.tomselect) {
      new TomSelect(filterSelect, {
        create: false,
        maxItems: 1,
        allowEmptyOption: false,
        searchField: [],
        controlInput: null,
        dropdownParent: filterWrap
      });
    }

    document.addEventListener("click", function (event) {
      if (floatingPanel && !floatingPanel.contains(event.target) && !event.target.closest(".customokio-category-actions") && !event.target.closest(".customokio-toolbar")) closeFloatingPanel();
    });
    document.addEventListener("click", function (event) {
      const button = event.target.closest(".toggle-star");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      toggleStar(button);
    }, true);

    toolbar.addEventListener("click", async function (event) {
      const button = event.target.closest("button");
      if (!button) return;
      const action = button.getAttribute("data-action");
      if (action === "new") {
        const name = await openTextPrompt({
          title: "Category name",
          placeholder: "New category",
          confirmText: "Create"
        });
        if (!name) return;
        const category = createCategory(name, { collapsed: false });
        state.categories[category.id] = category;
        addRef(null, category.id, "prepend");
        persistState();
        render();
        return;
      }
      if (action === "layout") {
        const panel = openFloatingPanel(button, "customokio-layout-panel");
        [
          { value: "stack", label: "Stacked view" },
          { value: "folder", label: "Folder view" },
          { value: "flow", label: "Flow view" }
        ].forEach((layout) => {
          const layoutButton = document.createElement("button");
          layoutButton.type = "button";
          layoutButton.className = "btn";
          layoutButton.textContent = layout.label;
          layoutButton.addEventListener("click", function () {
            state.layoutMode = layout.value;
            persistState();
            render();
            closeFloatingPanel();
          });
          panel.appendChild(layoutButton);
        });
        return;
      }
      if (action === "items-all") {
        const panel = openFloatingPanel(button, "customokio-items-panel");
        [
          { value: "list", label: "List view for all categories" },
          { value: "grid", label: "Grid view for all categories" }
        ].forEach((option) => {
          const itemsButton = document.createElement("button");
          itemsButton.type = "button";
          itemsButton.className = "btn";
          itemsButton.textContent = option.label;
          itemsButton.addEventListener("click", function () {
            setAllCategoryItemLayout(option.value);
            persistState();
            render();
            closeFloatingPanel();
          });
          panel.appendChild(itemsButton);
        });
        return;
      }
      if (action === "collapse-all") {
        setAllCategoriesCollapsed(true);
        persistState();
        render();
        return;
      }
      if (action === "expand-all") {
        setAllCategoriesCollapsed(false);
        persistState();
        render();
        return;
      }
      if (action === "export") {
        const blob = new Blob([JSON.stringify(clone(state), null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "customokio-layout.json";
        link.click();
        URL.revokeObjectURL(url);
        return;
      }
      if (action === "import") { importInput.click(); return; }
      if (action === "reset") {
        state = createDefaultState(cardRefs);
        persistState();
        render();
      }
    });

    importInput.addEventListener("change", function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          state = sanitizeState(JSON.parse(String(reader.result || "{}")), cardRefs);
          persistState();
          render();
          showToast("Layout imported.");
        } catch (error) {
          console.error("Failed to import layout", error);
          showToast("Import failed.");
        }
      };
      reader.readAsText(file);
      importInput.value = "";
    });

    let resizeFrame = 0;
    function scheduleRender() {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(function () {
        resizeFrame = 0;
        render();
      });
    }

    searchForm.addEventListener("input", scheduleRender);
    sortSelect.addEventListener("change", render);
    if (sortSelect.tomselect) {
      sortSelect.tomselect.on("change", function (value) { sortSelect.value = value; render(); });
      sortSelect.tomselect.on("dropdown_close", render);
    }
    filterSelect.addEventListener("change", function () { activeFilter = filterSelect.value || "all"; render(); });
    if (filterSelect.tomselect) filterSelect.tomselect.on("change", function (value) { activeFilter = value || "all"; render(); });
    window.addEventListener("resize", scheduleRender);

    window.Customokio = {
      getState: function () { return clone(state); },
      resetLayout: function () { state = createDefaultState(cardRefs); persistState(); render(); }
    };

    render();
    if (typeof MutationObserver === "function") {
      domObserver = new MutationObserver(function (mutations) {
        const relevant = mutations.some((mutation) => {
          const target = mutation.target && mutation.target.nodeType === 1 ? mutation.target : mutation.target && mutation.target.parentElement;
          return !target || (!groupHost.contains(target) && !controls.contains(target));
        });
        if (!relevant) return;
        if (shouldReinitializeFromDom()) queueReinitialize();
      });
      domObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"]
      });
    }
    resolvePendingState(true);
  }
  let didInitialize = false;
  function initOnce() {
    if (didInitialize) return;
    if (document.querySelector(".customokio-group-host")) {
      didInitialize = true;
      return;
    }
    didInitialize = true;
    try {
      setup();
    } catch (error) {
      didInitialize = false;
      resolvePendingState(false);
      console.error("Failed to initialize Customokio", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOnce, { once: true });
  } else {
    initOnce();
  }
  window.addEventListener("pageshow", initOnce);
})();
