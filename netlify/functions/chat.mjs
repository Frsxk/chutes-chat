import shared from "./shared.js";

const {
  CHUTES_BASE_URL,
  normalizeModelId,
  getApiKey,
  headersForChutes
} = shared;

const ALLOWED_ROLES = new Set(["system", "user", "assistant", "tool"]);

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

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

function getHeaderObject(request) {
  const headers = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
    headers[key.toLowerCase()] = value;
  });
  return headers;
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON request body." });
  }

  const apiKey = getApiKey(getHeaderObject(request));
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
    max_tokens: Math.round(cleanNumber(payload.max_tokens, 1024, 1, 65536)),
    stream: true
  };

  const controller = new AbortController();
  const firstByteTimeout = setTimeout(() => controller.abort(), 28000);

  let upstream;
  try {
    upstream = await fetch(`${CHUTES_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: headersForChutes(apiKey),
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(firstByteTimeout);
    const timedOut = error?.name === "AbortError";
    return json(timedOut ? 504 : 502, {
      error: timedOut
        ? "Chutes did not start responding before the Netlify function timeout. Try a smaller/faster model or lower max tokens."
        : "Unable to reach Chutes API.",
      detail: error.message
    });
  }

  clearTimeout(firstByteTimeout);

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return json(upstream.status, {
      error: data.error?.message || data.detail || data.message || "Chutes API request failed.",
      status: upstream.status,
      upstream: data
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
