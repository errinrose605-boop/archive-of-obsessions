const $ = (selector) => document.querySelector(selector);
const STORAGE_KEY = "archive-of-obsessions-v1";
const CLOUD_SESSION_KEY = "archive-of-obsessions-supabase-session";
const DATA_VERSION = 6;
let state = { pages: buildOriginalPages(), current: 0, editMode: true, zoom: 72, dataVersion: DATA_VERSION };
let activeImageTarget = null;
let saveTimer;
let cloudSession = JSON.parse(localStorage.getItem(CLOUD_SESSION_KEY) || "null");

const dbReady = new Promise((resolve, reject) => {
  const request = indexedDB.open("ArchiveOfObsessions", 1);
  request.onupgradeneeded = () => request.result.createObjectStore("journal");
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

async function loadState() {
  try {
    const db = await dbReady;
    const saved = await new Promise((resolve, reject) => {
      const req = db.transaction("journal").objectStore("journal").get(STORAGE_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (saved?.pages?.length) state = saved;
  } catch (error) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = JSON.parse(saved);
  }
  migrateState();
  state.current = Math.min(state.current || 0, state.pages.length - 1);
}

function migrateState() {
  if ((state.dataVersion || 1) >= DATA_VERSION) return;
  const currentId = state.pages[state.current]?.id;
  if ((state.dataVersion || 1) < 2) {
    const statsCover = state.pages.find(page => page.id === "reading_stats");
    if (statsCover) {
      statsCover.template = "cover";
      statsCover.title = "Reading Stats Cover";
      statsCover.artwork = "dividers/The keepers ledger divider.png";
    }
    const misplacedDivider = state.pages.find(page =>
      page.id === "library" && page.title === "Library Divider"
    );
    if (misplacedDivider) {
      misplacedDivider.id = "reading_stats.000";
      misplacedDivider.section = "reading_stats";
      misplacedDivider.template = "stats";
      misplacedDivider.title = "Archive Report 1";
      misplacedDivider.artwork = templateCatalog.stats.artwork;
    }
  }
  if ((state.dataVersion || 1) < 3) {
    state.pages.filter(page => page.template === "hallOfFameSeries").forEach(page => {
      if (page.data?.cover && !page.data.cover1) page.data.cover1 = page.data.cover;
      if (page.data) delete page.data.cover;
    });
  }
  if ((state.dataVersion || 1) < 4 && !state.pages.some(page => page.id === "library.filled")) {
    const firstLibraryIndex = state.pages.findIndex(page => page.section === "library");
    const filledLibraryPage = page("library.filled", "library", "cover", "Library Collection", "library/Library filled.png");
    state.pages.splice(firstLibraryIndex >= 0 ? firstLibraryIndex : 2, 0, filledLibraryPage);
  }
  if ((state.dataVersion || 1) < 5) {
    const libraryPages = state.pages.filter(page => page.section === "library");
    const covers = [];
    libraryPages.forEach(libraryPage => {
      Object.entries(libraryPage.data || {}).forEach(([key, value]) => {
        if (/^cover\d+$/.test(key) && value?.src) covers.push(value);
      });
    });
    const newLibraryPage = page("library", "library", "library", "Library");
    covers.slice(0, 9).forEach((cover, index) => {
      newLibraryPage.data[`cover${index + 1}`] = cover;
    });
    if (covers.length > 9) newLibraryPage.data.overflowCovers = covers.slice(9);
    const firstLibraryIndex = state.pages.findIndex(page => page.section === "library");
    state.pages = state.pages.filter(page => page.section !== "library");
    state.pages.splice(firstLibraryIndex >= 0 ? firstLibraryIndex : 2, 0, newLibraryPage);
  }
  if ((state.dataVersion || 1) < 6) {
    const existingLibraryPages = state.pages.filter(page => page.section === "library");
    const firstLibraryIndex = state.pages.findIndex(page => page.section === "library");
    if (existingLibraryPages[0]) {
      existingLibraryPages[0].id = "library.001";
      existingLibraryPages[0].title = "Library Page 1";
    }
    const additionalLibraryPages = Array.from({ length: 5 }, (_, i) =>
      page(`library.${String(i + 2).padStart(3, "0")}`, "library", "library", `Library Page ${i + 2}`)
    );
    state.pages.splice((firstLibraryIndex >= 0 ? firstLibraryIndex : 2) + 1, 0, ...additionalLibraryPages);
  }
  state.dataVersion = DATA_VERSION;
  const migratedIndex = state.pages.findIndex(page => page.id === currentId);
  if (migratedIndex >= 0) state.current = migratedIndex;
  saveState(true);
}

function saveState(immediate = false) {
  $("#saveStatus").textContent = "Saving changes...";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const db = await dbReady;
      await new Promise((resolve, reject) => {
        const tx = db.transaction("journal", "readwrite");
        tx.objectStore("journal").put(state, STORAGE_KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    $("#saveStatus").textContent = "All changes saved locally";
  }, immediate ? 0 : 350);
}

function currentPage() { return state.pages[state.current]; }
function templateFor(page) { return templateCatalog[page.template] || templateCatalog.cover; }
function artworkFor(page) { return ASSET + (page.artwork || templateFor(page).artwork); }
function pageName(page) { return page.data?.title?.trim() || page.data?.name?.trim() || page.title; }

function renderAll() {
  document.documentElement.style.setProperty("--zoom", state.zoom / 100);
  $("#zoomRange").value = state.zoom;
  $("#zoomLabel").textContent = `${state.zoom}%`;
  $("#pageShell").classList.toggle("edit-mode", state.editMode);
  $("#editToggle").classList.toggle("active", state.editMode);
  renderCurrentPage();
}

function searchableText(page) {
  return `${page.title} ${sectionLabels[page.section] || ""} ${JSON.stringify(page.data || {})}`.toLowerCase();
}

function renderCurrentPage() {
  const page = currentPage();
  $("#pageShell").classList.toggle("light-template", ["dnf", "stats", "futureA", "futureB"].includes(page.template));
  $("#pageShell").dataset.template = page.template;
  $("#currentTitle").textContent = pageName(page);
  $("#currentMeta").textContent = `${sectionLabels[page.section] || page.section} · Page ${state.current + 1} of ${state.pages.length}`;
  $("#pageArtwork").src = artworkFor(page);
  $("#pageArtwork").alt = page.title;
  $("#pageJump").value = state.current + 1;
  $("#pageJump").max = state.pages.length;
  const layer = $("#editableLayer");
  layer.innerHTML = "";
  templateFor(page).fields.forEach(field => layer.appendChild(renderField(page, field)));
  (page.custom || []).forEach(item => layer.appendChild(renderCustom(page, item)));
  renderNavigation(page);
}

function navigationHotspot(label, x, y, w, h, action) {
  const hotspot = document.createElement("button");
  hotspot.className = "navigation-hotspot";
  hotspot.setAttribute("aria-label", label);
  Object.assign(hotspot.style, { left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` });
  hotspot.onclick = action;
  return hotspot;
}

function renderNavigation(page) {
  const layer = $("#navigationLayer");
  layer.innerHTML = "";
  if (page.id === "contents") {
    const rows = [
      ["Library", "library", 24.4, 6.8],
      ["Series", "series", 31.6, 7.2],
      ["Standalones", "standalones", 39.2, 6.5],
      ["Hall of Fame", "hall_of_fame", 46.2, 7.6],
      ["Book Boyfriends", "book_boyfriends", 54.2, 7.1],
      ["DNF Graveyard", "dnf_graveyard", 61.7, 7.6],
      ["Future Obsessions", "future_obsessions", 69.7, 7.9],
      ["Reading Stats", "reading_stats", 78.0, 8.5]
    ];
    rows.forEach(([label, section, y, height]) => layer.appendChild(navigationHotspot(
      `Open ${label}`, 9, y, 82, height, () => navigate(state.pages.findIndex(item => item.section === section))
    )));
    return;
  }
  if (page.id === "cover") {
    layer.appendChild(navigationHotspot("Open contents", 0, 0, 100, 100, () => navigate(state.pages.findIndex(item => item.id === "contents"))));
    return;
  }
  if (state.editMode) return;
  const contentsIndex = state.pages.findIndex(item => item.id === "contents");
  layer.appendChild(navigationHotspot("Back to contents", 0, 0, 18, 10, () => navigate(contentsIndex)));
  layer.appendChild(navigationHotspot("Back to contents", 57, 89, 31, 8, () => navigate(contentsIndex)));
}

function fieldBox(node, field) {
  Object.assign(node.style, { left: `${field.x}%`, top: `${field.y}%`, width: `${field.w}%`, height: `${field.h}%` });
  node.className = `field ${field.type}-field-wrap`;
  node.dataset.field = field.id;
  return node;
}

function renderField(page, field, isPrint = false) {
  const wrap = fieldBox(document.createElement("div"), field);
  if (field.className) wrap.classList.add(...field.className.split(" "));
  const value = page.data?.[field.id];
  if (field.type === "text" || field.type === "textarea") {
    const editor = document.createElement("div");
    editor.className = `${field.type}-field ${field.align ? `align-${field.align}` : ""} ${field.size ? `size-${field.size}` : ""}`;
    editor.contentEditable = !isPrint && state.editMode ? "true" : "false";
    editor.dataset.placeholder = field.placeholder || "Click to edit";
    editor.textContent = value || "";
    editor.addEventListener("input", () => updateField(page, field.id, editor.textContent));
    wrap.appendChild(editor);
  } else if (field.type === "rating") {
    wrap.classList.add("rating-field");
    if (field.nativeArtwork) wrap.classList.add("native-rating");
    if (field.nativeShape) wrap.classList.add(`native-${field.nativeShape}`);
    for (let i = 1; i <= field.max; i++) {
      const star = document.createElement("button");
      star.textContent = field.nativeArtwork ? "" : (field.icon || "☆");
      star.setAttribute("aria-label", `${field.id} rating ${i} of ${field.max}`);
      star.className = i <= (Number(value) || 0) ? "on" : "";
      star.onclick = () => { if (!isPrint && state.editMode) { updateField(page, field.id, i === Number(value) ? 0 : i); renderCurrentPage(); } };
      wrap.appendChild(star);
    }
  } else if (field.type === "checks") {
    wrap.classList.add("checks-field");
    if (field.layout === "horizontal") wrap.classList.add("checks-horizontal");
    if (field.marker === "radio") wrap.classList.add("checks-radio");
    const selected = Array.isArray(value) ? value : [];
    field.options.forEach(option => {
      const label = document.createElement("label");
      label.className = "check-row";
      const box = document.createElement("input");
      box.type = "checkbox"; box.checked = selected.includes(option); box.disabled = isPrint || !state.editMode;
      box.setAttribute("aria-label", option);
      box.tabIndex = -1;
      const text = document.createElement("span");
      text.className = "check-label-text";
      text.textContent = option;
      label.append(box, text);
      label.onclick = event => {
        event.preventDefault();
        if (isPrint || !state.editMode) return;
        const next = selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option];
        updateField(page, field.id, next);
        renderCurrentPage();
      };
      wrap.appendChild(label);
    });
  } else if (field.type === "image") {
    wrap.classList.add("image-field");
    if (value?.src) {
      wrap.classList.add("has-image");
      const img = document.createElement("img");
      img.src = value.src;
      img.style.objectPosition = `${value.x ?? 50}% ${value.y ?? 50}%`;
      img.style.transform = `scale(${value.zoom || 1})`;
      if (!isPrint) enableImagePan(img, page, field.id);
      wrap.appendChild(img);
    }
    const placeholder = document.createElement("button");
    placeholder.className = "image-placeholder"; placeholder.textContent = field.placeholder || "Add image";
    placeholder.onclick = () => chooseImage({ page, fieldId: field.id });
    wrap.appendChild(placeholder);
    if (!isPrint && value?.src) wrap.appendChild(imageActions(page, field.id));
  }
  return wrap;
}

function imageActions(page, fieldId) {
  const actions = document.createElement("div");
  actions.className = "image-actions";
  [["−", -.1], ["＋", .1]].forEach(([label, amount]) => {
    const button = document.createElement("button"); button.textContent = label;
    button.onclick = () => {
      const image = page.data[fieldId];
      image.zoom = Math.max(.35, Math.min(4, (image.zoom || 1) + amount));
      saveState(); renderCurrentPage();
    };
    actions.appendChild(button);
  });
  [["<", -6, 0], ["^", 0, -6], ["v", 0, 6], [">", 6, 0]].forEach(([label, x, y]) => {
    const button = document.createElement("button"); button.textContent = label;
    button.onclick = event => {
      event.preventDefault(); event.stopPropagation();
      const image = page.data[fieldId];
      image.x = Math.max(0, Math.min(100, (image.x ?? 50) + x));
      image.y = Math.max(0, Math.min(100, (image.y ?? 50) + y));
      saveState(); renderCurrentPage();
    };
    actions.appendChild(button);
  });
  const fit = document.createElement("button"); fit.textContent = "Fit"; fit.onclick = event => {
    event.preventDefault(); event.stopPropagation();
    Object.assign(page.data[fieldId], { x: 50, y: 50, zoom: 1 });
    saveState(); renderCurrentPage();
  };
  actions.appendChild(fit);
  const replace = document.createElement("button"); replace.textContent = "Replace"; replace.onclick = () => chooseImage({ page, fieldId });
  const remove = document.createElement("button"); remove.textContent = "×"; remove.onclick = () => { delete page.data[fieldId]; saveState(); renderCurrentPage(); };
  actions.append(replace, remove);
  return actions;
}

function enableImagePan(img, page, fieldId) {
  img.style.cursor = "grab";
  img.style.touchAction = "none";
  img.onpointerdown = event => {
    if (!state.editMode) return;
    event.preventDefault(); event.stopPropagation(); img.setPointerCapture(event.pointerId);
    const start = { x: event.clientX, y: event.clientY, ox: page.data[fieldId].x ?? 50, oy: page.data[fieldId].y ?? 50 };
    img.onpointermove = move => {
      const bounds = img.getBoundingClientRect();
      page.data[fieldId].x = Math.max(0, Math.min(100, start.ox + (move.clientX - start.x) / bounds.width * 100));
      page.data[fieldId].y = Math.max(0, Math.min(100, start.oy + (move.clientY - start.y) / bounds.height * 100));
      img.style.objectPosition = `${page.data[fieldId].x}% ${page.data[fieldId].y}%`;
    };
    img.onpointerup = () => { img.onpointermove = null; saveState(); };
  };
}

function renderCustom(page, item, isPrint = false) {
  const wrap = document.createElement("div");
  wrap.className = "field custom-element";
  Object.assign(wrap.style, { left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%`, fontSize: `${item.size || 16}px` });
  if (item.type === "image") {
    const img = document.createElement("img"); img.src = item.src; img.style.cssText = "width:100%;height:100%;object-fit:contain;pointer-events:none";
    wrap.appendChild(img);
  } else {
    const editor = document.createElement("div"); editor.className = "textarea-field"; editor.contentEditable = !isPrint && state.editMode ? "true" : "false"; editor.textContent = item.text || "";
    editor.oninput = () => { item.text = editor.textContent; saveState(); };
    wrap.appendChild(editor);
  }
  if (!isPrint) {
    enableCustomDrag(wrap, item);
    const controls = document.createElement("div"); controls.className = "custom-actions";
    const smaller = document.createElement("button"); smaller.textContent = "−"; smaller.title = "Make smaller";
    smaller.onclick = () => { item.w = Math.max(8, item.w - 3); item.h = Math.max(5, item.h - 3); saveState(); renderCurrentPage(); };
    const larger = document.createElement("button"); larger.textContent = "＋"; larger.title = "Make larger";
    larger.onclick = () => { item.w = Math.min(90, item.w + 3); item.h = Math.min(90, item.h + 3); saveState(); renderCurrentPage(); };
    const remove = document.createElement("button"); remove.textContent = "×"; remove.title = "Delete";
    remove.onclick = () => { page.custom = page.custom.filter(x => x.id !== item.id); saveState(); renderCurrentPage(); };
    controls.append(smaller, larger, remove); wrap.appendChild(controls);
  }
  return wrap;
}

function enableCustomDrag(node, item) {
  node.onpointerdown = event => {
    if (!state.editMode || event.target.isContentEditable || event.target.tagName === "BUTTON") return;
    event.preventDefault(); node.setPointerCapture(event.pointerId);
    const shell = $("#pageShell").getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY, ox: item.x, oy: item.y };
    node.onpointermove = move => {
      item.x = Math.max(0, Math.min(100 - item.w, start.ox + (move.clientX - start.x) / shell.width * 100));
      item.y = Math.max(0, Math.min(100 - item.h, start.oy + (move.clientY - start.y) / shell.height * 100));
      node.style.left = `${item.x}%`; node.style.top = `${item.y}%`;
    };
    node.onpointerup = () => { node.onpointermove = null; saveState(); };
  };
}

function updateField(page, id, value) {
  page.data ||= {};
  page.data[id] = value;
  saveState();
}

function chooseImage(target) {
  if (!state.editMode) return;
  activeImageTarget = target;
  $("#imageInput").click();
}

function addCustomImage(src) {
  currentPage().custom ||= [];
  currentPage().custom.push({ id: crypto.randomUUID(), type: "image", src, x: 30, y: 30, w: 35, h: 35 });
  saveState(); renderCurrentPage();
}

function navigate(index) {
  const target = Math.max(0, Math.min(state.pages.length - 1, index));
  if (target === state.current) return;
  state.current = target;
  saveState();
  renderAll();
}

function escapeHtml(text) {
  return String(text || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function toast(message) {
  const node = $("#toast"); node.textContent = message; node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 2200);
}

function downloadBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `archive-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  URL.revokeObjectURL(link.href);
}

function validArchive(candidate) {
  return candidate && Array.isArray(candidate.pages) && candidate.pages.length > 0;
}

function cloudConfig() {
  const config = window.ARCHIVE_SUPABASE || {};
  if (!config.url || !config.publishableKey || config.publishableKey.startsWith("PASTE_")) {
    throw new Error("Add the Supabase publishable key to web-app/supabase-config.js first.");
  }
  return config;
}

async function cloudRequest(path, options = {}, useSession = false) {
  const config = cloudConfig();
  const headers = { apikey: config.publishableKey, "Content-Type": "application/json", ...(options.headers || {}) };
  if (useSession) {
    if (!cloudSession?.access_token) throw new Error("Sign in to your cloud account first.");
    headers.Authorization = `Bearer ${cloudSession.access_token}`;
  }
  const response = await fetch(`${config.url}${path}`, { ...options, headers });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.msg || body?.message || body?.error_description || `Cloud request failed (${response.status}).`);
  return body;
}

function storeCloudSession(session) {
  cloudSession = session;
  if (session) localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(CLOUD_SESSION_KEY);
  renderCloudAccount();
}

function renderCloudAccount() {
  const signedIn = Boolean(cloudSession?.user?.email);
  $("#cloudAccountStatus").textContent = signedIn ? `Signed in as ${cloudSession.user.email}` : "Sign in with your Supabase email account.";
  $("#cloudSignOut").classList.toggle("hidden", !signedIn);
  $("#cloudEmail").disabled = signedIn;
  $("#cloudPassword").disabled = signedIn;
  $("#cloudSignUp").classList.toggle("hidden", signedIn);
  $("#cloudSignIn").classList.toggle("hidden", signedIn);
}

async function cloudSignIn() {
  const email = $("#cloudEmail").value.trim();
  const password = $("#cloudPassword").value;
  const session = await cloudRequest("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
  storeCloudSession(session);
  $("#cloudDialog").close();
  toast("Cloud account signed in");
}

async function cloudSignUp() {
  const email = $("#cloudEmail").value.trim();
  const password = $("#cloudPassword").value;
  const result = await cloudRequest("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email, password }) });
  if (result.access_token) storeCloudSession(result);
  toast(result.access_token ? "Cloud account created" : "Check your email to confirm the account");
}

async function uploadCloudBackup() {
  if (!cloudSession?.user?.id) throw new Error("Sign in to your cloud account first.");
  await cloudRequest("/rest/v1/journal_snapshots?on_conflict=user_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: cloudSession.user.id,
      archive_data: state,
      archive_version: DATA_VERSION,
      updated_at: new Date().toISOString()
    })
  }, true);
  toast("Cloud backup completed");
}

async function restoreCloudBackup() {
  if (!cloudSession?.user?.id) throw new Error("Sign in to your cloud account first.");
  const rows = await cloudRequest(`/rest/v1/journal_snapshots?select=archive_data,updated_at&user_id=eq.${cloudSession.user.id}`, {}, true);
  const snapshot = rows?.[0];
  if (!validArchive(snapshot?.archive_data)) throw new Error("No valid cloud backup was found.");
  if (!confirm(`Replace this browser's journal with the cloud backup from ${new Date(snapshot.updated_at).toLocaleString()}? Download a local backup first if needed.`)) return;
  state = snapshot.archive_data;
  migrateState();
  saveState(true);
  renderAll();
  toast("Cloud backup restored");
}

async function runCloudAction(action) {
  try {
    await action();
  } catch (error) {
    toast(error.message);
    console.error(error);
  }
}

function buildPrintBook(pages) {
  document.querySelector(".print-book")?.remove();
  const book = document.createElement("div"); book.className = "print-book";
  pages.forEach(page => {
    const shell = document.createElement("div"); shell.className = "page-shell print-me";
    const art = document.createElement("img"); art.className = "page-artwork"; art.src = artworkFor(page);
    const layer = document.createElement("div"); layer.className = "editable-layer";
    templateFor(page).fields.forEach(field => layer.appendChild(renderField(page, field, true)));
    (page.custom || []).forEach(item => layer.appendChild(renderCustom(page, item, true)));
    shell.append(art, layer); book.appendChild(shell);
  });
  document.body.appendChild(book);
  setTimeout(() => window.print(), 350);
  setTimeout(() => book.remove(), 1500);
}

function wireEvents() {
  $("#previousPage").onclick = () => navigate(state.current - 1);
  $("#nextPage").onclick = () => navigate(state.current + 1);
  $("#jumpButton").onclick = () => navigate(Number($("#pageJump").value) - 1);
  $("#pageJump").onkeydown = event => { if (event.key === "Enter") $("#jumpButton").click(); };
  $("#editToggle").onclick = () => { state.editMode = !state.editMode; saveState(); renderAll(); };
  $("#zoomRange").oninput = event => { state.zoom = Number(event.target.value); renderAll(); saveState(); };
  $("#zoomOut").onclick = () => { state.zoom = Math.max(35, state.zoom - 5); renderAll(); saveState(); };
  $("#zoomIn").onclick = () => { state.zoom = Math.min(110, state.zoom + 5); renderAll(); saveState(); };
  $("#moreToggle").onclick = () => $("#moreMenu").classList.toggle("hidden");
  document.addEventListener("click", event => { if (!event.target.closest("#moreMenu,#moreToggle")) $("#moreMenu").classList.add("hidden"); });
  $("#addText").onclick = () => {
    currentPage().custom ||= [];
    currentPage().custom.push({ id: crypto.randomUUID(), type: "text", text: "New note", x: 35, y: 35, w: 30, h: 8, size: 16 });
    saveState(); renderCurrentPage();
  };
  $("#imageInput").onchange = event => {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (activeImageTarget) {
        activeImageTarget.page.data[activeImageTarget.fieldId] = { src: reader.result, x: 50, y: 50, zoom: 1 };
      } else addCustomImage(reader.result);
      activeImageTarget = null; saveState(); renderCurrentPage();
    };
    reader.readAsDataURL(file); event.target.value = "";
  };
  $("#duplicatePage").onclick = () => {
    const copy = structuredClone(currentPage()); copy.id = `${copy.id}.copy.${Date.now()}`; copy.title = `${copy.title} Copy`;
    state.pages.splice(state.current + 1, 0, copy); navigate(state.current + 1); toast("Page duplicated");
  };
  $("#templateSelect").innerHTML = Object.entries(templateCatalog).filter(([, t]) => t.fields.length).map(([id, t]) => `<option value="${id}">${t.label}</option>`).join("");
  $("#addPage").onclick = () => $("#newPageDialog").showModal();
  $("#confirmNewPage").onclick = () => {
    const template = $("#templateSelect").value; const id = `custom.${Date.now()}`;
    state.pages.splice(state.current + 1, 0, page(id, currentPage().section, template, templateCatalog[template].label));
    navigate(state.current + 1); toast("New page created");
  };
  $("#deletePage").onclick = () => {
    if (state.pages.length <= 1 || !confirm(`Delete "${pageName(currentPage())}"?`)) return;
    state.pages.splice(state.current, 1); navigate(Math.min(state.current, state.pages.length - 1)); toast("Page deleted");
  };
  $("#moveUp").onclick = () => movePage(-1); $("#moveDown").onclick = () => movePage(1);
  $("#backupData").onclick = downloadBackup;
  $("#restoreInput").onchange = event => {
    const reader = new FileReader(); reader.onload = () => {
      try {
        const restored = JSON.parse(reader.result);
        if (!validArchive(restored)) throw new Error("This is not a valid Archive backup.");
        state = restored; migrateState(); saveState(true); renderAll(); toast("Backup restored");
      } catch (error) { toast(error.message); }
    }; reader.readAsText(event.target.files[0]);
  };
  $("#cloudAccount").onclick = () => { renderCloudAccount(); $("#cloudDialog").showModal(); };
  $("#cloudSignIn").onclick = event => { event.preventDefault(); runCloudAction(cloudSignIn); };
  $("#cloudSignUp").onclick = event => { event.preventDefault(); runCloudAction(cloudSignUp); };
  $("#cloudSignOut").onclick = event => { event.preventDefault(); storeCloudSession(null); toast("Cloud account signed out"); };
  $("#cloudBackup").onclick = () => runCloudAction(uploadCloudBackup);
  $("#cloudRestore").onclick = () => runCloudAction(restoreCloudBackup);
  $("#resetData").onclick = () => { if (confirm("Reset every edit and restore the original 157 pages?")) { state = { pages: buildOriginalPages(), current: 0, editMode: true, zoom: 72, dataVersion: DATA_VERSION }; saveState(true); renderAll(); } };
  $("#printPage").onclick = () => buildPrintBook([currentPage()]);
  $("#printSection").onclick = () => buildPrintBook(state.pages.filter(page => page.section === currentPage().section));
  $("#printAll").onclick = () => buildPrintBook(state.pages);
  document.addEventListener("keydown", event => {
    if (event.target.isContentEditable || ["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
    if (event.key === "ArrowLeft") navigate(state.current - 1);
    if (event.key === "ArrowRight") navigate(state.current + 1);
  });
}

function movePage(direction) {
  const target = state.current + direction; if (target < 0 || target >= state.pages.length) return;
  [state.pages[state.current], state.pages[target]] = [state.pages[target], state.pages[state.current]];
  state.current = target; saveState(); renderAll(); toast("Page moved");
}

async function start() {
  await loadState();
  wireEvents();
  renderAll();
}

start();
