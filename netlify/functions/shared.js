const CHUTES_BASE_URL = "https://llm.chutes.ai/v1";

const FALLBACK_MODELS = [
  { id: "zai-org/GLM-5.1-TEE", context_length: 203000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning", "tools", "structured_outputs", "json_mode"], pricing: { prompt: 1.0, completion: 4.0 }, confidential_compute: true },
  { id: "zai-org/GLM-5-TEE", context_length: 203000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning", "tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.95, completion: 3.0 }, confidential_compute: true },
  { id: "moonshotai/Kimi-K2.6-TEE", context_length: 262000, input_modalities: ["text", "image", "video"], output_modalities: ["text"], supported_features: ["reasoning", "tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.95, completion: 4.0 }, confidential_compute: true },
  { id: "Qwen/Qwen3.5-397B-A17B-TEE", context_length: 262000, input_modalities: ["text", "image"], output_modalities: ["text"], supported_features: ["reasoning", "tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.39, completion: 2.0 }, confidential_compute: true },
  { id: "deepseek-ai/DeepSeek-R1-0528-TEE", context_length: 164000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning"], pricing: { prompt: 0.45, completion: 2.0 }, confidential_compute: true },
  { id: "deepseek-ai/DeepSeek-V3.2-TEE", context_length: 131000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning", "tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.28, completion: 0.42 }, confidential_compute: true },
  { id: "zai-org/GLM-5-Turbo", context_length: 203000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning", "tools"], pricing: { prompt: 0.49, completion: 2.0 }, confidential_compute: false },
  { id: "Qwen/Qwen3-235B-A22B-Thinking-2507", context_length: 262000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning", "tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.11, completion: 0.6 }, confidential_compute: false },
  { id: "Qwen/Qwen3-235B-A22B-Instruct-2507-TEE", context_length: 262000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning", "tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.10, completion: 0.60 }, confidential_compute: true },
  { id: "moonshotai/Kimi-K2.5-TEE", context_length: 262000, input_modalities: ["text", "image", "video"], output_modalities: ["text"], supported_features: ["reasoning", "tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.44, completion: 2.0 }, confidential_compute: true },
  { id: "zai-org/GLM-4.7-TEE", context_length: 203000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning", "tools"], pricing: { prompt: 0.39, completion: 2.0 }, confidential_compute: true },
  { id: "zai-org/GLM-4.7-FP8", context_length: 203000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning", "tools"], pricing: { prompt: 0.30, completion: 1.0 }, confidential_compute: false },
  { id: "deepseek-ai/DeepSeek-V3.1-TEE", context_length: 164000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning", "tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.27, completion: 1.0 }, confidential_compute: true },
  { id: "deepseek-ai/DeepSeek-V3-0324-TEE", context_length: 164000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.25, completion: 1.0 }, confidential_compute: true },
  { id: "tngtech/DeepSeek-TNG-R1T2-Chimera-TEE", context_length: 164000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning"], pricing: { prompt: 0.30, completion: 1.0 }, confidential_compute: true },
  { id: "Qwen/Qwen3-Coder-Next-TEE", context_length: 262000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.12, completion: 0.75 }, confidential_compute: true },
  { id: "MiniMaxAI/MiniMax-M2.5-TEE", context_length: 197000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning", "tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.15, completion: 1.0 }, confidential_compute: true },
  { id: "openai/gpt-oss-120b-TEE", context_length: 131000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning", "tools"], pricing: { prompt: 0.09, completion: 0.36 }, confidential_compute: true },
  { id: "Qwen/Qwen3-Next-80B-A3B-Instruct", context_length: 262000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.10, completion: 0.80 }, confidential_compute: false },
  { id: "Qwen/Qwen2.5-72B-Instruct", context_length: 33000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["tools"], pricing: { prompt: 0.30, completion: 1.0 }, confidential_compute: false },
  { id: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B", context_length: 131000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning"], pricing: { prompt: 0.03, completion: 0.11 }, confidential_compute: false },
  { id: "XiaomiMiMo/MiMo-V2-Flash-TEE", context_length: 262000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["tools"], pricing: { prompt: 0.09, completion: 0.29 }, confidential_compute: true },
  { id: "Qwen/Qwen3-32B-TEE", context_length: 41000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning", "tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.08, completion: 0.24 }, confidential_compute: true },
  { id: "Qwen/Qwen3-30B-A3B", context_length: 41000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning", "tools"], pricing: { prompt: 0.06, completion: 0.22 }, confidential_compute: false },
  { id: "Qwen/Qwen2.5-VL-32B-Instruct", context_length: 16000, input_modalities: ["text", "image"], output_modalities: ["text"], supported_features: ["vision"], pricing: { prompt: 0.05, completion: 0.22 }, confidential_compute: false },
  { id: "Qwen/Qwen2.5-Coder-32B-Instruct-TEE", context_length: 33000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.03, completion: 0.11 }, confidential_compute: true },
  { id: "google/gemma-4-31B-turbo-TEE", context_length: 131000, input_modalities: ["text", "image"], output_modalities: ["text"], supported_features: ["reasoning", "tools", "structured_outputs", "json_mode"], pricing: { prompt: 0.13, completion: 0.38 }, confidential_compute: true },
  { id: "unsloth/gemma-3-27b-it", context_length: 128000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["tools"], pricing: { prompt: 0.03, completion: 0.11 }, confidential_compute: false },
  { id: "NousResearch/DeepHermes-3-Mistral-24B-Preview", context_length: 33000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["reasoning"], pricing: { prompt: 0.02, completion: 0.10 }, confidential_compute: false },
  { id: "unsloth/Mistral-Nemo-Instruct-2407-TEE", context_length: 131000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["tools"], pricing: { prompt: 0.02, completion: 0.04 }, confidential_compute: true },
  { id: "NousResearch/Hermes-4-14B", context_length: 41000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["tools"], pricing: { prompt: 0.01, completion: 0.05 }, confidential_compute: false },
  { id: "unsloth/gemma-3-12b-it", context_length: 131000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["tools"], pricing: { prompt: 0.03, completion: 0.10 }, confidential_compute: false },
  { id: "unsloth/gemma-3-4b-it", context_length: 96000, input_modalities: ["text"], output_modalities: ["text"], supported_features: ["tools"], pricing: { prompt: 0.01, completion: 0.03 }, confidential_compute: false },
  { id: "unsloth/Llama-3.2-3B-Instruct", context_length: 16000, input_modalities: ["text"], output_modalities: ["text"], supported_features: [], pricing: { prompt: 0.01, completion: 0.01 }, confidential_compute: false },
  { id: "unsloth/Llama-3.2-1B-Instruct", context_length: 16000, input_modalities: ["text"], output_modalities: ["text"], supported_features: [], pricing: { prompt: 0.01, completion: 0.01 }, confidential_compute: false }
];

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}

function normalizeModelId(id = "") {
  return String(id).replace(/^chutes\//, "").trim();
}

function getApiKey(headers = {}) {
  const localKey =
    headers["x-user-chutes-key"] ||
    headers["X-User-Chutes-Key"] ||
    headers["x-chutes-api-key"] ||
    headers["X-Chutes-API-Key"] ||
    headers["x-api-key"] ||
    headers["X-API-Key"];

  return process.env.CHUTES_API_KEY || process.env.OPENAI_API_KEY || localKey || "";
}

function headersForChutes(apiKey) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers["X-API-Key"] = apiKey;
  }
  return headers;
}

