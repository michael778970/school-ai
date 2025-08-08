export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
        // Serve static assets if available
        if (env.ASSETS) {
          try {
            const assetResponse = await env.ASSETS.fetch(request);
            if (assetResponse.status !== 404) return assetResponse;
          } catch (e) {
            console.error("Asset fetch failed:", e);
          }
        }
        return new Response("Not found", { status: 404 });
      }

      if (url.pathname === "/api/chat" && request.method === "POST") {
        return await handleChatRequest(request, env);
      }
      if (url.pathname === "/api/login" && request.method === "POST") {
        return await handleLogin(request);
      }
      if (url.pathname === "/api/signup" && request.method === "POST") {
        return await handleSignup(request);
      }

      return new Response("Not found", { status: 404 });
    } catch (err) {
      console.error("Worker crashed:", err);
      return new Response(
        JSON.stringify({ error: "Internal Server Error", details: err.message || String(err) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
};

async function handleChatRequest(request, env) {
  try {
    const { messages = [], token } = await request.json();

    if (!validateToken(token)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Inject system prompt if missing
    if (!messages.some(msg => msg.role === "system")) {
      messages.unshift({ role: "system", content: SYSTEM_PROMPT });
    }

    if (!env.AI) {
      return new Response(JSON.stringify({ error: "AI binding missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const response = await env.AI.run(
      MODEL_ID,
      { messages, max_tokens: 1024 },
      { returnRawResponse: true }
    );

    return response;

  } catch (err) {
    console.error("Chat request error:", err);
    return new Response(
      JSON.stringify({ error: "Chat processing failed", details: err.message || String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function handleLogin(request) {
  try {
    const { username, password } = await request.json();

    if (username === "student" && password === "learn123") {
      return new Response(JSON.stringify({ token: "valid_token" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ error: "Invalid credentials" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Login failed", details: err.message || String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function handleSignup(request) {
  try {
    const { username, password } = await request.json();
    console.log(`Signup request: ${username}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Signup failed", details: err.message || String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

function validateToken(token) {
  return token === "valid_token";
}

const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const SYSTEM_PROMPT = "You are an educational assistant who helps students learn. Do not give direct answers. Instead, guide students through the process, offering hints, explanations, and encouragement to find the answer on their own.";
