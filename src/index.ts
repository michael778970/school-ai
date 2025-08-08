export interface Env {
  AI: any; // Workers AI binding (set in wrangler.toml)
  ASSETS: Fetcher; // Static asset binding (optional, for serving files)
}

const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const SYSTEM_PROMPT = `
You are an educational assistant. Help the user learn by guiding them
to find answers themselves, rather than giving direct solutions.
`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Serve static files if it's not an API request
    if (!url.pathname.startsWith("/api")) {
      return env.ASSETS.fetch(request);
    }

    // API routes
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChatRequest(request, env);
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      return handleLogin(request);
    }

    if (url.pathname === "/api/signup" && request.method === "POST") {
      return handleSignup(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};

// ----------------- API HANDLERS -----------------

async function handleChatRequest(request: Request, env: Env) {
  try {
    const body = await request.json().catch(() => ({}));
    const messages = body.messages || [];
    const token = body.token;

    if (!validateToken(token)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Add system prompt if not already present
    if (!messages.some((m: any) => m.role === "system")) {
      messages.unshift({ role: "system", content: SYSTEM_PROMPT });
    }

    if (!env?.AI?.run) {
      console.error("AI binding not available");
      return jsonResponse(
        { error: "AI binding missing. Check wrangler.toml." },
        500
      );
    }

    const aiResult = await env.AI.run(
      MODEL_ID,
      { messages, max_tokens: 1024 },
      { returnRawResponse: true }
    );

    // Forward raw response if provided
    if (aiResult instanceof Response) {
      return aiResult;
    }

    return jsonResponse(aiResult);
  } catch (err: any) {
    console.error("Chat error:", err);
    return jsonResponse({ error: err?.message || String(err) }, 500);
  }
}

async function handleLogin(request: Request) {
  const { username, password } = await request.json();
  if (username === "student" && password === "learn123") {
    return jsonResponse({ token: "valid_token" });
  }
  return jsonResponse({ error: "Invalid credentials" }, 401);
}

async function handleSignup(request: Request) {
  // In production, save user to a database
  const { username } = await request.json();
  return jsonResponse({ message: `User '${username}' registered successfully.` });
}

// ----------------- HELPERS -----------------

function validateToken(token: string) {
  return token === "valid_token";
}

function jsonResponse(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