function inferParamsFromId(id = "") {
  const s = id.toLowerCase();
  const explicit = [
    [/397b/, 397],
    [/235b/, 235],
    [/120b/, 120],
    [/80b/, 80],
    [/72b/, 72],
    [/70b/, 70],
    [/32b/, 32],
    [/31b/, 31],
    [/30b/, 30],
    [/27b/, 27],
    [/24b/, 24],
    [/14b/, 14],
    [/12b/, 12],
    [/4b/, 4],
    [/3b/, 3],
    [/1b/, 1]
  ];
  for (const [regex, value] of explicit) {
    if (regex.test(s)) return value;
  }
  if (s.includes("glm-5.1")) return 405;
  if (s.includes("glm-5")) return 350;
  if (s.includes("kimi-k2.6")) return 360;
  if (s.includes("kimi-k2.5")) return 320;
  if (s.includes("deepseek-v3.2")) return 300;
  if (s.includes("deepseek-r1")) return 250;
  if (s.includes("deepseek-v3")) return 240;
  if (s.includes("minimax-m2.5")) return 180;
  return 0;
}

function modelScore(model) {
  const id = normalizeModelId(model.id || "");
  const s = id.toLowerCase();
  const rankPatterns = [
    /glm-5\.1/,
    /glm-5(?!-turbo)/,
    /kimi-k2\.6/,
    /qwen3\.5-397b/,
    /deepseek-r1-0528/,
    /deepseek-v3\.2/,
    /glm-5-turbo/,
    /qwen3-235b.*thinking/,
    /qwen3-235b.*instruct/,
    /kimi-k2\.5/,
    /glm-4\.7-tee/,
    /glm-4\.7-fp8/,
    /deepseek-v3\.1/,
    /deepseek-v3-0324/,
    /tng-r1t2|chimera/,
    /qwen3-coder/,
    /minimax-m2\.5/,
    /gpt-oss-120b/,
    /qwen3-next-80b/,
    /qwen2\.5-72b/,
    /deepseek-r1-distill-llama-70b/,
    /mimo-v2/,
    /qwen3-32b/,
    /qwen3-30b/,
    /qwen2\.5-vl-32b/,
    /qwen2\.5-coder-32b/,
    /gemma-4-31b/,
    /gemma-3-27b/,
    /deephermes-3/,
    /mistral-nemo/,
    /hermes-4-14b/,
    /gemma-3-12b/,
    /gemma-3-4b/,
    /llama-3\.2-3b/,
    /llama-3\.2-1b/
  ];

  const rankIndex = rankPatterns.findIndex((pattern) => pattern.test(s));
  let score = rankIndex === -1 ? 30000 : 100000 - rankIndex * 2000;
  const ctx = Number(model.context_length || model.max_model_len || 0);

  score += inferParamsFromId(id) * 4;
  if ((model.supported_features || []).includes("reasoning")) score += 125;
  if ((model.supported_features || []).includes("tools")) score += 65;
  if ((model.supported_features || []).includes("structured_outputs")) score += 35;
  if ((model.input_modalities || []).includes("image")) score += 35;
  if ((model.input_modalities || []).includes("video")) score += 25;
  if (model.confidential_compute) score += 10;
  score += Math.min(ctx / 10000, 40);

  if (s.includes("guard")) score -= 100000;
  if (s.includes("ocr")) score -= 100000;

  return Math.round(score);
}

