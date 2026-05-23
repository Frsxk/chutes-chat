const { randomUUID } = require("node:crypto");

const {
  CHUTES_BASE_URL,
  json,
  normalizeModelId,
  getApiKey,
  headersForChutes
} = require("./shared");

const ALLOWED_ROLES = new Set(["system", "user", "assistant", "tool"]);

function cleanMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message) => message && ALLOWED_ROLES.has(message.role) && typeof message.content === "string")
    .map((message) => ({ role: message.role, content: message.content.slice(0, 200000) }));
}

function cleanNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON request body." });
  }

  const apiKey = getApiKey(event.headers || {});
  if (!apiKey) {
    return json(401, {
      error: "Missing Chutes API key. Set CHUTES_API_KEY in Netlify environment variables, or enter a personal key in the app settings."
    });
  }

  const model = normalizeModelId(payload.model);
  const messages = cleanMessages(payload.messages);

  if (!model) return json(400, { error: "Missing model." });
  if (!messages.length) return json(400, { error: "Missing messages." });

  const requestBody = {
    model,
    messages,
    temperature: cleanNumber(payload.temperature, 0.7, 0, 2),
    top_p: cleanNumber(payload.top_p, 1, 0.01, 1),
    max_tokens: Math.round(cleanNumber(payload.max_tokens, 2048, 1, 65536)),
    stream: false
  };

  try {
    const response = await fetch(`${CHUTES_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: headersForChutes(apiKey),
      body: JSON.stringify(requestBody)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      return json(response.status, {
        error: data.error?.message || data.detail || data.message || "Chutes API request failed.",
        status: response.status,
        upstream: data
      });
    }

    const assistantMessage = data.choices?.[0]?.message || data.choices?.[0]?.delta || null;
    const content = typeof assistantMessage?.content === "string" ? assistantMessage.content : "";

    return json(200, {
      id: data.id || randomUUID(),
      model: data.model || model,
      created: data.created || Math.floor(Date.now() / 1000),
      message: {
        role: "assistant",
        content
      },
      usage: data.usage || null,
      finish_reason: data.choices?.[0]?.finish_reason || null,
      upstream: payload.include_upstream ? data : undefined
    });
  } catch (error) {
    return json(502, {
      error: "Unable to reach Chutes API.",
      detail: error.message
    });
  }
};
