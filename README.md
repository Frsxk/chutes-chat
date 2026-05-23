# Chutes Chat

A full ChatGPT-like web application that routes model discovery and chat completions through the Chutes OpenAI-compatible API. The app is ready for Netlify and stores each user's chat history locally in their browser with `localStorage`.

## What it does

- ChatGPT-style interface with a sidebar of saved conversations.
- Chutes-only agent/model selector.
- Runtime model discovery from `https://llm.chutes.ai/v1/models` through a Netlify Function.
- Fallback Chutes model list bundled from current documentation.
- Models sorted from strongest to weakest with a deterministic capability heuristic that weighs known model families, parameter scale, reasoning/tool support, context length, and modalities.
- Chat requests proxied through a Netlify Function to `https://llm.chutes.ai/v1/chat/completions`.
- Persistent local chat storage per browser/user.
- Export/import local chats as JSON.
- Optional local fallback API key setting when no Netlify environment key is configured.

## Project structure

```txt
public/
  index.html
  styles.css
  app.js
  _redirects
netlify/functions/
  chat.js
  models.js
  shared.js
netlify.toml
package.json
```

## Deploy to Netlify

### Option 1: Drag-and-drop deploy

1. Zip this folder.
2. Drag it into Netlify's deploy UI.
3. Add `CHUTES_API_KEY` in Netlify site settings under environment variables.
4. Redeploy after setting the environment variable.

### Option 2: Git deploy

1. Push the folder to a Git repository.
2. Create a new Netlify site from the repository.
3. Netlify uses `netlify.toml` automatically:
   - Build command: `npm run build`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
4. Add `CHUTES_API_KEY` in Netlify environment variables.
5. Deploy.

## Run locally

```bash
npm install
npm start
```

That runs `netlify dev`, which serves the static app and the API functions together.

## API key behavior

The recommended production setup is a Netlify environment variable:

```txt
CHUTES_API_KEY=cpk_...
```

If that is not set, users can add a personal key in Settings. That key is saved only in their browser local storage and sent to your Netlify Function as a request header. Do not use the local key option for strict enterprise security; use a server-side environment variable instead.

## Persistence behavior

Chats are saved with browser `localStorage`, so every visitor keeps their own conversations on the same device and browser after refreshes and revisits. This does not create cross-device accounts or server-side shared history. To add account-based sync later, replace the storage helpers in `public/app.js` with a database-backed API.

## Notes on the agent selector

The selector only uses Chutes-compatible chat models. On startup it calls `/api/models`, which proxies to Chutes' live `/models` endpoint. If the live request fails, it uses the bundled Chutes fallback list. The ranking is transparent but approximate: model families such as GLM 5, Kimi K2, Qwen 3 large variants, DeepSeek R1/V3, and large coder models are weighted above smaller instruct models.
