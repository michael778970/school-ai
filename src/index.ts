/**
 * Educational LLM Chat Application Template with Login/Signup
 *
 * Enhanced version of a simple chat app using Cloudflare Workers AI.
 * Includes authentication and an instructional-style assistant.
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";

const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const SYSTEM_PROMPT =
  "You are an educational assistant who helps students learn. Do not give direct answers. Instead, guide students through the process, offering hints, explanations, and encouragement to find the answer on their own.";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === "/api/chat") {
      if (request.method === "POST") {
        return handleChatRequest(request, env);
      }
      return new Response("Method not allowed", { status: 405 });
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      return handleLogin(request);
    }

    if (url.pathname === "/api/signup" && request.method === "POST") {
      return handleSignup(request);
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handleChatRequest(request: Request, env: Env): Promise<Response> {
  try {
    const { messages = [], token } = (await request.json()) as {
      messages: ChatMessage[];
      token?: string;
    };

    if (!validateToken(token)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    if (!messages.some((msg) => msg.role === "system")) {
      messages.unshift({ role: "system", content: SYSTEM_PROMPT });
    }

    const response = await env.AI.run(
      MODEL_ID,
      { messages, max_tokens: 1024 },
      { returnRawResponse: true }
    );

    return response;
  } catch (error) {
    console.error("Error processing chat request:", error);
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

async function handleLogin(request: Request): Promise<Response> {
  const { username, password } = await request.json();
  // Replace with secure check
  if (username === "student" && password === "learn123") {
    return new Response(JSON.stringify({ token: "valid_token" }), {
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: "Invalid credentials" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

async function handleSignup(request: Request): Promise<Response> {
  const { username, password } = await request.json();
  // Simulate saving user (replace with actual storage)
  console.log(`Signup request: ${username}`);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "content-type": "application/json" },
  });
}

function validateToken(token?: string): boolean {
  return token === "valid_token"; // Replace with real token validation
}
