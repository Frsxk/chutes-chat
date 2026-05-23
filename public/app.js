const STORAGE_KEY = "chutes-chat:v1";
const MODEL_CACHE_KEY = "chutes-chat:models:v1";

const fallbackModels = [
  "zai-org/GLM-5.1-TEE",
  "zai-org/GLM-5-TEE",
  "moonshotai/Kimi-K2.6-TEE",
  "Qwen/Qwen3.5-397B-A17B-TEE",
  "deepseek-ai/DeepSeek-R1-0528-TEE",
  "deepseek-ai/DeepSeek-V3.2-TEE",
  "Qwen/Qwen3-235B-A22B-Thinking-2507",
  "Qwen/Qwen3-235B-A22B-Instruct-2507-TEE",
  "moonshotai/Kimi-K2.5-TEE",
  "MiniMaxAI/MiniMax-M2.5-TEE",
  "openai/gpt-oss-120b-TEE",
  "Qwen/Qwen2.5-72B-Instruct",
  "Qwen/Qwen3-32B-TEE",
  "unsloth/Llama-3.2-1B-Instruct"
].map((id, index) => ({
  id,
  context_length: null,
  input_modalities: ["text"],
  output_modalities: ["text"],
  supported_features: [],
  pricing: null,
  score: 10000 - index
}));

const defaults = {
  threads: [],
  activeThreadId: null,
  settings: {
    model: "zai-org/GLM-5.1-TEE",
    apiKey: "",
    systemPrompt: "You are a helpful assistant.",
    temperature: 0.7,
    maxTokens: 2048,
    compactMode: false,
    showScores: false
  }
};

const els = {
  threadList: document.querySelector("#thread-list"),
  newChatBtn: document.querySelector("#new-chat-btn"),
  exportBtn: document.querySelector("#export-btn"),
  importFile: document.querySelector("#import-file"),
  clearBtn: document.querySelector("#clear-btn"),
  sidebar: document.querySelector("#sidebar"),
  sidebarToggle: document.querySelector("#sidebar-toggle"),
  modelSelect: document.querySelector("#model-select"),
  modelMeta: document.querySelector("#model-meta"),
  statusCard: document.querySelector("#status-card"),
  statusTitle: document.querySelector("#status-title"),
  statusBody: document.querySelector("#status-body"),
  statusClose: document.querySelector("#status-close"),
  chatArea: document.querySelector("#chat-area"),
  emptyState: document.querySelector("#empty-state"),
  messageList: document.querySelector("#message-list"),
  composer: document.querySelector("#composer"),
  promptInput: document.querySelector("#prompt-input"),
  sendBtn: document.querySelector("#send-btn"),
  settingsBtn: document.querySelector("#settings-btn"),
  settingsModal: document.querySelector("#settings-modal"),
  apiKeyInput: document.querySelector("#api-key-input"),
  systemPromptInput: document.querySelector("#system-prompt-input"),
  temperatureInput: document.querySelector("#temperature-input"),
  maxTokensInput: document.querySelector("#max-tokens-input"),
  compactModeInput: document.querySelector("#compact-mode-input"),
  showScoresInput: document.querySelector("#show-scores-input"),
  forgetKeyBtn: document.querySelector("#forget-key-btn"),
  saveSettingsBtn: document.querySelector("#save-settings-btn")
};

let state = loadState();
let models = loadCachedModels();
let isSending = false;

boot();

function boot() {
  renderAll();
  bindEvents();
  populateModels(models, "cached");
  refreshModels();
}

function bindEvents() {
  els.newChatBtn.addEventListener("click", () => {
    createThread(true);
    closeSidebarOnMobile();
  });

  els.sidebarToggle.addEventListener("click", () => els.sidebar.classList.toggle("open"));
  els.statusClose.addEventListener("click", () => (els.statusCard.hidden = true));

  els.modelSelect.addEventListener("change", () => {
    state.settings.model = els.modelSelect.value;
    saveState();
    renderModelMeta();
  });

  els.composer.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitPrompt(els.promptInput.value.trim());
  });

  els.promptInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await submitPrompt(els.promptInput.value.trim());
    }
  });

  els.promptInput.addEventListener("input", () => autoGrow(els.promptInput));

  document.querySelectorAll(".prompt-card").forEach((button) => {
    button.addEventListener("click", () => {
      els.promptInput.value = button.dataset.prompt || "";
      autoGrow(els.promptInput);
      els.promptInput.focus();
    });
  });

  els.settingsBtn.addEventListener("click", () => openSettings());

  els.settingsModal.addEventListener("submit", () => {
    saveSettingsFromForm();
  });

  els.forgetKeyBtn.addEventListener("click", () => {
    state.settings.apiKey = "";
    els.apiKeyInput.value = "";
    saveState();
    showStatus("Key removed", "The local browser fallback key has been removed. Netlify environment keys are not affected.");
  });

  els.exportBtn.addEventListener("click", exportChats);
  els.importFile.addEventListener("change", importChats);
  els.clearBtn.addEventListener("click", clearChats);
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return mergeState(defaults, parsed || {});
  } catch {
    return structuredClone(defaults);
  }
}