function isChatLLM(model) {
  const id = normalizeModelId(model.id || "").toLowerCase();
  const outputs = model.output_modalities || ["text"];
  const inputs = model.input_modalities || ["text"];
  if (id.includes("guard") || id.includes("ocr") || id.includes("embed")) return false;
  return inputs.includes("text") && outputs.includes("text");
}

function toClientModel(model) {
  const id = normalizeModelId(model.id);
  const contextLength = model.context_length || model.max_model_len || model.max_context_length || null;
  return {
    id,
    root: model.root || id,
    owned_by: model.owned_by || "chutes",
    context_length: contextLength,
    max_output_length: model.max_output_length || null,
    input_modalities: model.input_modalities || ["text"],
    output_modalities: model.output_modalities || ["text"],
    supported_features: model.supported_features || [],
    pricing: model.pricing || model.price || null,
    confidential_compute: Boolean(model.confidential_compute),
    score: modelScore(model)
  };
}

function sortAndNormalizeModels(models) {
  const seen = new Set();
  return (models || [])
    .map(toClientModel)
    .filter((model) => {
      const key = model.id.toLowerCase();
      if (!model.id || seen.has(key)) return false;
      seen.add(key);
      return isChatLLM(model);
    })
    .sort((a, b) => b.score - a.score || (b.context_length || 0) - (a.context_length || 0) || a.id.localeCompare(b.id));
}

module.exports = {
  CHUTES_BASE_URL,
  FALLBACK_MODELS,
  json,
  normalizeModelId,
  getApiKey,
  headersForChutes,
  sortAndNormalizeModels
};
