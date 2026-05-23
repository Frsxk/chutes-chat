const {
  CHUTES_BASE_URL,
  FALLBACK_MODELS,
  json,
  getApiKey,
  headersForChutes,
  sortAndNormalizeModels
} = require("./shared");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = getApiKey(event.headers || {});

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
};