function mergeState(base, incoming) {
  return {
    ...structuredClone(base),
    ...incoming,
    settings: {
      ...base.settings,
      ...(incoming.settings || {})
    },
    threads: Array.isArray(incoming.threads) ? incoming.threads : []
  };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    showStatus("Storage warning", `The browser could not save the latest state: ${error.message}`);
  }
}

function loadCachedModels() {
  try {
    const cached = JSON.parse(localStorage.getItem(MODEL_CACHE_KEY) || "null");
    if (Array.isArray(cached?.models) && cached.models.length) return cached.models;
  } catch {
    // ignore cache errors
  }
  return fallbackModels;
}

function saveCachedModels(nextModels) {
  try {
    localStorage.setItem(MODEL_CACHE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), models: nextModels }));
  } catch {
    // model cache is optional
  }
}

async function refreshModels() {
  try {
    const headers = {};
    if (state.settings.apiKey) headers["X-User-Chutes-Key"] = state.settings.apiKey;

    const response = await fetch("/api/models", { headers });
    if (!response.ok) throw new Error(`Model request failed with ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data.models) || !data.models.length) throw new Error("No models returned.");

    models = data.models;
    saveCachedModels(models);
    populateModels(models, data.source);

    if (data.source === "fallback-documented") {
      showStatus("Using fallback model list", "The live Chutes model request did not complete, so the selector is using the documented fallback list bundled with the app.");
    }
  } catch (error) {
    models = loadCachedModels();
    populateModels(models, "cached");
    showStatus("Could not refresh models", `${error.message}. The selector is using the last cached or bundled Chutes model list.`);
  }
}

function populateModels(nextModels, source) {
  const current = state.settings.model;
  els.modelSelect.innerHTML = "";

  nextModels.forEach((model, index) => {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = optionLabel(model, index);
    els.modelSelect.append(option);
  });

  const exists = nextModels.some((model) => model.id === current);
  state.settings.model = exists ? current : nextModels[0]?.id || defaults.settings.model;
  els.modelSelect.value = state.settings.model;
  saveState();
  renderModelMeta(source);
}

function optionLabel(model, index) {
  const rank = String(index + 1).padStart(2, "0");
  const name = shortModelName(model.id);
  const ctx = model.context_length ? ` · ${formatContext(model.context_length)}` : "";
  const features = (model.supported_features || []).slice(0, 2).join("/");
  const score = state.settings.showScores && model.score ? ` · score ${model.score}` : "";
  return `${rank}. ${name}${ctx}${features ? ` · ${features}` : ""}${score}`;
}

function renderModelMeta(source = "") {
  const model = getSelectedModel();
  if (!model) {
    els.modelMeta.textContent = "No Chutes models loaded yet.";
    return;
  }

  const bits = [];
  if (model.context_length) bits.push(`${formatContext(model.context_length)} context`);
  if (model.input_modalities?.length) bits.push(`input: ${model.input_modalities.join(", ")}`);
  if (model.supported_features?.length) bits.push(model.supported_features.join(", "));
  if (model.pricing?.prompt || model.pricing?.completion) {
    bits.push(`$${model.pricing.prompt ?? "?"}/$${model.pricing.completion ?? "?"} per 1M in/out`);
  }
  if (model.confidential_compute) bits.push("TEE");
  if (source === "chutes-live") bits.push("live Chutes list");
  if (source === "fallback-documented") bits.push("fallback list");
  if (source === "cached") bits.push("cached list");

  els.modelMeta.textContent = `${model.id} — ${bits.join(" · ")}`;
}

function getSelectedModel() {
  return models.find((model) => model.id === state.settings.model) || models[0] || null;
}

function renderAll() {
  renderThreads();
  renderMessages();
  applyMode();
}

function renderThreads() {
  els.threadList.innerHTML = "";

  const sortedThreads = [...state.threads].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  if (!sortedThreads.length) {
    const empty = document.createElement("p");
    empty.className = "thread-date";
    empty.textContent = "No saved chats yet.";
    els.threadList.append(empty);
    return;
  }

  sortedThreads.forEach((thread) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `thread-btn${thread.id === state.activeThreadId ? " active" : ""}`;
    button.addEventListener("click", () => {
      state.activeThreadId = thread.id;
      saveState();
      renderAll();
      closeSidebarOnMobile();
    });

    const title = document.createElement("div");
    title.className = "thread-title";
    title.textContent = thread.title || "Untitled chat";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "thread-delete";
    remove.textContent = "×";
    remove.title = "Delete chat";
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteThread(thread.id);
    });

    const date = document.createElement("div");
    date.className = "thread-date";
    date.textContent = formatDate(thread.updatedAt || thread.createdAt);

    button.append(title, remove, date);
    els.threadList.append(button);
  });
}

function renderMessages() {
  const thread = getActiveThread();
  const messages = thread?.messages || [];
  els.messageList.innerHTML = "";
  els.emptyState.hidden = messages.length > 0;

  messages.forEach((message) => {
    const wrapper = document.createElement("article");
    wrapper.className = `message ${message.role}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = message.role === "user" ? "You" : "AI";

    const bubble = document.createElement("div");
    bubble.className = `bubble${message.error ? " error" : ""}`;

    if (message.pending) {
      bubble.innerHTML = '<span class="thinking"><span></span><span></span><span></span> Thinking</span>';
    } else {
      bubble.innerHTML = renderMarkdownLite(message.content || "");
    }

    wrapper.append(avatar, bubble);
    els.messageList.append(wrapper);
  });

  requestAnimationFrame(() => {
    els.chatArea.scrollTop = els.chatArea.scrollHeight;
  });
}

