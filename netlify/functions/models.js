import shared from "./shared.js";

const {
  CHUTES_BASE_URL,
  FALLBACK_MODELS,
  getApiKey,
  headersForChutes,
  sortAndNormalizeModels
} = shared;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
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
  if (request.method !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = getApiKey(getHeaderObject(request));

  try {
    const response = await fetch(`${CHUTES_BASE_URL}/models`, {
      method: "GET",
      headers: apiKey ? headersForChutes(apiKey) : {}
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Chutes /models failed with ${response.status}: ${text.slice(0, 300)}`);
    }

    const data = await response.json();
    const models = sortAndNormalizeModels(data.data || []);

    if (!models.length) {
      throw new Error("Chutes returned no chat-capable LLM models.");
    }

    return json(200, {
      source: "chutes-live",
      generated_at: new Date().toISOString(),
      count: models.length,
      models
    });
  } catch (error) {
    const models = sortAndNormalizeModels(FALLBACK_MODELS);
    return json(200, {
      source: "fallback-documented",
      generated_at: new Date().toISOString(),
      count: models.length,
      warning: error.message,
      models
    });
  }
}
