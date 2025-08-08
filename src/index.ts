const SYSTEM_PROMPT = "You are an educational assistant who helps students learn. Do not give direct answers. Instead, guide students through the process, offering hints, explanations, and encouragement to find the answer on their own.";

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      const html = `
        <html>
          <head><title>Dummy Edu Assistant</title></head>
          <body>
            <h1>Welcome to Dummy Edu Assistant!</h1>
            <p>Use <code>/api/chat</code> POST endpoint with a valid token ("valid_token") to get a dummy response.</p>
          </body>
        </html>
      `;
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // API Routes
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChatRequest(request);
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      return handleLogin(request);
    }

    if (url.pathname === "/api/signup" && request.method === "POST") {
      return handleSignup(request);
    }

    // Anything else = 404
    return new Response("Not found", { status: 404 });
  }
};

async function handleChatRequest(request: Request) {
  try {
    const { messages = [], token } = await request.json();

    if (token !== "valid_token") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Dummy reply ignoring input
    return new Response(
      JSON.stringify({
        id: "dummy-1",
        choices: [
          {
            message: {
              role: "assistant",
              content: "Hi there! This is a dummy reply. Have fun learning!"
            }
          }
        ]
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Chat failed", details: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function handleLogin(request: Request) {
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
  } catch (e) {
    return new Response(JSON.stringify({ error: "Login failed", details: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function handleSignup(request: Request) {
  try {
    const { username } = await request.json();
    console.log(`Signup requested: ${username}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Signup failed", details: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