function createThread(activate = false) {
  const now = new Date().toISOString();
  const thread = {
    id: crypto.randomUUID(),
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: []
  };
  state.threads.unshift(thread);
  if (activate) state.activeThreadId = thread.id;
  saveState();
  renderAll();
  return thread;
}

function getActiveThread() {
  return state.threads.find((thread) => thread.id === state.activeThreadId) || null;
}

function ensureActiveThread() {
  return getActiveThread() || createThread(true);
}

function deleteThread(id) {
  state.threads = state.threads.filter((thread) => thread.id !== id);
  if (state.activeThreadId === id) {
    state.activeThreadId = state.threads[0]?.id || null;
  }
  saveState();
  renderAll();
}

async function submitPrompt(prompt) {
  if (!prompt || isSending) return;

  const thread = ensureActiveThread();
  const now = new Date().toISOString();
  const userMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: prompt,
    createdAt: now,
    model: state.settings.model
  };
  const assistantMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "",
    createdAt: now,
    model: state.settings.model,
    pending: true
  };

  thread.messages.push(userMessage, assistantMessage);
  thread.updatedAt = now;
  if (!thread.title || thread.title === "New chat") thread.title = makeTitle(prompt);

  els.promptInput.value = "";
  autoGrow(els.promptInput);
  isSending = true;
  els.sendBtn.disabled = true;
  saveState();
  renderAll();

  try {
    const messages = buildRequestMessages(thread, assistantMessage.id);
    const headers = { "Content-Type": "application/json" };
    if (state.settings.apiKey) headers["X-User-Chutes-Key"] = state.settings.apiKey;

    const response = await fetch("/api/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: state.settings.model,
        messages,
        temperature: state.settings.temperature,
        max_tokens: state.settings.maxTokens
      })
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || data.detail || `Request failed with ${response.status}`);
    }

    if (contentType.includes("text/event-stream")) {
      assistantMessage.pending = false;
      assistantMessage.content = "";
      renderAll();
      await readChutesStream(response, assistantMessage);
      assistantMessage.finish_reason = assistantMessage.finish_reason || "stop";
    } else {
      const data = await response.json().catch(() => ({}));
      assistantMessage.pending = false;
      assistantMessage.content = data.message?.content || "";
      assistantMessage.usage = data.usage || null;
      assistantMessage.finish_reason = data.finish_reason || null;
    }
  } catch (error) {
    assistantMessage.pending = false;
    assistantMessage.error = true;
    assistantMessage.content = `Error: ${error.message}`;

    if (/api key|missing|401/i.test(error.message)) {
      showStatus("Chutes key needed", "Set CHUTES_API_KEY in Netlify or add a local fallback key in Settings, then try again.");
    }
  } finally {
    thread.updatedAt = new Date().toISOString();
    isSending = false;
    els.sendBtn.disabled = false;
    saveState();
    renderAll();
  }
}

async function readChutesStream(response, assistantMessage) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Streaming response was empty.");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const lines = event.split("\n").map((line) => line.trim()).filter(Boolean);
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        let chunk;
        try {
          chunk = JSON.parse(data);
        } catch {
          continue;
        }

        const choice = chunk.choices?.[0];
        const delta = choice?.delta?.content || choice?.message?.content || "";
        if (delta) {
          assistantMessage.content += delta;
          renderAll();
        }
        if (choice?.finish_reason) assistantMessage.finish_reason = choice.finish_reason;
        if (chunk.usage) assistantMessage.usage = chunk.usage;
      }
    }
  }

  if (buffer.trim()) {
    for (const line of buffer.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const chunk = JSON.parse(data);
        const choice = chunk.choices?.[0];
        const delta = choice?.delta?.content || choice?.message?.content || "";
        if (delta) assistantMessage.content += delta;
        if (choice?.finish_reason) assistantMessage.finish_reason = choice.finish_reason;
        if (chunk.usage) assistantMessage.usage = chunk.usage;
      } catch {
        // Ignore incomplete trailing SSE fragments.
      }
    }
  }
}

function buildRequestMessages(thread, pendingAssistantId) {
  const messages = [];
  const systemPrompt = state.settings.systemPrompt.trim();
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });

  thread.messages
    .filter((message) => message.id !== pendingAssistantId && !message.pending && !message.error)
    .forEach((message) => messages.push({ role: message.role, content: message.content }));

  return messages;
}

function openSettings() {
  els.apiKeyInput.value = state.settings.apiKey || "";
  els.systemPromptInput.value = state.settings.systemPrompt || "";
  els.temperatureInput.value = state.settings.temperature;
  els.maxTokensInput.value = state.settings.maxTokens;
  els.compactModeInput.checked = Boolean(state.settings.compactMode);
  els.showScoresInput.checked = Boolean(state.settings.showScores);
  els.settingsModal.showModal();
}

function saveSettingsFromForm() {
  state.settings.apiKey = els.apiKeyInput.value.trim();
  state.settings.systemPrompt = els.systemPromptInput.value.trim();
  state.settings.temperature = clamp(Number(els.temperatureInput.value), 0, 2, defaults.settings.temperature);
  state.settings.maxTokens = Math.round(clamp(Number(els.maxTokensInput.value), 1, 65536, defaults.settings.maxTokens));
  state.settings.compactMode = els.compactModeInput.checked;
  state.settings.showScores = els.showScoresInput.checked;
  saveState();
  applyMode();
  populateModels(models, "cached");
  refreshModels();
}

function applyMode() {
  els.messageList.classList.toggle("compact", Boolean(state.settings.compactMode));
}

function exportChats() {
  const data = {
    exportedAt: new Date().toISOString(),
    app: "chutes-chat",
    version: 1,
    state: {
      ...state,
      settings: {
        ...state.settings,
        apiKey: ""
      }
    }
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `chutes-chat-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importChats(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    const importedState = imported.state || imported;
    if (!Array.isArray(importedState.threads)) throw new Error("No threads found in import file.");

    const keepKey = state.settings.apiKey;
    state = mergeState(defaults, importedState);
    state.settings.apiKey = keepKey;
    state.activeThreadId = state.activeThreadId || state.threads[0]?.id || null;
    saveState();
    renderAll();
    showStatus("Import complete", `${state.threads.length} chats are available in this browser.`);
  } catch (error) {
    showStatus("Import failed", error.message);
  } finally {
    event.target.value = "";
  }
}

function clearChats() {
  const ok = confirm("Delete all locally saved chats from this browser?");
  if (!ok) return;
  state.threads = [];
  state.activeThreadId = null;
  saveState();
  renderAll();
}

function showStatus(title, body) {
  els.statusTitle.textContent = title;
  els.statusBody.textContent = body;
  els.statusCard.hidden = false;
}

function renderMarkdownLite(text) {
  const escaped = escapeHtml(text);
  const parts = escaped.split(/```/g);
  return parts
    .map((part, index) => {
      if (index % 2 === 1) {
        const trimmed = part.replace(/^\w+\n/, "");
        return `<pre><code>${trimmed}</code></pre>`;
      }
      return part
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shortModelName(id) {
  return id.split("/").pop().replace(/-TEE$/, " TEE").replace(/-/g, " ");
}

function formatContext(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "unknown";
  if (number >= 1000) return `${Math.round(number / 1000)}K`;
  return String(number);
}

function makeTitle(prompt) {
  const compact = prompt.replace(/\s+/g, " ").trim();
  return compact.length > 46 ? `${compact.slice(0, 46)}...` : compact || "New chat";
}

function formatDate(value) {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function autoGrow(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 210)}px`;
}

function closeSidebarOnMobile() {
  if (window.matchMedia("(max-width: 900px)").matches) els.sidebar.classList.remove("open");
}
